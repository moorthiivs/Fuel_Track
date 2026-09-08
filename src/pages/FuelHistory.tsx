import React, { useState, useMemo } from 'react'
import { HeaderBar } from '../components/common/HeaderBar'
import { FuelCard } from '../components/fuel/FuelCard'
import { ClickSpark } from '../components/reactbits/ClickSpark'
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
    <ClickSpark sparkColor="#10b981" sparkCount={6} className="w-full min-h-full flex flex-col pb-8">
      <HeaderBar
        title="Fuel History"
        subtitle={`${fuelEntries.length} verified logs recorded`}
      />

      <div className="px-4 py-4 sm:px-6 space-y-4 max-w-md mx-auto w-full">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station, bunk, or vehicle..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 active:scale-90 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills with Ergonomic Touch Targets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap min-h-[38px] transition-all duration-200 select-none cursor-pointer active:scale-95 flex items-center justify-center',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
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
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 space-y-2">
              <Fuel className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                No matching fuel records found
              </p>
              <p className="text-xs text-slate-500">
                Try searching a different keyword or change the filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </ClickSpark>
  )
}
