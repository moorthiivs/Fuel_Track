import { dbManager } from '../database'
import type { DatabaseDriver } from '../driver'
import type { FuelType, Vehicle } from '../../types/fuel'

export class VehicleRepository {
  private driverOverride?: DatabaseDriver

  constructor(driverOverride?: DatabaseDriver) {
    this.driverOverride = driverOverride
  }

  private async getDriver(): Promise<DatabaseDriver> {
    return this.driverOverride || dbManager.getDriver()
  }

  async getAll(): Promise<Vehicle[]> {
    const driver = await this.getDriver()
    const rows = await driver.query<any>(
      `SELECT id, vehicleNumber, makeModel, fuelType, tankCapacity, currentOdometer, isActive
       FROM vehicles
       WHERE isActive = 1
       ORDER BY createdAt ASC;`
    )

    return rows.map((r) => ({
      id: r.id,
      vehicleNumber: r.vehicleNumber,
      makeModel: r.makeModel,
      fuelType: r.fuelType as FuelType,
      tankCapacity: r.tankCapacity || 0,
      currentOdometer: Number(r.currentOdometer) || 0,
    }))
  }

  async getById(id: string): Promise<Vehicle | null> {
    const driver = await this.getDriver()
    const rows = await driver.query<any>(
      `SELECT id, vehicleNumber, makeModel, fuelType, tankCapacity, currentOdometer, isActive
       FROM vehicles
       WHERE id = ? LIMIT 1;`,
      [id]
    )

    if (rows.length === 0) return null
    const r = rows[0]
    return {
      id: r.id,
      vehicleNumber: r.vehicleNumber,
      makeModel: r.makeModel,
      fuelType: r.fuelType as FuelType,
      tankCapacity: r.tankCapacity || 0,
      currentOdometer: Number(r.currentOdometer) || 0,
    }
  }

  async getActive(): Promise<Vehicle | null> {
    const all = await this.getAll()
    return all.length > 0 ? all[0] : null
  }

  async create(vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const driver = await this.getDriver()
    const now = new Date().toISOString()
    const id = vehicle.id || `veh-${Date.now().toString(36)}`

    await driver.execute(
      `INSERT INTO vehicles (id, vehicleNumber, makeModel, fuelType, tankCapacity, currentOdometer, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        vehicle.vehicleNumber.trim().toUpperCase(),
        vehicle.makeModel.trim(),
        vehicle.fuelType,
        vehicle.tankCapacity || 0,
        vehicle.currentOdometer || 0,
        1,
        now,
        now,
      ]
    )

    return {
      id,
      vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
      makeModel: vehicle.makeModel.trim(),
      fuelType: vehicle.fuelType,
      tankCapacity: vehicle.tankCapacity || 0,
      currentOdometer: vehicle.currentOdometer || 0,
    }
  }

  async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    const driver = await this.getDriver()
    const existing = await this.getById(id)
    if (!existing) return null

    const updatedVehicle: Vehicle = {
      ...existing,
      ...updates,
      vehicleNumber: updates.vehicleNumber ? updates.vehicleNumber.trim().toUpperCase() : existing.vehicleNumber,
    }

    const now = new Date().toISOString()
    await driver.execute(
      `UPDATE vehicles
       SET vehicleNumber = ?, makeModel = ?, fuelType = ?, tankCapacity = ?, currentOdometer = ?, updatedAt = ?
       WHERE id = ?;`,
      [
        updatedVehicle.vehicleNumber,
        updatedVehicle.makeModel,
        updatedVehicle.fuelType,
        updatedVehicle.tankCapacity || 0,
        updatedVehicle.currentOdometer,
        now,
        id,
      ]
    )

    return updatedVehicle
  }

  async updateOdometer(id: string, newOdometer: number): Promise<void> {
    const driver = await this.getDriver()
    const now = new Date().toISOString()
    await driver.execute(
      `UPDATE vehicles
       SET currentOdometer = MAX(currentOdometer, ?), updatedAt = ?
       WHERE id = ?;`,
      [newOdometer, now, id]
    )
  }

  async delete(id: string): Promise<boolean> {
    const driver = await this.getDriver()
    await driver.execute(
      `UPDATE vehicles SET isActive = 0, updatedAt = ? WHERE id = ?;`,
      [new Date().toISOString(), id]
    )
    return true
  }
}

export const vehicleRepository = new VehicleRepository()
