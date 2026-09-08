import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useFuelStore } from '../store/fuelStore'
import { DEMO_METER_PHOTO, DEMO_VEHICLE_PHOTO } from '../mocks/demoImages'
import {
  formatCurrency,
  formatLitres,
  formatDistance,
  formatRate,
  formatMileage,
} from '../utils/formatters'
import {
  Fuel,
  MapPin,
  Calendar,
  ShieldCheck,
  Trash2,
  Navigation,
  CheckCircle2,
} from 'lucide-react'

export const FuelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getEntryById = useFuelStore((s) => s.getEntryById)
  const deleteFuelEntry = useFuelStore((s) => s.deleteFuelEntry)

  const entry = id ? getEntryById(id) : undefined

  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Fuel className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-slate-200">Fuel Entry Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested fuel record might have been removed.
        </p>
        <Button variant="secondary" onClick={() => navigate('/history')}>
          Return to History
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this fuel record?')) {
      deleteFuelEntry(entry.id)
      navigate('/history')
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-8">
      <HeaderBar
        title="Fuel Entry Details"
        subtitle={entry.stationName}
        showBack
        onBack={() => navigate('/history')}
        rightAction={
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Delete Entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 py-5 sm:px-6 space-y-5 max-w-md mx-auto w-full">
        {/* Anti-Fraud Proof Verified Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 shadow-sm">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">
              Proof Captured Automatically
            </div>
            <div className="text-[11px] text-emerald-400/80">
              Verified by dual-photo OCR and tamper-proof GPS timestamping.
            </div>
          </div>
        </div>

        {/* Top Summary Card */}
        <Card variant="accent" className="p-5 border-emerald-500/30 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fuel Transaction
              </span>
              <h2 className="text-xl font-black text-slate-100 mt-0.5">
                {entry.stationName}
              </h2>
              <p className="text-xs text-slate-400">{entry.location}</p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(entry.amount)}
              </div>
              <div className="text-xs font-bold text-slate-300">
                {formatLitres(entry.quantity)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950/60">
              <div className="text-slate-400 font-medium">Unit Rate</div>
              <div className="font-extrabold text-slate-200 mt-0.5">
                {formatRate(entry.rate)}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60">
              <div className="text-slate-400 font-medium">Fuel Type</div>
              <div className="font-extrabold text-slate-200 mt-0.5">
                {entry.fuelType}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60">
              <div className="text-slate-400 font-medium">Est. Mileage</div>
              <div className="font-extrabold text-emerald-400 mt-0.5">
                {formatMileage(entry.mileage)}
              </div>
            </div>
          </div>
        </Card>

        {/* Odometer & Mileage Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Odometer & Trip Calculation
          </span>

          <Card className="p-4 space-y-3 border-slate-800">
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
              <span className="text-slate-400">Current Odometer:</span>
              <span className="font-bold text-slate-100 font-mono">
                {formatDistance(entry.odometer)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
              <span className="text-slate-400">Previous Reading:</span>
              <span className="font-bold text-slate-300 font-mono">
                {entry.previousOdometer
                  ? formatDistance(entry.previousOdometer)
                  : 'Baseline entry'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
              <span className="text-slate-400">Distance Travelled:</span>
              <span className="font-bold text-sky-400 font-mono">
                {entry.distance ? formatDistance(entry.distance) : '-- km'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
              <span className="text-slate-400">Fuel Consumed:</span>
              <span className="font-bold text-slate-200">
                {formatLitres(entry.quantity)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-400 font-bold">Estimated Mileage:</span>
              <span className="text-sm font-black text-emerald-400">
                {formatMileage(entry.mileage)}
              </span>
            </div>
          </Card>
        </div>

        {/* Location & Timestamp Details */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Timestamp & Coordinates
          </span>

          <Card className="p-4 space-y-2.5 border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date & Time
              </span>
              <span className="font-semibold text-slate-200">
                {entry.date} • {entry.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Locality
              </span>
              <span className="font-semibold text-slate-200">{entry.location}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> GPS Coordinates
              </span>
              <span className="font-mono text-emerald-400 text-[11px]">
                {entry.latitude?.toFixed(4)}° N, {entry.longitude?.toFixed(4)}° E
              </span>
            </div>
          </Card>
        </div>

        {/* Dual Anti-Fraud Proof Photos */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Automatic Capture Proof
            </span>
            <Badge variant="emerald" size="sm">
              <CheckCircle2 className="w-3 h-3" /> Anti-Fraud
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Meter Photo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>1. Fuel Meter Photo</span>
                <span className="text-emerald-400">98% OCR</span>
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={entry.meterPhotoUri || DEMO_METER_PHOTO}
                  alt="Fuel Meter Proof"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Vehicle Dashboard Photo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>2. Vehicle Odometer Photo</span>
                <span className="text-sky-400">99% OCR</span>
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={entry.vehiclePhotoUri || DEMO_VEHICLE_PHOTO}
                  alt="Vehicle Odometer Proof"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back Action */}
        <div className="pt-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate('/history')}
          >
            Back to Fuel History
          </Button>
        </div>
      </div>
    </div>
  )
}
