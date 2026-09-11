import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { InlineEditModal } from './InlineEditModal'
import type { EditableValues } from './InlineEditModal'
import {
  formatCurrency,
  formatLitres,
  formatDistance,
  formatRate,
} from '../../utils/formatters'
import type { DraftFuelEntry, Vehicle } from '../../types/fuel'
import {
  Fuel,
  Gauge,
  MapPin,
  Clock,
  Car,
  Edit3,
} from 'lucide-react'

export interface ReviewSummaryProps {
  draft: DraftFuelEntry
  vehicle: Vehicle
  onUpdateValues: (values: EditableValues) => void
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  draft,
  vehicle,
  onUpdateValues,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [focusField, setFocusField] = useState<keyof EditableValues | null>(null)

  // Current working values (manual edits supersede OCR)
  const quantity = draft.manualEdits.quantity ?? draft.meterOCR?.quantity ?? 0
  const amount = draft.manualEdits.amount ?? draft.meterOCR?.amount ?? 0
  const rate = quantity > 0 ? Number((amount / quantity).toFixed(2)) : 0
  const odometer = draft.manualEdits.odometer ?? draft.vehicleOCR?.odometer ?? vehicle.currentOdometer
  const stationName =
    draft.manualEdits.stationName ??
    draft.location?.stationName ??
    'Tap to specify fuel station'
  const location =
    draft.manualEdits.location ??
    draft.location?.location ??
    'Tap to specify location'

  const quantityConfidence = draft.meterOCR?.confidence.quantity ?? 0
  const amountConfidence = draft.meterOCR?.confidence.amount ?? 0
  const odometerConfidence = draft.vehicleOCR?.confidence ?? 0

  const now = new Date()
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const openFieldEditor = (field: keyof EditableValues) => {
    setFocusField(field)
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Primary Card */}
      <Card variant="accent" className="p-4 sm:p-5 border-emerald-500/30 space-y-5">
        {/* Section 1: Fuel Metrics */}
        <div className="space-y-3 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Fuel className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block truncate">
                  Fuel Quantity & Cost
                </span>
                <div className="text-xs text-slate-400 truncate">Captured from meter display</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openFieldEditor('quantity')}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 p-1 rounded cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            {/* Quantity */}
            <div
              onClick={() => openFieldEditor('quantity')}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                <span className="text-xs font-semibold text-slate-400 truncate">Volume</span>
                <ConfidenceBadge
                  score={quantityConfidence}
                  compact
                  onClick={() => openFieldEditor('quantity')}
                />
              </div>
              <div className="text-xl font-extrabold text-slate-100 truncate">
                {formatLitres(quantity)}
              </div>
            </div>

            {/* Amount */}
            <div
              onClick={() => openFieldEditor('amount')}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all min-w-0"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                <span className="text-xs font-semibold text-slate-400 truncate">Total</span>
                <ConfidenceBadge
                  score={amountConfidence}
                  compact
                  onClick={() => openFieldEditor('amount')}
                />
              </div>
              <div className="text-xl font-extrabold text-emerald-400 truncate">
                {formatCurrency(amount)}
              </div>
            </div>
          </div>

          {/* Unit Rate */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-300">
            <span className="text-slate-400">Calculated Unit Rate:</span>
            <span className="font-bold text-slate-200">{formatRate(rate)}</span>
          </div>
        </div>

        {/* Section 2: Odometer */}
        <div className="space-y-3 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                <Gauge className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block truncate">
                  Vehicle Odometer
                </span>
                <div className="text-xs text-slate-400 truncate">Captured from instrument cluster</div>
              </div>
            </div>

            <ConfidenceBadge
              score={odometerConfidence}
              onClick={() => openFieldEditor('odometer')}
            />
          </div>

          <div
            onClick={() => openFieldEditor('odometer')}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-slate-400 font-medium">Reading</div>
              <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                {formatDistance(odometer)}
              </div>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-sky-400 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Correct</span>
            </button>
          </div>
        </div>

        {/* Section 3: Location & Station */}
        <div className="space-y-2.5 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  Location & Bunk
                </span>
                <div className="text-xs text-slate-400">Auto-detected via GPS</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openFieldEditor('stationName')}
              className="text-xs font-semibold text-slate-400 hover:text-violet-400 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-sm font-bold text-slate-100">{stationName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <span>{location}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                12.7879° N, 80.2281° E
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Vehicle & Timestamp Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Vehicle</span>
            </div>
            <div className="font-bold text-slate-200">{vehicle.vehicleNumber}</div>
            <div className="text-[11px] text-slate-400">{vehicle.fuelType}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Date & Time</span>
            </div>
            <div className="font-bold text-slate-200">{dateFormatted}</div>
            <div className="text-[11px] text-slate-400">{timeFormatted}</div>
          </div>
        </div>
      </Card>

      {/* Button to edit all values */}
      <button
        type="button"
        onClick={() => {
          setFocusField(null)
          setIsEditModalOpen(true)
        }}
        className="w-full text-center text-xs text-slate-400 hover:text-slate-200 font-medium py-1 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Need to adjust any value? Edit detected values</span>
      </button>

      {/* Inline quick edit modal */}
      <InlineEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialValues={{
          quantity,
          amount,
          odometer,
          stationName,
          location,
        }}
        focusField={focusField}
        onSave={(updated) => onUpdateValues(updated)}
      />
    </div>
  )
}
