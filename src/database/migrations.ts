import type { DatabaseDriver } from './driver'
import { CREATE_TABLES_SQL } from './schema'

export interface Migration {
  version: number
  description: string
  up: (driver: DatabaseDriver) => Promise<void>
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema: vehicles, fuel_entries, fuel_photos, ocr_results',
    up: async (driver: DatabaseDriver) => {
      for (const statement of CREATE_TABLES_SQL) {
        await driver.execute(statement)
      }
    },
  },
]

export class MigrationRunner {
  static async run(driver: DatabaseDriver): Promise<void> {
    // 1. Ensure migrations table exists
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        appliedAt TEXT NOT NULL
      );
    `)

    // 2. Fetch applied migrations
    const appliedRows = await driver.query<{ version: number }>(
      `SELECT version FROM schema_migrations ORDER BY version ASC;`
    )
    const appliedVersions = new Set(appliedRows.map((r) => r.version))

    // 3. Apply pending migrations in order
    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        console.log(`[MigrationRunner] Applying migration v${migration.version}: ${migration.description}`)
        await migration.up(driver)
        await driver.execute(
          `INSERT INTO schema_migrations (version, appliedAt) VALUES (?, ?);`,
          [migration.version, new Date().toISOString()]
        )
      }
    }
  }
}
