import type { Plan, Paddock } from '@/lib/types'
import { getPastureById } from './pastures'
import { generatePaddock, generatePastureStayPaddocks, calculatePastureDays } from '@/lib/paddockGenerator'

// Get the current pasture (East Ridge - where livestock are)
const currentPasture = getPastureById('p4')!

// Calculate how many days we'll spend in this pasture
const totalDaysInPasture = calculatePastureDays(currentPasture.area)

// We're on day 2 of the rotation in East Ridge
const currentDayInPasture = 2

// Generate today's paddock
const todaysPaddock: Paddock = generatePaddock({
  pasture: currentPasture,
  dayIndex: currentDayInPasture - 1, // 0-indexed
  totalDays: totalDaysInPasture,
})
todaysPaddock.date = new Date().toISOString().split('T')[0]

// Generate previous paddocks (days 1 was already grazed)
const previousPaddocks: Paddock[] = []
for (let day = 0; day < currentDayInPasture - 1; day++) {
  const prevDate = new Date()
  prevDate.setDate(prevDate.getDate() - (currentDayInPasture - 1 - day))

  const paddock = generatePaddock({
    pasture: currentPasture,
    dayIndex: day,
    totalDays: totalDaysInPasture,
  })
  paddock.date = prevDate.toISOString().split('T')[0]
  previousPaddocks.push(paddock)
}

// Generate paddock alternatives - other polygon options within the same pasture
// Temporarily disabled - uncomment when needed
// const paddockAlternatives = generatePaddockAlternatives(
//   currentPasture,
//   currentDayInPasture - 1,
//   totalDaysInPasture,
//   2 // Generate 2 alternatives
// )

export const todaysPlan: Plan = {
  id: 'plan-2025-01-16',
  date: new Date().toISOString().split('T')[0],
  currentPastureId: 'p4', // East Ridge - currently grazing
  recommendedPastureId: 'p4', // Stay in current pasture
  confidence: 87,
  reasoning: [
    `Day ${currentDayInPasture} of ${totalDaysInPasture} in East Ridge`,
    'NDVI: 0.52 (healthy, graze-ready)',
    'Paddock selected for optimal grass density',
    'Previous paddock recovering well',
  ],
  status: 'pending',
  briefNarrative: `Day ${currentDayInPasture} of your rotation in East Ridge. Today's paddock covers ${todaysPaddock.targetArea.toFixed(1)} hectares in the northern portion where grass density is highest. ${totalDaysInPasture - currentDayInPasture} days remaining before transitioning to the next pasture.`,

  // Paddock-based grazing fields
  daysInCurrentPasture: currentDayInPasture,
  totalDaysPlanned: totalDaysInPasture,
  recommendedPaddock: null as unknown as Paddock,
  isPastureTransition: false,
  previousPaddocks: [],

  // Paddock alternatives - other polygon options within same pasture
  paddockAlternatives: [],
  pastureAlternatives: [], // No pasture alternatives when not transitioning
}

// Alternative plan for when it's time to transition pastures
const nextPasture = getPastureById('p2')!
const nextPastureDays = calculatePastureDays(nextPasture.area)

export const transitionPlan: Plan = {
  id: 'plan-transition',
  date: new Date().toISOString().split('T')[0],
  currentPastureId: 'p4', // East Ridge
  recommendedPastureId: 'p2', // North Flat
  confidence: 84,
  reasoning: [
    'East Ridge rotation complete after 4 days',
    'North Flat has recovered with NDVI 0.48',
    '19 days rest exceeds minimum threshold',
    'Water access via stream on west side',
  ],
  status: 'pending',
  briefNarrative: 'Time to move! East Ridge rotation is complete. North Flat has fully recovered and is ready for grazing. The stream on the west side provides excellent water access for the herd.',

  // Paddock-based grazing fields for transition
  daysInCurrentPasture: totalDaysInPasture,
  totalDaysPlanned: totalDaysInPasture,
  recommendedPaddock: generatePaddock({
    pasture: nextPasture,
    dayIndex: 0,
    totalDays: nextPastureDays,
  }),
  isPastureTransition: true,
  nextPastureId: 'p2',
  previousPaddocks: generatePastureStayPaddocks(currentPasture, totalDaysInPasture),

  // For pasture transitions, show pasture alternatives instead of paddock alternatives
  paddockAlternatives: [],
  pastureAlternatives: [
    { pastureId: 'p7', confidence: 72 },
    { pastureId: 'p3', confidence: 58 },
  ],
}

export function getFormattedDate(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
