import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { vehicleRepository } from '../database/repositories/vehicleRepository'
import { fuelRepository } from '../database/repositories/fuelRepository'
import { photoStorageService } from '../services/photoStorageService'
import { validateAndCalculateMetrics } from '../validation/fuelValidation'
import initialVehicles from '../mocks/vehicles.json'
import initialFuelData from '../mocks/fuelData.json'
import type {
  DraftFuelEntry,
  FuelEntry,
  LocationData,
  MeterOCRResult,
  OdometerOCRResult,
  Vehicle,
} from '../types/fuel'

interface FuelState {
  // Vehicle State
  vehicles: Vehicle[]
  activeVehicleId: string
  getActiveVehicle: () => Vehicle

  // Historical Records
  fuelEntries: FuelEntry[]

  // Add Fuel 2-Photo Wizard State
  draftEntry: DraftFuelEntry
  isProcessing: boolean
  processingStepText: string
  demoMode: boolean
  isDatabaseReady: boolean
  isLoading: boolean
  errorMessage: string | null

  // Actions
  loadInitialData: () => Promise<void>
  setDraftMeter: (photoUri: string, ocr: MeterOCRResult) => void
  setDraftVehicle: (photoUri: string, ocr: OdometerOCRResult) => void
  setDraftLocation: (loc: LocationData) => void
  updateManualEdit: (field: keyof DraftFuelEntry['manualEdits'], value: any) => void
  setProcessing: (isProcessing: boolean, stepText?: string) => void
  confirmAndSaveDraft: (options?: { allowOdometerReset?: boolean }) => Promise<FuelEntry | null>
  resetDraft: () => void
  getEntryById: (id: string) => FuelEntry | undefined
  updateActiveVehicle: (updated: Partial<Vehicle>) => Promise<void>
  toggleDemoMode: () => void
  resetToMockData: () => Promise<void>
  deleteFuelEntry: (id: string) => Promise<boolean>
}

const initialDraft: DraftFuelEntry = {
  meterPhotoUri: null,
  meterOCR: null,
  vehiclePhotoUri: null,
  vehicleOCR: null,
  location: null,
  manualEdits: {},
}

