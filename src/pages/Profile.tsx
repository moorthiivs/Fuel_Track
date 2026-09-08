import React, { useState } from 'react'
import { HeaderBar } from '../components/common/HeaderBar'
import { SpotlightCard } from '../components/reactbits/SpotlightCard'
import { DecryptedText } from '../components/reactbits/DecryptedText'
import { ClickSpark } from '../components/reactbits/ClickSpark'
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
  Cpu,
  Key,
} from 'lucide-react'
import type { FuelType } from '../types/fuel'
import { GeminiApiKeyModal } from '../components/common/GeminiApiKeyModal'
import { geminiService } from '../services/geminiService'

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
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false)
  const [, setForceUpdate] = useState(0)

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
    <ClickSpark sparkColor="#10b981" sparkCount={6} className="w-full min-h-full flex flex-col pb-8">
      <HeaderBar
        title="Vehicle Profile"
        subtitle="Configuration & Settings"
      />

      <div className="px-4 py-4 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Vehicle Identity Card */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.25)"
          borderColor="rgba(16, 185, 129, 0.45)"
          className="p-5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30 space-y-4 shadow-lg shadow-emerald-950/20"
        >
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
              <div className="text-xs text-slate-300 font-mono font-bold">
                <DecryptedText
                  text={activeVehicle.vehicleNumber}
                  speed={35}
                  maxIterations={8}
                  encryptedClassName="text-teal-400 font-bold"
                />
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
        </SpotlightCard>


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

        {/* Google Gemini AI Vision Engine Configuration */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            AI Vision Intelligence
          </span>

          <Card className="p-5 border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900 to-slate-950 space-y-4 shadow-lg shadow-purple-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Google Gemini Flash 1.5</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  State-of-the-art vision AI for reading motorcycle/car digital LCD clusters, trip
                  meters, and fuel dispenser numbers with 99%+ accuracy.
                </p>
              </div>

              {geminiService.isConfigured() ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                  Offline
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-purple-900/30 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setIsGeminiModalOpen(true)}
                leftIcon={<Key className="w-3.5 h-3.5 text-purple-400" />}
                className="text-xs border-purple-500/30 hover:bg-purple-950/40 text-purple-200"
              >
                {geminiService.isConfigured() ? 'Manage API Key' : 'Configure Gemini API Key'}
              </Button>
            </div>
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

      <GeminiApiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onKeySaved={() => setForceUpdate((n) => n + 1)}
      />
    </ClickSpark>
  )
}

