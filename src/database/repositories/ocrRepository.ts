import { dbManager } from '../database'
import type { DatabaseDriver } from '../driver'

export interface OcrRecord {
  id?: string
  fuelEntryId: string
  fieldName: string
  extractedValue: number
  confidence: number
  source: string
  createdAt?: string
}

export class OcrRepository {
  private driverOverride?: DatabaseDriver

  constructor(driverOverride?: DatabaseDriver) {
    this.driverOverride = driverOverride
  }

  private async getDriver(tx?: DatabaseDriver): Promise<DatabaseDriver> {
    return tx || this.driverOverride || dbManager.getDriver()
  }

  async create(record: OcrRecord, tx?: DatabaseDriver): Promise<OcrRecord> {
    const driver = await this.getDriver(tx)
    const id = record.id || `ocr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()

    await driver.execute(
      `INSERT INTO ocr_results (id, fuelEntryId, fieldName, extractedValue, confidence, source, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        record.fuelEntryId,
        record.fieldName,
        record.extractedValue,
        record.confidence,
        record.source,
        now,
      ]
    )

    return { ...record, id, createdAt: now }
  }

  async getByFuelEntryId(fuelEntryId: string, tx?: DatabaseDriver): Promise<OcrRecord[]> {
    const driver = await this.getDriver(tx)
    const rows = await driver.query<any>(
      `SELECT id, fuelEntryId, fieldName, extractedValue, confidence, source, createdAt
       FROM ocr_results
       WHERE fuelEntryId = ?;`,
      [fuelEntryId]
    )

    return rows.map((r) => ({
      id: r.id,
      fuelEntryId: r.fuelEntryId,
      fieldName: r.fieldName,
      extractedValue: Number(r.extractedValue),
      confidence: Number(r.confidence),
      source: r.source,
      createdAt: r.createdAt,
    }))
  }
}

export const ocrRepository = new OcrRepository()
