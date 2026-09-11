import { dbManager } from '../database'
import type { DatabaseDriver } from '../driver'
import type { FuelEntry, FuelType } from '../../types/fuel'
import { photoRepository, type PhotoRecord } from './photoRepository'
import { ocrRepository, type OcrRecord } from './ocrRepository'
import { photoStorageService } from '../../services/photoStorageService'

export interface FuelEntryInput {
  id?: string
  vehicleId: string
  vehicleNumber?: string
  capturedAt: string
  fuelStationName: string
  locationAddress: string
  latitude: number
  longitude: number
  fuelType: FuelType | string
  quantity: number
  amount: number
  rate: number
  odometer: number
  previousOdometer?: number
  distance?: number
  mileage?: number
  verificationStatus?: string
  notes?: string
}

export interface FuelEntryFilter {
  vehicleId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export interface AnalyticsMetrics {
  totalCost: number
  totalLitres: number
  totalDistance: number
  averageMileage: number
  lastOdometer: number
  entryCount: number
}

export class FuelRepository {
  private driverOverride?: DatabaseDriver

  constructor(driverOverride?: DatabaseDriver) {
    this.driverOverride = driverOverride
  }

  private async getDriver(): Promise<DatabaseDriver> {
    return this.driverOverride || dbManager.getDriver()
  }

  /**
   * Atomic Transactional Save:
   * Inserts fuel entry, photo references, OCR extraction audits, and updates vehicle odometer.
   * If any step fails, all operations roll back cleanly.
   */
  async createWithTransaction(
    entry: FuelEntryInput,
    photos: Omit<PhotoRecord, 'id' | 'fuelEntryId'>[] = [],
    ocrResults: Omit<OcrRecord, 'id' | 'fuelEntryId'>[] = [],
    options?: { allowOdometerReset?: boolean }
  ): Promise<FuelEntry> {
    const driver = await this.getDriver()
    const id = entry.id || `fuel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()

    return driver.runTransaction(async (tx) => {
      // 0. Verify referenced vehicle exists and is active
      const vehicleRows = await tx.query<any>(
        `SELECT id, vehicleNumber FROM vehicles WHERE id = ? AND isActive = 1 LIMIT 1;`,
        [entry.vehicleId]
      )
      if (vehicleRows.length === 0) {
        throw new Error(`Vehicle with ID "${entry.vehicleId}" does not exist or is inactive.`)
      }
      const vehicleNumber = vehicleRows[0].vehicleNumber

      // 1. Insert Fuel Entry
      await tx.execute(
        `INSERT INTO fuel_entries (
          id, vehicleId, capturedAt, fuelStationName, locationAddress, latitude, longitude,
          fuelType, quantity, amount, rate, odometer, previousOdometer, distance, mileage,
          verificationStatus, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          entry.vehicleId,
          entry.capturedAt || now,
          entry.fuelStationName,
          entry.locationAddress,
          entry.latitude,
          entry.longitude,
          entry.fuelType,
          entry.quantity,
          entry.amount,
          entry.rate,
          entry.odometer,
          entry.previousOdometer || null,
          entry.distance || null,
          entry.mileage || null,
          entry.verificationStatus || 'USER_CONFIRMED',
          entry.notes || null,
          now,
          now,
        ]
      )

      // 2. Insert Photos
      let meterPhotoUri = ''
      let vehiclePhotoUri = ''

      for (const p of photos) {
        await photoRepository.create(
          {
            id: `photo-${p.photoType.toLowerCase()}-${id}`,
            fuelEntryId: id,
            photoType: p.photoType,
            localPath: p.localPath,
            fileName: p.fileName,
            capturedAt: p.capturedAt || now,
          },
          tx
        )

        if (p.photoType === 'METER') meterPhotoUri = p.localPath
        if (p.photoType === 'VEHICLE') vehiclePhotoUri = p.localPath
      }

      // 3. Insert OCR Results
      for (const ocr of ocrResults) {
        await ocrRepository.create(
          {
            fuelEntryId: id,
            fieldName: ocr.fieldName,
            extractedValue: ocr.extractedValue,
            confidence: ocr.confidence,
            source: ocr.source,
          },
          tx
        )
      }

      // 4. Update Vehicle Current Odometer
      if (options?.allowOdometerReset === true) {
        await tx.execute(
          `UPDATE vehicles
           SET currentOdometer = ?, updatedAt = ?
           WHERE id = ?;`,
          [entry.odometer, now, entry.vehicleId]
        )
      } else {
        await tx.execute(
          `UPDATE vehicles
           SET currentOdometer = MAX(currentOdometer, ?), updatedAt = ?
           WHERE id = ?;`,
          [entry.odometer, now, entry.vehicleId]
        )
      }

