import { createDatabaseDriver, type DatabaseDriver } from './driver'
import { MigrationRunner } from './migrations'
import { DatabaseSeeder } from './seed'

export type DatabaseStatus = 'IDLE' | 'INITIALIZING' | 'READY' | 'ERROR'

export class DatabaseManager {
  private static instance: DatabaseManager | null = null
  private driver: DatabaseDriver | null = null
  private isInitialized = false
  private status: DatabaseStatus = 'IDLE'
  private initError: Error | null = null
  private initPromise: Promise<DatabaseDriver> | null = null

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  getStatus(): DatabaseStatus {
    return this.status
  }

  getError(): Error | null {
    return this.initError
  }

  async getDriver(): Promise<DatabaseDriver> {
    if (this.driver && this.isInitialized && this.status === 'READY') {
      return this.driver
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.status = 'INITIALIZING'
    this.initError = null

    this.initPromise = (async () => {
      try {
        const driver = this.driver || (await createDatabaseDriver())
        await MigrationRunner.run(driver)
        await DatabaseSeeder.seedIfEmpty(driver)
        this.driver = driver
        this.isInitialized = true
        this.status = 'READY'
        return driver
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        this.status = 'ERROR'
        this.initError = errorObj
        this.initPromise = null
        console.error('[DatabaseManager] Initialization error:', errorObj)
        throw errorObj
      }
    })()

    return this.initPromise
  }

  async retryInitialization(): Promise<DatabaseDriver> {
    this.initPromise = null
    this.driver = null
    this.isInitialized = false
    this.status = 'IDLE'
    this.initError = null
    return this.getDriver()
  }

  async runTransaction<T>(callback: (tx: DatabaseDriver) => Promise<T>): Promise<T> {
    const driver = await this.getDriver()
    return driver.runTransaction(callback)
  }

  /**
   * For automated testing: reset the database state and driver.
   */
  async resetForTesting(customDriver?: DatabaseDriver): Promise<DatabaseDriver> {
    if (this.driver) {
      await this.driver.close().catch(() => {})
    }
    this.driver = customDriver || null
    this.isInitialized = false
    this.initPromise = null

    return this.getDriver()
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
      this.isInitialized = false
      this.initPromise = null
    }
  }
}

export const dbManager = DatabaseManager.getInstance()
