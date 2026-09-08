import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import initialFuelData from '../mocks/fuelData.json'
import initialVehicles from '../mocks/vehicles.json'
import { DEMO_METER_PHOTO, DEMO_VEHICLE_PHOTO } from '../mocks/demoImages'
import { fuelService } from '../services/fuelService'
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

  // Actions
  setDraftMeter: (photoUri: string, ocr: MeterOCRResult) => void
  setDraftVehicle: (photoUri: string, ocr: OdometerOCRResult) => void
  setDraftLocation: (loc: LocationData) => void
  updateManualEdit: (field: keyof DraftFuelEntry['manualEdits'], value: any) => void
  setProcessing: (isProcessing: boolean, stepText?: string) => void
  confirmAndSaveDraft: () => FuelEntry | null
  resetDraft: () => void
  getEntryById: (id: string) => FuelEntry | undefined
  updateActiveVehicle: (updated: Partial<Vehicle>) => void
  toggleDemoMode: () => void
  resetToMockData: () => void
  deleteFuelEntry: (id: string) => void
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

      getActiveVehicle: () => {
        const state = get()
        return (
          state.vehicles.find((v) => v.id === state.activeVehicleId) ||
          state.vehicles[0]
        )
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

      confirmAndSaveDraft: () => {
        const state = get()
        const { draftEntry, fuelEntries } = state
        const activeVehicle = state.getActiveVehicle()

        // Extract values from OCR with manual edits taking precedence
        const quantity =
          draftEntry.manualEdits.quantity ??
          draftEntry.meterOCR?.quantity ??
          32.45
        const amount =
          draftEntry.manualEdits.amount ??
          draftEntry.meterOCR?.amount ??
          3245
        const odometer =
          draftEntry.manualEdits.odometer ??
          draftEntry.vehicleOCR?.odometer ??
          48625
        const stationName =
          draftEntry.manualEdits.stationName ??
          draftEntry.location?.stationName ??
          'Indian Oil - XYZ Bunk'
        const location =
          draftEntry.manualEdits.location ??
          draftEntry.location?.location ??
          'Kelambakkam, Chennai'
        const latitude = draftEntry.location?.latitude ?? 12.7879
        const longitude = draftEntry.location?.longitude ?? 80.2281

        // Previous odometer lookup
        const previousEntry = fuelEntries
          .filter((e) => e.vehicleNumber === activeVehicle.vehicleNumber)
          .sort((a, b) => b.odometer - a.odometer)[0]

        const previousOdometer = previousEntry?.odometer ?? 48120
        const { rate, distance, mileage } = fuelService.calculateMetrics(
          odometer,
          previousOdometer,
          quantity,
          amount
        )

        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })

        const newEntry: FuelEntry = {
          id: `fuel-${Date.now().toString(36)}`,
          vehicleNumber: activeVehicle.vehicleNumber,
          fuelType: activeVehicle.fuelType,
          stationName,
          location,
          latitude,
          longitude,
          quantity,
          amount,
          rate,
          odometer,
          previousOdometer,
          distance,
          mileage,
          date: dateStr,
          time: timeStr,
          meterPhotoUri: draftEntry.meterPhotoUri || DEMO_METER_PHOTO,
          vehiclePhotoUri: draftEntry.vehiclePhotoUri || DEMO_VEHICLE_PHOTO,
          ocrConfidence: {
            quantity: draftEntry.meterOCR?.confidence.quantity ?? 98,
            amount: draftEntry.meterOCR?.confidence.amount ?? 96,
            rate: draftEntry.meterOCR?.confidence.rate ?? 99,
            odometer: draftEntry.vehicleOCR?.confidence ?? 99,
          },
          createdAt: now.toISOString(),
        }

        // Update active vehicle's odometer
        const updatedVehicles = state.vehicles.map((v) =>
          v.id === activeVehicle.id
            ? { ...v, currentOdometer: Math.max(v.currentOdometer, odometer) }
            : v
        )

        set({
          fuelEntries: [newEntry, ...fuelEntries],
          vehicles: updatedVehicles,
          draftEntry: initialDraft,
        })

        return newEntry
      },

      resetDraft: () => set({ draftEntry: initialDraft }),

      getEntryById: (id: string) => {
        return get().fuelEntries.find((e) => e.id === id)
      },

      updateActiveVehicle: (updated: Partial<Vehicle>) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === state.activeVehicleId ? { ...v, ...updated } : v
          ),
        })),

      toggleDemoMode: () =>
        set((state) => ({ demoMode: !state.demoMode })),

      resetToMockData: () =>
        set({
          vehicles: initialVehicles as Vehicle[],
          fuelEntries: initialFuelData as FuelEntry[],
          draftEntry: initialDraft,
        }),

      deleteFuelEntry: (id: string) =>
        set((state) => ({
          fuelEntries: state.fuelEntries.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'fueltrack-storage-v1',
      partialize: (state) => ({
        vehicles: state.vehicles,
        activeVehicleId: state.activeVehicleId,
        fuelEntries: state.fuelEntries,
        demoMode: state.demoMode,
      }),
    }
  )
)
