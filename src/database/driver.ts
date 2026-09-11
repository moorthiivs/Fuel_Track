import { Capacitor } from '@capacitor/core'
import type { Database as SqlJsDatabase } from 'sql.js'

export interface DatabaseDriver {
  execute(sql: string, params?: any[]): Promise<void>
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  runTransaction<T>(callback: (tx: DatabaseDriver) => Promise<T>): Promise<T>
  close(): Promise<void>
}

/**
 * Universal Web & Test SQLite Driver using sql.js.
 * Operates purely in-memory during automated testing, and persists to
 * IndexedDB/Web Storage when running in a desktop web browser.
 */
export class SqlJsDriver implements DatabaseDriver {
  private db: SqlJsDatabase | null = null
  private storageKey = 'fueltrack_sqlite_web_db'
  private inMemory: boolean

  constructor(inMemory = false, dbInstance?: SqlJsDatabase) {
    this.inMemory = inMemory
    if (dbInstance) {
      this.db = dbInstance
    }
  }

  async init(): Promise<void> {
    if (this.db) return

    try {
      // Dynamic import to support both Vite browser environment and Node/Vitest
      const initSqlJs = (await import('sql.js')).default

      let wasmBinary: ArrayBuffer | undefined = undefined
      const globalProcess = (globalThis as any).process
      const isNode = typeof globalProcess !== 'undefined' && globalProcess.versions?.node != null
      if (isNode) {
        try {
          const fs = await import(/* @vite-ignore */ ('fs' as string))
          const path = await import(/* @vite-ignore */ ('path' as string))
          const wasmPath = path.resolve(globalProcess.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
          if (fs.existsSync(wasmPath)) {
            const buf = fs.readFileSync(wasmPath)
            wasmBinary = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
          }
        } catch {
          // Ignore if in browser
        }
      } else if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        try {
          const resp = await fetch('/sql-wasm.wasm')
          if (resp.ok) {
            wasmBinary = await resp.arrayBuffer()
          }
        } catch {
          // Fall back to locateFile
        }
      }

      const SQL = await initSqlJs({
        wasmBinary,
        locateFile: (file: string) => (file.endsWith('.wasm') ? '/sql-wasm.wasm' : file),
      })

      // In browser, check if existing binary database is saved
      if (!this.inMemory && typeof window !== 'undefined' && window.localStorage) {
        const savedBase64 = localStorage.getItem(this.storageKey)
        if (savedBase64) {
          try {
            const binary = Uint8Array.from(atob(savedBase64), (c) => c.charCodeAt(0))
            this.db = new SQL.Database(binary)
          } catch (loadErr) {
            console.warn('[SqlJsDriver] Could not load saved database, initializing fresh:', loadErr)
          }
        }
      }

      if (!this.db) {
        this.db = new SQL.Database()
      }
      this.db.run('PRAGMA foreign_keys = ON;')
    } catch (err) {
      console.error('[SqlJsDriver] Failed to initialize sql.js:', err)
      throw err
    }
  }

  private inTransaction = false

  private saveToStorage(): void {
    if (this.inMemory || this.inTransaction) return
    if (!this.db || typeof window === 'undefined' || !window.localStorage) return
    try {
      const data = this.db.export()
      // Chunked conversion to base64
      let binary = ''
      const bytes = new Uint8Array(data)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      localStorage.setItem(this.storageKey, btoa(binary))
    } catch (saveErr) {
      console.warn('[SqlJsDriver] Storage sync failed:', saveErr)
    }
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) await this.init()
    if (!this.db) throw new Error('[SqlJsDriver] Database not initialized')

    if (!params || params.length === 0) {
      this.db.run(sql)
    } else {
      this.db.run(sql, params)
    }
    this.saveToStorage()
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) await this.init()
    if (!this.db) throw new Error('[SqlJsDriver] Database not initialized')

    const stmt = this.db.prepare(sql)
    const results: T[] = []

    try {
      stmt.bind(params)
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T)
      }
    } finally {
      stmt.free()
    }

    return results
  }

  async runTransaction<T>(callback: (tx: DatabaseDriver) => Promise<T>): Promise<T> {
    if (!this.db) await this.init()
    if (!this.db) throw new Error('[SqlJsDriver] Database not initialized')

    this.inTransaction = true
    this.db.run('BEGIN TRANSACTION;')
    try {
      const result = await callback(this)
      this.db.run('COMMIT;')
      this.inTransaction = false
      this.saveToStorage()
      return result
    } catch (error) {
      this.inTransaction = false
      try {
        this.db.run('ROLLBACK;')
      } catch (rollbackError) {
        console.warn('[SqlJsDriver] Rollback error:', rollbackError)
      }
      throw error
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

/**
 * Native Android / iOS SQLite Driver using @capacitor-community/sqlite.
 * Stores SQLite database inside private application sandbox.
 */
export class CapacitorSqliteDriver implements DatabaseDriver {
  private dbName = 'fueltrack'
  private connection: any = null
  private sqlitePlugin: any = null

  async init(): Promise<void> {
    if (this.connection) return

    try {
      const { CapacitorSQLite, SQLiteConnection } = await import(
        '@capacitor-community/sqlite'
      )
      this.sqlitePlugin = new SQLiteConnection(CapacitorSQLite)

      const ret = await this.sqlitePlugin.checkConnectionsConsistency()
      const isConn = (await this.sqlitePlugin.isConnection(this.dbName, false)).result

      if (ret.result && isConn) {
        this.connection = await this.sqlitePlugin.retrieveConnection(
          this.dbName,
          false
        )
      } else {
        this.connection = await this.sqlitePlugin.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        )
      }

      await this.connection.open()
      await this.connection.execute('PRAGMA foreign_keys = ON;')
    } catch (err) {
      console.error('[CapacitorSqliteDriver] Failed to open native connection:', err)
      throw err
    }
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.connection) await this.init()
    if (!params || params.length === 0) {
      await this.connection.execute(sql)
    } else {
      await this.connection.run(sql, params)
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) await this.init()
    const res = await this.connection.query(sql, params || [])
    return (res.values || []) as T[]
  }

  async runTransaction<T>(callback: (tx: DatabaseDriver) => Promise<T>): Promise<T> {
    if (!this.connection) await this.init()
    await this.connection.execute('BEGIN TRANSACTION;')
    try {
      const result = await callback(this)
      await this.connection.execute('COMMIT;')
      return result
    } catch (error) {
      try {
        await this.connection.execute('ROLLBACK;')
      } catch (rollbackError) {
        console.warn('[CapacitorSqliteDriver] Rollback error:', rollbackError)
      }
      throw error
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close()
      this.connection = null
    }
  }
}

/**
 * Driver Factory: Detects current runtime and instantiates the optimal driver.
 */
export async function createDatabaseDriver(): Promise<DatabaseDriver> {
  if (Capacitor.isNativePlatform()) {
    const driver = new CapacitorSqliteDriver()
    await driver.init()
    return driver
  }

  const driver = new SqlJsDriver()
  await driver.init()
  return driver
}