      const dateStr = (entry.capturedAt || now).split('T')[0]
      const timeStr = (entry.capturedAt || now).split('T')[1]?.slice(0, 5) || '12:00'

      return {
        id,
        vehicleNumber,
        fuelType: entry.fuelType,
        stationName: entry.fuelStationName,
        location: entry.locationAddress,
        latitude: entry.latitude,
        longitude: entry.longitude,
        quantity: entry.quantity,
        amount: entry.amount,
        rate: entry.rate,
        odometer: entry.odometer,
        previousOdometer: entry.previousOdometer,
        distance: entry.distance,
        mileage: entry.mileage,
        date: dateStr,
        time: timeStr,
        meterPhotoUri,
        vehiclePhotoUri,
        ocrConfidence: {
          quantity: ocrResults.find((o) => o.fieldName === 'quantity')?.confidence || 100,
          amount: ocrResults.find((o) => o.fieldName === 'amount')?.confidence || 100,
          odometer: ocrResults.find((o) => o.fieldName === 'odometer')?.confidence || 100,
        },
        notes: entry.notes,
        createdAt: now,
      }
    })
  }

  async getAll(filter?: FuelEntryFilter): Promise<FuelEntry[]> {
    const driver = await this.getDriver()
    let sql = `
      SELECT 
        e.id, e.vehicleId, v.vehicleNumber, e.capturedAt, e.fuelStationName, e.locationAddress,
        e.latitude, e.longitude, e.fuelType, e.quantity, e.amount, e.rate, e.odometer,
        e.previousOdometer, e.distance, e.mileage, e.verificationStatus, e.notes, e.createdAt
      FROM fuel_entries e
      LEFT JOIN vehicles v ON e.vehicleId = v.id
      WHERE e.deletedAt IS NULL
    `
    const params: any[] = []

    if (filter?.vehicleId) {
      sql += ` AND e.vehicleId = ?`
      params.push(filter.vehicleId)
    }

    if (filter?.dateFrom) {
      sql += ` AND e.capturedAt >= ?`
      params.push(filter.dateFrom)
    }

    if (filter?.dateTo) {
      sql += ` AND e.capturedAt <= ?`
      params.push(filter.dateTo)
    }

    if (filter?.search) {
      sql += ` AND (e.fuelStationName LIKE ? OR e.locationAddress LIKE ? OR v.vehicleNumber LIKE ?)`
      const searchPattern = `%${filter.search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    sql += ` ORDER BY e.capturedAt DESC`

    if (filter?.limit) {
      sql += ` LIMIT ?`
      params.push(filter.limit)
      if (filter?.offset) {
        sql += ` OFFSET ?`
        params.push(filter.offset)
      }
    }

    const rows = await driver.query<any>(sql, params)

    return rows.map((r) => {
      const datePart = (r.capturedAt || '').split('T')[0] || ''
      const timePart = (r.capturedAt || '').split('T')[1]?.slice(0, 5) || ''

      return {
        id: r.id,
        vehicleNumber: r.vehicleNumber || '',
        fuelType: r.fuelType,
        stationName: r.fuelStationName,
        location: r.locationAddress,
        latitude: Number(r.latitude) || 0,
        longitude: Number(r.longitude) || 0,
        quantity: Number(r.quantity),
        amount: Number(r.amount),
        rate: Number(r.rate),
        odometer: Number(r.odometer),
        previousOdometer: r.previousOdometer ? Number(r.previousOdometer) : undefined,
        distance: r.distance ? Number(r.distance) : undefined,
        mileage: r.mileage ? Number(r.mileage) : undefined,
        date: datePart,
        time: timePart,
        ocrConfidence: {
          quantity: 98,
          amount: 96,
          odometer: 99,
        },
        notes: r.notes || undefined,
        createdAt: r.createdAt,
      }
    })
  }

  async getById(id: string): Promise<FuelEntry | null> {
    const driver = await this.getDriver()
    const rows = await driver.query<any>(
      `SELECT 
        e.id, e.vehicleId, v.vehicleNumber, e.capturedAt, e.fuelStationName, e.locationAddress,
        e.latitude, e.longitude, e.fuelType, e.quantity, e.amount, e.rate, e.odometer,
        e.previousOdometer, e.distance, e.mileage, e.verificationStatus, e.notes, e.createdAt
       FROM fuel_entries e
       LEFT JOIN vehicles v ON e.vehicleId = v.id
       WHERE e.id = ? AND e.deletedAt IS NULL LIMIT 1;`,
      [id]
    )

    if (rows.length === 0) return null
    const r = rows[0]

    // Fetch photos
    const photos = await photoRepository.getByFuelEntryId(id, driver)
    const meterPhoto = photos.find((p) => p.photoType === 'METER')?.localPath
    const vehiclePhoto = photos.find((p) => p.photoType === 'VEHICLE')?.localPath

    // Fetch OCR confidence
    const ocrList = await ocrRepository.getByFuelEntryId(id, driver)
    const quantityConf = ocrList.find((o) => o.fieldName === 'quantity')?.confidence || 98
    const amountConf = ocrList.find((o) => o.fieldName === 'amount')?.confidence || 96
    const odoConf = ocrList.find((o) => o.fieldName === 'odometer')?.confidence || 99

    const datePart = (r.capturedAt || '').split('T')[0] || ''
    const timePart = (r.capturedAt || '').split('T')[1]?.slice(0, 5) || ''

    return {
      id: r.id,
      vehicleNumber: r.vehicleNumber || '',
      fuelType: r.fuelType,
      stationName: r.fuelStationName,
      location: r.locationAddress,
      latitude: Number(r.latitude) || 0,
      longitude: Number(r.longitude) || 0,
      quantity: Number(r.quantity),
      amount: Number(r.amount),
      rate: Number(r.rate),
      odometer: Number(r.odometer),
      previousOdometer: r.previousOdometer ? Number(r.previousOdometer) : undefined,
      distance: r.distance ? Number(r.distance) : undefined,
      mileage: r.mileage ? Number(r.mileage) : undefined,
      date: datePart,
      time: timePart,
      meterPhotoUri: meterPhoto,
      vehiclePhotoUri: vehiclePhoto,
      ocrConfidence: {
        quantity: quantityConf,
        amount: amountConf,
        odometer: odoConf,
      },
      notes: r.notes || undefined,
      createdAt: r.createdAt,
    }
  }

  async delete(id: string): Promise<boolean> {
    const driver = await this.getDriver()

    // 1. Clean up associated physical photos from private app storage
    try {
      const photos = await photoRepository.getByFuelEntryId(id, driver)
      for (const p of photos) {
        if (p.localPath && !p.localPath.startsWith('data:')) {
          await photoStorageService.deletePhoto(p.localPath).catch(() => {})
        }
      }
    } catch (err) {
      console.warn('[FuelRepository] Photo cleanup error during deletion:', err)
    }

    // 2. Mark fuel entry as soft-deleted
    const now = new Date().toISOString()
    await driver.execute(
      `UPDATE fuel_entries SET deletedAt = ? WHERE id = ?;`,
      [now, id]
    )
    return true
  }

  /**
   * Permanently hard delete a fuel entry and cascade to photos & OCR records.
   */
  async hardDelete(id: string): Promise<boolean> {
    const driver = await this.getDriver()
    try {
      const photos = await photoRepository.getByFuelEntryId(id, driver)
      for (const p of photos) {
        if (p.localPath && !p.localPath.startsWith('data:')) {
          await photoStorageService.deletePhoto(p.localPath).catch(() => {})
        }
      }
    } catch (err) {
      console.warn('[FuelRepository] Photo cleanup error during hard deletion:', err)
    }

    await driver.execute(`DELETE FROM fuel_entries WHERE id = ?;`, [id])
    return true
  }

  /**
   * Compute aggregated analytics directly from SQLite database.
   */
  async getAnalytics(vehicleId?: string, timeRange?: '7D' | '30D' | '3M' | '6M'): Promise<AnalyticsMetrics> {
    const driver = await this.getDriver()

    let sql = `
      SELECT 
        COUNT(*) as entryCount,
        COALESCE(SUM(amount), 0) as totalCost,
        COALESCE(SUM(quantity), 0) as totalLitres,
        COALESCE(SUM(distance), 0) as totalDistance,
        COALESCE(AVG(CASE WHEN mileage > 0 THEN mileage ELSE NULL END), 0) as averageMileage,
        COALESCE(MAX(odometer), 0) as lastOdometer
      FROM fuel_entries
      WHERE deletedAt IS NULL
    `
    const params: any[] = []

    if (vehicleId) {
      sql += ` AND vehicleId = ?`
      params.push(vehicleId)
    }

    if (timeRange) {
      const daysMap = { '7D': 7, '30D': 30, '3M': 90, '6M': 180 }
      const days = daysMap[timeRange] || 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      sql += ` AND capturedAt >= ?`
      params.push(cutoffDate)
    }

    const rows = await driver.query<any>(sql, params)
    const r = rows[0] || {}

    return {
      totalCost: Number(Number(r.totalCost || 0).toFixed(2)),
      totalLitres: Number(Number(r.totalLitres || 0).toFixed(2)),
      totalDistance: Number(r.totalDistance || 0),
      averageMileage: Number(Number(r.averageMileage || 0).toFixed(2)),
      lastOdometer: Number(r.lastOdometer || 0),
      entryCount: Number(r.entryCount || 0),
    }
  }
}

export const fuelRepository = new FuelRepository()
