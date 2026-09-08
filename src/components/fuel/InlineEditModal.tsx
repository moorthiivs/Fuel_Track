import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Check } from 'lucide-react'

export interface EditableValues {
  quantity: number
  amount: number
  odometer: number
  stationName: string
  location: string
}

export interface InlineEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialValues: EditableValues
  focusField?: keyof EditableValues | null
  onSave: (updated: EditableValues) => void
}

export const InlineEditModal: React.FC<InlineEditModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  focusField,
  onSave,
}) => {
  const [values, setValues] = useState<EditableValues>(initialValues)

  // Sync state when modal opens with fresh initial values
  React.useEffect(() => {
    if (isOpen) {
      setValues(initialValues)
    }
  }, [isOpen, initialValues])

  const handleChange = (field: keyof EditableValues, val: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: field === 'stationName' || field === 'location' ? val : Number(val) || 0,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(values)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Detected Values"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400">
          Correct any OCR detection or location value before finalizing your entry.
        </p>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Fuel Quantity (Litres)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              autoFocus={focusField === 'quantity'}
              value={values.quantity || ''}
              onChange={(e) => handleChange('quantity', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 32.45"
              required
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
              L
            </span>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Total Amount (₹)
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              autoFocus={focusField === 'amount'}
              value={values.amount || ''}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 3245"
              required
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
              INR
            </span>
          </div>
        </div>

        {/* Odometer */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Vehicle Odometer Reading (km)
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              autoFocus={focusField === 'odometer'}
              value={values.odometer || ''}
              onChange={(e) => handleChange('odometer', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 48625"
              required
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
              KM
            </span>
          </div>
        </div>

        {/* Fuel Station Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Fuel Station Name
          </label>
          <input
            type="text"
            value={values.stationName}
            onChange={(e) => handleChange('stationName', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. Indian Oil - XYZ Bunk"
            required
          />
        </div>

        {/* Locality */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Location / Area
          </label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. Kelambakkam, Chennai"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Check className="w-4 h-4" />}
          >
            Apply Corrections
          </Button>
        </div>
      </form>
    </Modal>
  )
}
