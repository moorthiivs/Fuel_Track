import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CapacitorSqliteDriver } from '../../src/database/driver'

// Mock the native @capacitor-community/sqlite plugin
const mockDbConnection = {
  isDBOpen: vi.fn().mockResolvedValue({ result: false }),
  open: vi.fn().mockResolvedValue(undefined),
  execute: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
  run: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
  query: vi.fn().mockResolvedValue({ values: [{ count: 1 }] }),
  beginTransaction: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
  commitTransaction: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
  rollbackTransaction: vi.fn().mockResolvedValue({ changes: { changes: 0 } }),
  isTransactionActive: vi.fn().mockResolvedValue({ result: true }),
  close: vi.fn().mockResolvedValue(undefined),
}

const mockSqlitePlugin = {
  checkConnectionsConsistency: vi.fn().mockResolvedValue({ result: true }),
  isConnection: vi.fn().mockResolvedValue({ result: false }),
  createConnection: vi.fn().mockResolvedValue(mockDbConnection),
  retrieveConnection: vi.fn().mockResolvedValue(mockDbConnection),
}

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: class {
    constructor() {
      return mockSqlitePlugin
    }
  },
}))

describe('CapacitorSqliteDriver Native Transaction Lifecycle', () => {
  let driver: CapacitorSqliteDriver

  beforeEach(() => {
    vi.clearAllMocks()
    driver = new CapacitorSqliteDriver()
  })

  it('passes transaction: true to execute and run outside of a transaction', async () => {
    await driver.init()

    await driver.execute('CREATE TABLE IF NOT EXISTS test (id INT);')
    expect(mockDbConnection.execute).toHaveBeenCalledWith(
      'CREATE TABLE IF NOT EXISTS test (id INT);',
      true
    )

    await driver.execute('INSERT INTO test (id) VALUES (?);', [123])
    expect(mockDbConnection.run).toHaveBeenCalledWith(
      'INSERT INTO test (id) VALUES (?);',
      [123],
      true
    )
  })

  it('manages native transactions atomically and passes transaction: false to inner operations', async () => {
    await driver.init()

    const result = await driver.runTransaction(async (tx) => {
      await tx.execute('INSERT INTO test (id) VALUES (?);', [456])
      await tx.execute('UPDATE test SET id = 789 WHERE id = 456;')
      return 'SUCCESS'
    })

    expect(result).toBe('SUCCESS')
    expect(mockDbConnection.beginTransaction).toHaveBeenCalledTimes(1)
    expect(mockDbConnection.run).toHaveBeenCalledWith(
      'INSERT INTO test (id) VALUES (?);',
      [456],
      false
    )
    expect(mockDbConnection.execute).toHaveBeenCalledWith(
      'UPDATE test SET id = 789 WHERE id = 456;',
      false
    )
    expect(mockDbConnection.commitTransaction).toHaveBeenCalledTimes(1)
    expect(mockDbConnection.rollbackTransaction).not.toHaveBeenCalled()
  })

  it('rolls back native transaction cleanly when an error is thrown inside the callback', async () => {
    await driver.init()

    await expect(
      driver.runTransaction(async (tx) => {
        await tx.execute('INSERT INTO test (id) VALUES (?);', [999])
        throw new Error('Database integrity failure')
      })
    ).rejects.toThrow('Database integrity failure')

    expect(mockDbConnection.beginTransaction).toHaveBeenCalledTimes(1)
    expect(mockDbConnection.commitTransaction).not.toHaveBeenCalled()
    expect(mockDbConnection.isTransactionActive).toHaveBeenCalledTimes(1)
    expect(mockDbConnection.rollbackTransaction).toHaveBeenCalledTimes(1)
  })

  it('does not attempt to re-open an already open database connection', async () => {
    mockDbConnection.isDBOpen.mockResolvedValueOnce({ result: true })
    await driver.init()

    expect(mockDbConnection.open).not.toHaveBeenCalled()
  })
})
