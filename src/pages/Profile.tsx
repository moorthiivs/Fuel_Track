import React, { useState } from 'react'
import { HeaderBar } from '../components/common/HeaderBar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useFuelStore } from '../store/fuelStore'
import { formatDistance } from '../utils/formatters'
import {
  Car,
  Sparkles,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react'
import type { FuelType } from '../types/fuel'

export const Profile: React.FC = () => {
  const activeVehicle = useFuelStore((s) => s.getActiveVehicle())
  const updateActiveVehicle = useFuelStore((s) => s.updateActiveVehicle)
  const demoMode = useFuelStore((s) => s.demoMode)
  const toggleDemoMode = useFuelStore((s) => s.toggleDemoMode)
  const resetToMockData = useFuelStore((s) => s.resetToMockData)

  const [vehicleNumber, setVehicleNumber] = useState(activeVehicle.vehicleNumber)
  const [makeModel, setMakeModel] = useState(activeVehicle.makeModel)
  const [fuelType, setFuelType] = useState<FuelType>(activeVehicle.fuelType)
  const [odometer, setOdometer] = useState(activeVehicle.currentOdometer)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateActiveVehicle({
      vehicleNumber,
      makeModel,
      fuelType,
      currentOdometer: Number(odometer) || activeVehicle.currentOdometer,
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all fuel entries and vehicles back to original factory demo data?'
      )
    ) {
      resetToMockData()
      alert('Mock data successfully reset!')
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-8">
      <HeaderBar
        title="Vehicle Profile"
        subtitle="Configuration & Settings"
      />

      <div className="px-4 py-4 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Vehicle Identity Card */}
        <Card variant="accent" className="p-5 border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Active Vehicle
              </span>
              <h2 className="text-lg font-black text-slate-100">
                {activeVehicle.makeModel}
              </h2>
              <div className="text-xs text-slate-400 font-mono">
                {activeVehicle.vehicleNumber}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60">
              <span className="text-slate-400">Primary Fuel</span>
              <div className="font-extrabold text-slate-200 mt-0.5">
                {activeVehicle.fuelType}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60">
              <span className="text-slate-400">Recorded Odometer</span>
              <div className="font-extrabold text-sky-400 mt-0.5">
                {formatDistance(activeVehicle.currentOdometer)}
              </div>
            </div>
          </div>
        </Card>

        {/* Editable Vehicle Settings Form */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Edit Vehicle Details
          </span>

          <Card className="p-5 border-slate-800">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registration / Number Plate
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Fuel Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Petrol', 'Diesel', 'CNG'] as FuelType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFuelType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        fuelType === type
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Base Odometer (km)
                </label>
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  leftIcon={
                    savedSuccess ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                  className={savedSuccess ? 'bg-emerald-400 text-slate-950' : ''}
                >
                  {savedSuccess ? 'Vehicle Settings Saved!' : 'Save Vehicle Settings'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Demo Mode & Offline Testing Controls */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Prototype & Demo Configuration
          </span>

          <Card className="p-5 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Mode</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulates Camera OCR, GPS & Bunk resolution offline.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleDemoMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  demoMode ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    demoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={handleResetData}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                className="text-xs border-slate-700 text-slate-300"
              >
                Reset to Original Mock Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
