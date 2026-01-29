import { useState, useMemo } from 'react'
import type { TileType } from '../../lib/hooks/useSatelliteTiles'
import { useAvailableDates } from '../../lib/hooks/useSatelliteTiles'
import { useSubscription } from '../../lib/hooks/useSubscription'
import { cn } from '@/lib/utils'

interface HistoricalDatePickerProps {
  /**
   * Farm ID to fetch dates for (external ID)
   */
  farmId: string

  /**
   * Currently selected date
   */
  selectedDate: string | null

  /**
   * Callback when date is selected
   */
  onDateSelect: (date: string) => void

  /**
   * Optional filter by tile type
   */
  tileType?: TileType

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Calendar-style date picker showing available satellite capture dates.
 * Shows quality indicator (cloud cover) and available tile types per date.
 */
export function HistoricalDatePicker({
  farmId,
  selectedDate,
  onDateSelect,
  tileType,
  className = '',
}: HistoricalDatePickerProps) {
  const { dates, isLoading } = useAvailableDates(farmId, tileType)
  const { tier } = useSubscription(farmId)

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Group dates by month for calendar view
  const dateMap = useMemo(() => {
    const map = new Map<string, (typeof dates)[0]>()
    for (const d of dates) {
      map.set(d.date, d)
    }
    return map
  }, [dates])

  // Get retention limit based on tier
  const retentionMonths = useMemo(() => {
    switch (tier) {
      case 'free':
        return 12
      case 'homesteader':
        return 12
      case 'producer':
        return 36
      case 'commercial':
        return Infinity
      default:
        return 12
    }
  }, [tier])

  // Calculate the oldest allowed date
  const oldestAllowedDate = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - retentionMonths)
    return date.toISOString().split('T')[0]
  }, [retentionMonths])

  // Generate calendar days for the view month
  const calendarDays = useMemo(() => {
    const year = viewMonth.year
    const month = viewMonth.month

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: Array<{
      date: string
      dayNum: number
      isCurrentMonth: boolean
      hasData: boolean
      cloudCover?: number
      tileTypes?: string[]
      isRestricted: boolean
    }> = []

    // Padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startPadding - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      const data = dateMap.get(dateStr)

      days.push({
        date: dateStr,
        dayNum,
        isCurrentMonth: false,
        hasData: !!data,
        cloudCover: data?.cloudCoverPct,
        tileTypes: data?.tileTypes,
        isRestricted: dateStr < oldestAllowedDate,
      })
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const data = dateMap.get(dateStr)

      days.push({
        date: dateStr,
        dayNum: i,
        isCurrentMonth: true,
        hasData: !!data,
        cloudCover: data?.cloudCoverPct,
        tileTypes: data?.tileTypes,
        isRestricted: dateStr < oldestAllowedDate,
      })
    }

    // Padding days from next month
    const remainingDays = 42 - days.length // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const data = dateMap.get(dateStr)

      days.push({
        date: dateStr,
        dayNum: i,
        isCurrentMonth: false,
        hasData: !!data,
        cloudCover: data?.cloudCoverPct,
        tileTypes: data?.tileTypes,
        isRestricted: dateStr < oldestAllowedDate,
      })
    }

    return days
  }, [viewMonth, dateMap, oldestAllowedDate])

  const navigateMonth = (delta: number) => {
    setViewMonth((prev) => {
      let newMonth = prev.month + delta
      let newYear = prev.year

      if (newMonth < 0) {
        newMonth = 11
        newYear--
      } else if (newMonth > 11) {
        newMonth = 0
        newYear++
      }

      return { year: newYear, month: newMonth }
    })
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-muted rounded-lg h-36', className)} />
    )
  }

  return (
    <div className={cn('bg-card rounded-lg border border-border p-1.5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-0.5 hover:bg-muted rounded"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xs font-medium text-foreground">
          {monthNames[viewMonth.month]} {viewMonth.year}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-0.5 hover:bg-muted rounded"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-[10px] font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => day.hasData && !day.isRestricted && onDateSelect(day.date)}
            disabled={!day.hasData || day.isRestricted}
            className={cn(
              'relative h-5 flex items-center justify-center rounded text-xs',
              day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
              selectedDate === day.date && 'bg-primary text-white',
              day.hasData && !day.isRestricted && selectedDate !== day.date && 'hover:bg-muted cursor-pointer',
              (!day.hasData || day.isRestricted) && 'cursor-not-allowed',
              day.isRestricted && day.hasData && 'opacity-50'
            )}
          >
            <span>{day.dayNum}</span>
            {/* Data indicator */}
            {day.hasData && !day.isRestricted && (
              <span
                className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  day.cloudCover && day.cloudCover < 20
                    ? 'bg-green-500'
                    : day.cloudCover && day.cloudCover < 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                )}
                title={`Cloud cover: ${day.cloudCover?.toFixed(0) ?? 'N/A'}%`}
              />
            )}
            {/* Lock indicator for restricted dates */}
            {day.isRestricted && day.hasData && (
              <span className="absolute top-0 right-0 text-muted-foreground">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compact footer: legend dots + count inline */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Clear</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />Hazy</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Cloudy</span>
        </div>
        <span>{dates.length} dates</span>
      </div>
    </div>
  )
}

/**
 * Compact list view of available dates.
 */
export function HistoricalDateList({
  farmId,
  selectedDate,
  onDateSelect,
  maxItems = 10,
  className = '',
}: {
  farmId: string
  selectedDate: string | null
  onDateSelect: (date: string) => void
  maxItems?: number
  className?: string
}) {
  const { dates, isLoading } = useAvailableDates(farmId)

  if (isLoading) {
    return <div className={`animate-pulse bg-gray-100 rounded h-32 ${className}`} />
  }

  const displayDates = dates.slice(0, maxItems)

  return (
    <div className={`space-y-1 ${className}`}>
      {displayDates.map((d) => (
        <button
          key={d.date}
          onClick={() => onDateSelect(d.date)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm ${
            selectedDate === d.date
              ? 'bg-green-100 text-green-800'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="font-medium">{formatDate(d.date)}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${
                d.cloudCoverPct < 20
                  ? 'text-green-600'
                  : d.cloudCoverPct < 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {d.cloudCoverPct.toFixed(0)}% clouds
            </span>
            <span className="text-xs text-gray-400">{d.provider}</span>
          </div>
        </button>
      ))}
      {dates.length > maxItems && (
        <p className="text-xs text-gray-500 text-center pt-2">
          + {dates.length - maxItems} more dates
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
