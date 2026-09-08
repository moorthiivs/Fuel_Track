import React, { useState, useMemo } from 'react'
import { HeaderBar } from '../components/common/HeaderBar'
import { FuelCard } from '../components/fuel/FuelCard'
import { useFuelStore } from '../store/fuelStore'
import { Search, Fuel, X } from 'lucide-react'
import { clsx } from 'clsx'

export const FuelHistory: React.FC = () => {
  const fuelEntries = useFuelStore((s) => s.fuelEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Petrol' | 'Diesel' | 'This Month'>('All')

  const filteredEntries = useMemo(() => {
    return fuelEntries.filter((entry) => {
      // Search query filter (station name, vehicle number, location)
      const matchesSearch =
        entry.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Category filter
      if (activeFilter === 'All') return true
      if (activeFilter === 'Petrol') return entry.fuelType === 'Petrol'
      if (activeFilter === 'Diesel') return entry.fuelType === 'Diesel'
      if (activeFilter === 'This Month') {
        // Entries in current or latest month (2026-09)
        return entry.date.startsWith('2026-09') || entry.date.startsWith(new Date().toISOString().slice(0, 7))
      }

      return true
    })
  }, [fuelEntries, searchQuery, activeFilter])

  const filterOptions: Array<'All' | 'Petrol' | 'Diesel' | 'This Month'> = [
    'All',
    'Petrol',
    'Diesel',
    'This Month',
  ]

  return (
    <div className="flex-1 flex flex-col pb-6">
      <HeaderBar
        title="Fuel History"
        subtitle={`${fuelEntries.length} verified logs recorded`}
      />

      <div className="px-4 py-4 sm:px-6 space-y-4 max-w-md mx-auto w-full">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station, bunk, or vehicle..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none cursor-pointer',
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                )}
              >
                {filter}
              </button>
            )
          })}
        </div>

        {/* Entries List */}
        <div className="space-y-3 pt-1">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <FuelCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="py-12 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 space-y-3">
              <Fuel className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-300">
                  No matching fuel entries found
                </p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query or filter selection.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
