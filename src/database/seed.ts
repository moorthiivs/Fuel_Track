import type { DatabaseDriver } from './driver'
import initialVehicles from '../mocks/vehicles.json'
import initialFuelData from '../mocks/fuelData.json'

export class DatabaseSeeder {
  /**
   * Seed initial starter data if tables are empty.
   */
  static async seedIfEmpty(driver: DatabaseDriver): Promise<void> {
    const existingVehicles = await driver.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM vehicles;`
    )

    if (existingVehicles[0]?.count > 0) {
      return
    }

    console.log('[DatabaseSeeder] Seeding initial starter vehicles and fuel entries...')

    await driver.runTransaction(async (tx) => {
      // 1. Seed Vehicles
      for (const v of initialVehicles as any[]) {
        await tx.execute(
          `INSERT INTO vehicles (id, vehicleNumber, makeModel, fuelType, tankCapacity, currentOdometer, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            v.id,
            v.vehicleNumber,
            v.makeModel,
            v.fuelType,
            v.tankCapacity || 45,
            v.currentOdometer || 0,
            1,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        )
      }

      // 2. Seed Fuel Entries
      for (const entry of initialFuelData as any[]) {
        const vehicle = initialVehicles.find((v: any) => v.vehicleNumber === entry.vehicleNumber) || initialVehicles[0]
        const capturedAt = `${entry.date}T${entry.time || '12:00:00'}`

        await tx.execute(
          `INSERT INTO fuel_entries (
            id, vehicleId, capturedAt, fuelStationName, locationAddress, latitude, longitude,
            fuelType, quantity, amount, rate, odometer, previousOdometer, distance, mileage,
            verificationStatus, notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            entry.id,
            vehicle.id,
            capturedAt,
            entry.stationName,
            entry.location,
            entry.latitude || 12.7879,
            entry.longitude || 80.2281,
            entry.fuelType || 'Petrol',
            entry.quantity,
            entry.amount,
            entry.rate || Number((entry.amount / entry.quantity).toFixed(2)),
            entry.odometer,
            entry.previousOdometer || null,
            entry.distance || null,
            entry.mileage || null,
            'USER_CONFIRMED',
            entry.notes || null,
            entry.createdAt || new Date().toISOString(),
            new Date().toISOString(),
          ]
        )

        // Seed mock photo records if present
        await tx.execute(
          `INSERT INTO fuel_photos (id, fuelEntryId, photoType, localPath, fileName, capturedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            `photo-meter-${entry.id}`,
            entry.id,
            'METER',
            'photos/meter_demo.svg',
            'meter_demo.svg',
            capturedAt,
            new Date().toISOString(),
          ]
        )

        await tx.execute(
          `INSERT INTO fuel_photos (id, fuelEntryId, photoType, localPath, fileName, capturedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            `photo-vehicle-${entry.id}`,
            entry.id,
            'VEHICLE',
            'photos/vehicle_demo.svg',
            'vehicle_demo.svg',
            capturedAt,
            new Date().toISOString(),
          ]
        )
      }
    })

    console.log('[DatabaseSeeder] Seeding completed successfully.')
  }

  /**
   * Generate realistic test dataset (~10 vehicles, ~500 fuel entries) for performance benchmarking.
   */
  static async seedPerformanceDataset(
    driver: DatabaseDriver,
    vehicleCount = 10,
    entriesPerVehicle = 50
  ): Promise<void> {
    console.log(`[DatabaseSeeder] Generating performance dataset: ${vehicleCount} vehicles x ${entriesPerVehicle} entries...`)

    await driver.runTransaction(async (tx) => {
      for (let vIdx = 1; vIdx <= vehicleCount; vIdx++) {
        const vehicleId = `perf-veh-${vIdx}`
        const vehicleNumber = `KA 0${(vIdx % 9) + 1} EQ ${1000 + vIdx}`
        const makeModel = `Fleet Vehicle #${vIdx} (Sedan)`
        let currentOdo = 15000 + vIdx * 1000

        await tx.execute(
          `INSERT OR REPLACE INTO vehicles (id, vehicleNumber, makeModel, fuelType, tankCapacity, currentOdometer, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            vehicleId,
            vehicleNumber,
            makeModel,
            vIdx % 2 === 0 ? 'Diesel' : 'Petrol',
            50,
            currentOdo,
            1,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        )

        const baseTime = Date.now() - entriesPerVehicle * 7 * 24 * 60 * 60 * 1000

        for (let eIdx = 1; eIdx <= entriesPerVehicle; eIdx++) {
          const entryId = `perf-fuel-${vIdx}-${eIdx}`
          const entryTime = new Date(baseTime + eIdx * 7 * 24 * 60 * 60 * 1000).toISOString()
          const prevOdo = currentOdo
          const dist = 350 + Math.floor(Math.random() * 150)
          currentOdo += dist
          const qty = Number((25 + Math.random() * 15).toFixed(2))
          const rate = 102.5
          const amt = Number((qty * rate).toFixed(2))
          const mileage = Number((dist / qty).toFixed(2))

          await tx.execute(
            `INSERT OR REPLACE INTO fuel_entries (
              id, vehicleId, capturedAt, fuelStationName, locationAddress, latitude, longitude,
              fuelType, quantity, amount, rate, odometer, previousOdometer, distance, mileage,
              verificationStatus, notes, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              entryId,
              vehicleId,
              entryTime,
              `Indian Oil Bunk Station #${(eIdx % 10) + 1}`,
              'Outer Ring Road, Bengaluru',
              12.9716,
              77.5946,
              vIdx % 2 === 0 ? 'Diesel' : 'Petrol',
              qty,
              amt,
              rate,
              currentOdo,
              prevOdo,
              dist,
              mileage,
              'USER_CONFIRMED',
              'Auto-generated performance entry',
              entryTime,
              entryTime,
            ]
          )
        }

        await tx.execute(
          `UPDATE vehicles SET currentOdometer = ? WHERE id = ?;`,
          [currentOdo, vehicleId]
        )
      }
    })

    console.log('[DatabaseSeeder] Performance dataset generated successfully.')
  }
}