export const useFuelStore = create<FuelState>()(
  persist(
    (set, get) => ({
      vehicles: initialVehicles as Vehicle[],
      activeVehicleId: 'veh-001',
      fuelEntries: initialFuelData as FuelEntry[],
      draftEntry: initialDraft,
      isProcessing: false,
      processingStepText: '',
      demoMode: true,
      isDatabaseReady: false,
      isLoading: false,
      errorMessage: null,

      getActiveVehicle: () => {
        const state = get()
        return (
          state.vehicles.find((v) => v.id === state.activeVehicleId) ||
          state.vehicles[0] ||
          (initialVehicles[0] as Vehicle)
        )
      },

      /**
       * Asynchronously load vehicles and fuel entries from SQLite.
       */
      loadInitialData: async () => {
        set({ isLoading: true, errorMessage: null })
        try {
          const vehicles = await vehicleRepository.getAll()
          const entries = await fuelRepository.getAll()

          set({
            vehicles: vehicles.length > 0 ? vehicles : (initialVehicles as Vehicle[]),
            fuelEntries: entries.length > 0 ? entries : (initialFuelData as FuelEntry[]),
            isDatabaseReady: true,
            isLoading: false,
          })
        } catch (err: any) {
          console.warn('[FuelStore] Database loading error, keeping in-memory fallback:', err)
          set({
            isDatabaseReady: false,
            isLoading: false,
            errorMessage: err?.message || 'Database initialization error',
          })
        }
      },

      setDraftMeter: (photoUri, ocr) =>
        set((state) => ({
          draftEntry: {
            ...state.draftEntry,
            meterPhotoUri: photoUri,
            meterOCR: ocr,
          },
        })),

      setDraftVehicle: (photoUri, ocr) =>
        set((state) => ({
          draftEntry: {
            ...state.draftEntry,
            vehiclePhotoUri: photoUri,
            vehicleOCR: ocr,
          },
        })),

      setDraftLocation: (loc) =>
        set((state) => ({
          draftEntry: {
            ...state.draftEntry,
            location: loc,
          },
        })),

      updateManualEdit: (field, value) =>
        set((state) => ({
          draftEntry: {
            ...state.draftEntry,
            manualEdits: {
              ...state.draftEntry.manualEdits,
              [field]: value,
            },
          },
        })),

      setProcessing: (isProcessing, stepText = '') =>
        set({ isProcessing, processingStepText: stepText }),

      /**
       * Confirm and atomically persist draft fuel entry to SQLite.
       */
      confirmAndSaveDraft: async (options?: { allowOdometerReset?: boolean }) => {
        const state = get()
        const { draftEntry, fuelEntries } = state
        const activeVehicle = state.getActiveVehicle()

        // Extract values from OCR with manual edits taking precedence
        const quantity =
          draftEntry.manualEdits.quantity ??
          draftEntry.meterOCR?.quantity ??
          0
        const amount =
          draftEntry.manualEdits.amount ??
          draftEntry.meterOCR?.amount ??
          0
        const odometer =
          draftEntry.manualEdits.odometer ??
          draftEntry.vehicleOCR?.odometer ??
          activeVehicle.currentOdometer
        const stationName =
          draftEntry.manualEdits.stationName ??
          draftEntry.location?.stationName ??
          'Fuel Station'
        const location =
          draftEntry.manualEdits.location ??
          draftEntry.location?.location ??
          'Location'
        const latitude = draftEntry.location?.latitude ?? 0
        const longitude = draftEntry.location?.longitude ?? 0

        // Previous odometer lookup
        const previousEntry = fuelEntries
          .filter((e) => e.vehicleNumber === activeVehicle.vehicleNumber)
          .sort((a, b) => b.odometer - a.odometer)[0]

        let previousOdometer: number | undefined =
          previousEntry?.odometer ??
          (activeVehicle.currentOdometer > 0 ? activeVehicle.currentOdometer : undefined)

        // If user requested odometer reset (or previous entries were seeded/higher and user explicitly forces new baseline)
        if (options?.allowOdometerReset === true && previousOdometer !== undefined && odometer < previousOdometer) {
          previousOdometer = undefined
        }

        // Strict Validation
        const metrics = validateAndCalculateMetrics(
          odometer,
          previousOdometer,
          quantity,
          amount,
          activeVehicle.tankCapacity
        )

        if (!metrics.isValid) {
          let validationMsg: string
          if (quantity <= 0 && amount <= 0) {
            validationMsg =
              'Fuel volume and total amount must be greater than 0. Tap "Edit" on the card to specify them.'
          } else {
            validationMsg = metrics.errors.join('. ')
          }
          console.warn('[FuelStore] Validation failed:', validationMsg)
          set({ errorMessage: validationMsg })
          return null
        }

        set({ errorMessage: null })

        const now = new Date()
        const capturedAt = now.toISOString()
        const entryId = `fuel-${Date.now().toString(36)}`

        // 1. Permanently store photos in private application storage
        let persistentMeterPath = draftEntry.meterPhotoUri || ''
        let persistentVehiclePath = draftEntry.vehiclePhotoUri || ''

        if (draftEntry.meterPhotoUri && !draftEntry.meterPhotoUri.startsWith('data:')) {
          const res = await photoStorageService.savePhotoPermanently(
            draftEntry.meterPhotoUri,
            'METER'
          )
          persistentMeterPath = res.localPath
        }

        if (draftEntry.vehiclePhotoUri && !draftEntry.vehiclePhotoUri.startsWith('data:')) {
          const res = await photoStorageService.savePhotoPermanently(
            draftEntry.vehiclePhotoUri,
            'VEHICLE'
          )
          persistentVehiclePath = res.localPath
        }

        // 2. Prepare atomic transaction records
        const photosPayload = [
          ...(persistentMeterPath
            ? [{ photoType: 'METER' as const, localPath: persistentMeterPath, fileName: 'meter.jpg', capturedAt }]
            : []),
          ...(persistentVehiclePath
            ? [{ photoType: 'VEHICLE' as const, localPath: persistentVehiclePath, fileName: 'vehicle.jpg', capturedAt }]
            : []),
        ]

        const ocrPayload = [
          {
            fieldName: 'quantity',
            extractedValue: quantity,
            confidence: draftEntry.meterOCR?.confidence.quantity ?? 100,
            source: draftEntry.manualEdits.quantity !== undefined ? 'MANUAL_EDIT' : 'OCR',
          },
          {
            fieldName: 'amount',
            extractedValue: amount,
            confidence: draftEntry.meterOCR?.confidence.amount ?? 100,
            source: draftEntry.manualEdits.amount !== undefined ? 'MANUAL_EDIT' : 'OCR',
          },
          {
            fieldName: 'odometer',
            extractedValue: odometer,
            confidence: draftEntry.vehicleOCR?.confidence ?? 100,
            source: draftEntry.manualEdits.odometer !== undefined ? 'MANUAL_EDIT' : 'OCR',
          },
        ]

        try {
          // 3. Atomically persist to SQLite
          const savedEntry = await fuelRepository.createWithTransaction(
            {
              id: entryId,
              vehicleId: activeVehicle.id,
              vehicleNumber: activeVehicle.vehicleNumber,
              capturedAt,
              fuelStationName: stationName,
              locationAddress: location,
              latitude,
              longitude,
              fuelType: activeVehicle.fuelType,
              quantity,
              amount,
              rate: metrics.rate,
              odometer,
              previousOdometer,
              distance: metrics.distance,
              mileage: metrics.mileage,
              verificationStatus: 'USER_CONFIRMED',
            },
            photosPayload,
            ocrPayload,
            options
          )

          // 4. Update in-memory reactive state
          const updatedVehicles = state.vehicles.map((v) =>
            v.id === activeVehicle.id
              ? {
                  ...v,
                  currentOdometer: options?.allowOdometerReset === true
                    ? odometer
                    : Math.max(v.currentOdometer, odometer),
                }
              : v
          )

          set({
            fuelEntries: [savedEntry, ...fuelEntries],
            vehicles: updatedVehicles,
            draftEntry: initialDraft,
          })

          return savedEntry
        } catch (dbError) {
          console.error('[FuelStore] Failed to save entry to SQLite database:', dbError)
          throw dbError
        }
      },

      resetDraft: () => set({ draftEntry: initialDraft }),

      getEntryById: (id: string) => {
        return get().fuelEntries.find((e) => e.id === id)
      },

      updateActiveVehicle: async (updated: Partial<Vehicle>) => {
        const state = get()
        try {
          const res = await vehicleRepository.update(state.activeVehicleId, updated)
          if (res) {
            set((s) => ({
              vehicles: s.vehicles.map((v) => (v.id === state.activeVehicleId ? res : v)),
            }))
          }
        } catch {
          // In-memory fallback
          set((s) => ({
            vehicles: s.vehicles.map((v) =>
              v.id === state.activeVehicleId ? { ...v, ...updated } : v
            ),
          }))
        }
      },

      toggleDemoMode: () =>
        set((state) => ({ demoMode: !state.demoMode })),

      resetToMockData: async () => {
        set({
          vehicles: initialVehicles as Vehicle[],
          fuelEntries: initialFuelData as FuelEntry[],
          draftEntry: initialDraft,
        })
      },

      deleteFuelEntry: async (id: string) => {
        try {
          await fuelRepository.delete(id)
        } catch (err) {
          console.warn('[FuelStore] Database delete failed, updating local state:', err)
        }

        set((state) => ({
          fuelEntries: state.fuelEntries.filter((e) => e.id !== id),
        }))
        return true
      },
    }),
    {
      // Only persist lightweight user preferences in localStorage
      // Fuel records and vehicles are stored exclusively in SQLite
      name: 'fueltrack-preferences-v2',
      partialize: (state) => ({
        activeVehicleId: state.activeVehicleId,
        demoMode: state.demoMode,
      }),
    }
  )
)
