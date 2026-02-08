import type { GrazingEvent, PastureStay } from '@/lib/types'
import { getPastureById } from './pastures'
import { generatePastureStayPaddocks } from '@/lib/paddockGenerator'

// Generate paddock geometries for historical grazing events
function generateEventWithPaddocks(
  id: string,
  pastureId: string,
  date: string,
  duration: number,
  entryNdvi: number,
  exitNdvi: number,
  dayIndex: number = 0
): GrazingEvent {
  const pasture = getPastureById(pastureId)
  if (!pasture) {
    return { id, paddockId: pastureId, date, duration, entryNdvi, exitNdvi }
  }

  // Generate a paddock geometry for this event
  const paddocks = generatePastureStayPaddocks(pasture, duration, new Date(date))
  const paddockForDay = paddocks[Math.min(dayIndex, paddocks.length - 1)]

  return {
    id,
    paddockId: pastureId,
    date,
    duration,
    entryNdvi,
    exitNdvi,
    paddockGeometry: paddockForDay?.geometry,
  }
}

// Historical grazing events per pasture with paddock geometries
export const grazingHistory: GrazingEvent[] = [
  // East Ridge (p4)
  generateEventWithPaddocks('ge-p4-1', 'p4', '2024-12-19', 3, 0.58, 0.32, 0),
  generateEventWithPaddocks('ge-p4-2', 'p4', '2024-11-24', 4, 0.55, 0.28, 1),
  generateEventWithPaddocks('ge-p4-3', 'p4', '2024-10-30', 3, 0.52, 0.30, 0),
  generateEventWithPaddocks('ge-p4-4', 'p4', '2024-10-02', 3, 0.50, 0.29, 2),

  // South Valley (p1)
  generateEventWithPaddocks('ge-p1-1', 'p1', '2025-01-02', 3, 0.48, 0.18, 0),
  generateEventWithPaddocks('ge-p1-2', 'p1', '2024-12-08', 4, 0.52, 0.22, 1),
  generateEventWithPaddocks('ge-p1-3', 'p1', '2024-11-12', 3, 0.50, 0.25, 0),

  // North Flat (p2)
  generateEventWithPaddocks('ge-p2-1', 'p2', '2024-12-28', 3, 0.55, 0.30, 0),
  generateEventWithPaddocks('ge-p2-2', 'p2', '2024-12-02', 4, 0.52, 0.28, 1),
  generateEventWithPaddocks('ge-p2-3', 'p2', '2024-11-06', 3, 0.48, 0.26, 2),
  generateEventWithPaddocks('ge-p2-4', 'p2', '2024-10-10', 4, 0.50, 0.24, 0),
  generateEventWithPaddocks('ge-p2-5', 'p2', '2024-09-14', 3, 0.46, 0.22, 1),

  // Top Block (p3)
  generateEventWithPaddocks('ge-p3-1', 'p3', '2024-12-31', 3, 0.50, 0.28, 0),
  generateEventWithPaddocks('ge-p3-2', 'p3', '2024-12-05', 4, 0.48, 0.25, 1),
  generateEventWithPaddocks('ge-p3-3', 'p3', '2024-11-08', 3, 0.45, 0.24, 0),

  // Creek Bend (p5)
  generateEventWithPaddocks('ge-p5-1', 'p5', '2025-01-13', 3, 0.55, 0.22, 0),
  generateEventWithPaddocks('ge-p5-2', 'p5', '2024-12-18', 4, 0.52, 0.26, 1),
  generateEventWithPaddocks('ge-p5-3', 'p5', '2024-11-22', 3, 0.50, 0.28, 2),
  generateEventWithPaddocks('ge-p5-4', 'p5', '2024-10-26', 3, 0.48, 0.25, 0),

  // West Slope (p6)
  generateEventWithPaddocks('ge-p6-1', 'p6', '2025-01-04', 4, 0.52, 0.28, 0),
  generateEventWithPaddocks('ge-p6-2', 'p6', '2024-12-10', 3, 0.50, 0.26, 1),
  generateEventWithPaddocks('ge-p6-3', 'p6', '2024-11-14', 4, 0.48, 0.24, 0),
  generateEventWithPaddocks('ge-p6-4', 'p6', '2024-10-18', 3, 0.46, 0.22, 2),

  // Creek Side (p7)
  generateEventWithPaddocks('ge-p7-1', 'p7', '2024-12-19', 4, 0.58, 0.30, 0),
  generateEventWithPaddocks('ge-p7-2', 'p7', '2024-11-24', 3, 0.54, 0.28, 1),
  generateEventWithPaddocks('ge-p7-3', 'p7', '2024-10-28', 4, 0.52, 0.26, 0),

  // Lower Paddock (p8)
  generateEventWithPaddocks('ge-p8-1', 'p8', '2025-01-11', 5, 0.52, 0.19, 0),
  generateEventWithPaddocks('ge-p8-2', 'p8', '2024-12-14', 4, 0.50, 0.24, 1),
  generateEventWithPaddocks('ge-p8-3', 'p8', '2024-11-16', 5, 0.48, 0.22, 2),
  generateEventWithPaddocks('ge-p8-4', 'p8', '2024-10-20', 4, 0.46, 0.20, 0),
]

// Pasture stays - multi-day rotations with all paddocks
export function generatePastureStays(): PastureStay[] {
  const stays: PastureStay[] = []

  // Group events by pasture and generate complete stays
  const pastureIds = ['p4', 'p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8']

  pastureIds.forEach(pastureId => {
    const pasture = getPastureById(pastureId)
    if (!pasture) return

    const events = grazingHistory.filter(e => e.paddockId === pastureId)

    events.forEach((event, index) => {
      const entryDate = new Date(event.date)
      const exitDate = new Date(entryDate)
      exitDate.setDate(exitDate.getDate() + event.duration)

      const paddocks = generatePastureStayPaddocks(pasture, event.duration, entryDate)

      stays.push({
        id: `stay-${pastureId}-${index}`,
        pastureId,
        pastureName: pasture.name,
        entryDate: entryDate.toISOString().split('T')[0],
        exitDate: exitDate.toISOString().split('T')[0],
        paddocks,
        totalArea: paddocks.reduce((sum, s) => sum + s.targetArea, 0),
      })
    })
  })

  // Sort by entry date descending
  return stays.sort((a, b) =>
    new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  )
}

export const pastureStays = generatePastureStays()

export function getGrazingHistoryForPasture(pastureId: string): GrazingEvent[] {
  return grazingHistory
    .filter(e => e.paddockId === pastureId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRecentGrazingEvents(limit: number = 10): GrazingEvent[] {
  return [...grazingHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

export function getPastureStaysForPasture(pastureId: string): PastureStay[] {
  return pastureStays.filter(s => s.pastureId === pastureId)
}

export function getCurrentPastureStay(): PastureStay | undefined {
  // Return the most recent stay (which might still be ongoing)
  const currentPasture = getPastureById('p4')! // East Ridge

  const today = new Date()
  const entryDate = new Date(today)
  entryDate.setDate(entryDate.getDate() - 1) // Started yesterday

  const paddocks = generatePastureStayPaddocks(currentPasture, 2, entryDate) // 2 days so far

  return {
    id: 'stay-current',
    pastureId: 'p4',
    pastureName: 'East Ridge',
    entryDate: entryDate.toISOString().split('T')[0],
    paddocks,
    totalArea: paddocks.reduce((sum, paddock) => sum + paddock.targetArea, 0),
  }
}
