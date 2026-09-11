/**
 * SQLite Database Schema definitions for FuelTrack.
 * Compatible with both native SQLite and WebAssembly SQLite (sql.js).
 */

export const SCHEMA_VERSION = 1

export const CREATE_TABLES_SQL = [
  // 1. Enable foreign keys
  `PRAGMA foreign_keys = ON;`,

  // 2. Vehicles Table
  `CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    vehicleNumber TEXT NOT NULL UNIQUE,
    makeModel TEXT NOT NULL,
    fuelType TEXT NOT NULL,
    tankCapacity REAL DEFAULT 0,
    currentOdometer INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`,

  // 3. Fuel Entries Table
  `CREATE TABLE IF NOT EXISTS fuel_entries (
    id TEXT PRIMARY KEY,
    vehicleId TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    capturedAt TEXT NOT NULL,
    fuelStationName TEXT NOT NULL,
    locationAddress TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    fuelType TEXT NOT NULL,
    quantity REAL NOT NULL CHECK (quantity > 0),
    amount REAL NOT NULL CHECK (amount > 0),
    rate REAL NOT NULL CHECK (rate >= 0),
    odometer INTEGER NOT NULL CHECK (odometer >= 0),
    previousOdometer INTEGER CHECK (previousOdometer >= 0),
    distance INTEGER CHECK (distance >= 0),
    mileage REAL CHECK (mileage >= 0),
    verificationStatus TEXT NOT NULL DEFAULT 'USER_CONFIRMED',
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT
  );`,

  // 4. Fuel Photos Table
  `CREATE TABLE IF NOT EXISTS fuel_photos (
    id TEXT PRIMARY KEY,
    fuelEntryId TEXT NOT NULL REFERENCES fuel_entries(id) ON DELETE CASCADE,
    photoType TEXT NOT NULL CHECK (photoType IN ('METER', 'VEHICLE')),
    localPath TEXT NOT NULL,
    fileName TEXT NOT NULL,
    capturedAt TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );`,

  // 5. OCR Results Table
  `CREATE TABLE IF NOT EXISTS ocr_results (
    id TEXT PRIMARY KEY,
    fuelEntryId TEXT NOT NULL REFERENCES fuel_entries(id) ON DELETE CASCADE,
    fieldName TEXT NOT NULL,
    extractedValue REAL NOT NULL,
    confidence REAL NOT NULL,
    source TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );`,

  // 6. Schema Migrations History Table
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    appliedAt TEXT NOT NULL
  );`,

  // 7. Indexes
  `CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle ON fuel_entries(vehicleId, capturedAt DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_fuel_entries_captured ON fuel_entries(capturedAt DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_fuel_photos_entry ON fuel_photos(fuelEntryId);`,
  `CREATE INDEX IF NOT EXISTS idx_ocr_results_entry ON ocr_results(fuelEntryId);`,
]
