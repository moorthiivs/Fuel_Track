import { dbManager } from '../database'
import type { DatabaseDriver } from '../driver'

export interface PhotoRecord {
  id: string
  fuelEntryId: string
  photoType: 'METER' | 'VEHICLE'
  localPath: string
  fileName: string
  capturedAt: string
  createdAt?: string
}

export class PhotoRepository {
  private driverOverride?: DatabaseDriver

  constructor(driverOverride?: DatabaseDriver) {
    this.driverOverride = driverOverride
  }

  private async getDriver(tx?: DatabaseDriver): Promise<DatabaseDriver> {
    return tx || this.driverOverride || dbManager.getDriver()
  }

  async create(photo: PhotoRecord, tx?: DatabaseDriver): Promise<PhotoRecord> {
    const driver = await this.getDriver(tx)
    const id = photo.id || `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()

    await driver.execute(
      `INSERT INTO fuel_photos (id, fuelEntryId, photoType, localPath, fileName, capturedAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        photo.fuelEntryId,
        photo.photoType,
        photo.localPath,
        photo.fileName,
        photo.capturedAt || now,
        now,
      ]
    )

    return { ...photo, id, createdAt: now }
  }

  async getByFuelEntryId(fuelEntryId: string, tx?: DatabaseDriver): Promise<PhotoRecord[]> {
    const driver = await this.getDriver(tx)
    const rows = await driver.query<any>(
      `SELECT id, fuelEntryId, photoType, localPath, fileName, capturedAt, createdAt
       FROM fuel_photos
       WHERE fuelEntryId = ?
       ORDER BY createdAt ASC;`,
      [fuelEntryId]
    )

    return rows.map((r) => ({
      id: r.id,
      fuelEntryId: r.fuelEntryId,
      photoType: r.photoType,
      localPath: r.localPath,
      fileName: r.fileName,
      capturedAt: r.capturedAt,
      createdAt: r.createdAt,
    }))
  }

  async delete(id: string): Promise<boolean> {
    const driver = await this.getDriver()
    await driver.execute(`DELETE FROM fuel_photos WHERE id = ?;`, [id])
    return true
  }

  async deleteByFuelEntryId(fuelEntryId: string, tx?: DatabaseDriver): Promise<boolean> {
    const driver = await this.getDriver(tx)
    await driver.execute(`DELETE FROM fuel_photos WHERE fuelEntryId = ?;`, [fuelEntryId])
    return true
  }
}

export const photoRepository = new PhotoRepository()
