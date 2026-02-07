import type { ExtendedObservation } from '@/lib/types'

function createObservation(
  id: string,
  paddockId: string,
  date: string,
  ndvi: number,
  evi: number,
  ndwi: number,
  cloudCoverage: number
): ExtendedObservation {
  return {
    id,
    paddockId,
    date,
    ndviMean: ndvi,
    ndviMin: ndvi * 0.85,
    ndviMax: ndvi * 1.1,
    ndviStd: 0.05,
    eviMean: evi,
    ndwiMean: ndwi,
    cloudFreePct: 100 - cloudCoverage,
    pixelCount: 1000,
    isValid: true,
    sourceProvider: 'sentinel-2',
    resolutionMeters: 10,
    evi,
    ndwi,
  }
}

export const observations: ExtendedObservation[] = [
  createObservation('obs-p1-01', 'p1', '2024-12-25', 0.15, 0.10, -0.18, 8),
  createObservation('obs-p1-02', 'p1', '2024-12-27', 0.16, 0.11, -0.17, 5),
  createObservation('obs-p1-03', 'p1', '2024-12-29', 0.17, 0.12, -0.16, 12),
  createObservation('obs-p1-04', 'p1', '2024-12-31', 0.18, 0.12, -0.15, 10),
  createObservation('obs-p1-05', 'p1', '2025-01-02', 0.19, 0.13, -0.14, 5),
  createObservation('obs-p1-06', 'p1', '2025-01-04', 0.20, 0.14, -0.13, 12),
  createObservation('obs-p1-07', 'p1', '2025-01-06', 0.22, 0.15, -0.12, 8),
  createObservation('obs-p1-08', 'p1', '2025-01-08', 0.24, 0.17, -0.11, 15),
  createObservation('obs-p1-09', 'p1', '2025-01-10', 0.26, 0.18, -0.10, 3),
  createObservation('obs-p1-10', 'p1', '2025-01-12', 0.28, 0.20, -0.09, 7),
  createObservation('obs-p1-11', 'p1', '2025-01-14', 0.31, 0.22, -0.08, 12),
  createObservation('obs-p1-12', 'p1', '2025-01-16', 0.33, 0.24, -0.07, 10),

  createObservation('obs-p2-01', 'p2', '2024-12-25', 0.32, 0.24, -0.10, 8),
  createObservation('obs-p2-02', 'p2', '2024-12-27', 0.34, 0.26, -0.09, 5),
  createObservation('obs-p2-03', 'p2', '2024-12-29', 0.36, 0.28, -0.08, 12),
  createObservation('obs-p2-04', 'p2', '2024-12-31', 0.38, 0.29, -0.07, 10),
  createObservation('obs-p2-05', 'p2', '2025-01-02', 0.40, 0.31, -0.06, 5),
  createObservation('obs-p2-06', 'p2', '2025-01-04', 0.42, 0.32, -0.05, 12),
  createObservation('obs-p2-07', 'p2', '2025-01-06', 0.43, 0.33, -0.04, 8),
  createObservation('obs-p2-08', 'p2', '2025-01-08', 0.45, 0.34, -0.03, 15),
  createObservation('obs-p2-09', 'p2', '2025-01-10', 0.46, 0.35, -0.02, 3),
  createObservation('obs-p2-10', 'p2', '2025-01-12', 0.47, 0.36, -0.02, 7),
  createObservation('obs-p2-11', 'p2', '2025-01-14', 0.48, 0.37, -0.01, 12),
  createObservation('obs-p2-12', 'p2', '2025-01-16', 0.48, 0.37, -0.01, 10),

  createObservation('obs-p3-01', 'p3', '2024-12-25', 0.25, 0.18, -0.14, 8),
  createObservation('obs-p3-02', 'p3', '2024-12-27', 0.27, 0.19, -0.13, 5),
  createObservation('obs-p3-03', 'p3', '2024-12-29', 0.29, 0.21, -0.12, 12),
  createObservation('obs-p3-04', 'p3', '2024-12-31', 0.30, 0.22, -0.11, 10),
  createObservation('obs-p3-05', 'p3', '2025-01-02', 0.32, 0.23, -0.10, 5),
  createObservation('obs-p3-06', 'p3', '2025-01-04', 0.34, 0.25, -0.09, 12),
  createObservation('obs-p3-07', 'p3', '2025-01-06', 0.35, 0.26, -0.08, 8),
  createObservation('obs-p3-08', 'p3', '2025-01-08', 0.36, 0.27, -0.08, 15),
  createObservation('obs-p3-09', 'p3', '2025-01-10', 0.37, 0.28, -0.07, 3),
  createObservation('obs-p3-10', 'p3', '2025-01-12', 0.38, 0.29, -0.06, 7),
  createObservation('obs-p3-11', 'p3', '2025-01-14', 0.39, 0.30, -0.06, 12),
  createObservation('obs-p3-12', 'p3', '2025-01-16', 0.39, 0.30, -0.05, 10),

  createObservation('obs-p4-01', 'p4', '2024-12-25', 0.32, 0.24, -0.14, 8),
  createObservation('obs-p4-02', 'p4', '2024-12-27', 0.34, 0.26, -0.13, 5),
  createObservation('obs-p4-03', 'p4', '2024-12-29', 0.36, 0.28, -0.12, 12),
  createObservation('obs-p4-04', 'p4', '2024-12-31', 0.38, 0.29, -0.11, 10),
  createObservation('obs-p4-05', 'p4', '2025-01-02', 0.40, 0.31, -0.10, 5),
  createObservation('obs-p4-06', 'p4', '2025-01-04', 0.42, 0.32, -0.09, 12),
  createObservation('obs-p4-07', 'p4', '2025-01-06', 0.44, 0.34, -0.08, 8),
  createObservation('obs-p4-08', 'p4', '2025-01-08', 0.46, 0.36, -0.07, 15),
  createObservation('obs-p4-09', 'p4', '2025-01-10', 0.48, 0.38, -0.06, 3),
  createObservation('obs-p4-10', 'p4', '2025-01-12', 0.50, 0.40, -0.05, 7),
  createObservation('obs-p4-11', 'p4', '2025-01-14', 0.52, 0.42, -0.04, 12),
  createObservation('obs-p4-12', 'p4', '2025-01-16', 0.53, 0.43, -0.04, 10),

  createObservation('obs-p5-01', 'p5', '2024-12-25', 0.50, 0.40, -0.06, 8),
  createObservation('obs-p5-02', 'p5', '2024-12-27', 0.52, 0.42, -0.05, 5),
  createObservation('obs-p5-03', 'p5', '2024-12-29', 0.53, 0.43, -0.04, 12),
  createObservation('obs-p5-04', 'p5', '2024-12-31', 0.54, 0.44, -0.03, 10),
  createObservation('obs-p5-05', 'p5', '2025-01-02', 0.55, 0.45, -0.02, 5),
  createObservation('obs-p5-06', 'p5', '2025-01-04', 0.54, 0.44, -0.02, 12),
  createObservation('obs-p5-07', 'p5', '2025-01-06', 0.52, 0.42, -0.03, 8),
  createObservation('obs-p5-08', 'p5', '2025-01-08', 0.48, 0.38, -0.05, 15),
  createObservation('obs-p5-09', 'p5', '2025-01-10', 0.40, 0.30, -0.08, 3),
  createObservation('obs-p5-10', 'p5', '2025-01-12', 0.32, 0.22, -0.12, 7),
  createObservation('obs-p5-11', 'p5', '2025-01-14', 0.25, 0.16, -0.15, 12),
  createObservation('obs-p5-12', 'p5', '2025-01-16', 0.22, 0.14, -0.16, 10),

  createObservation('obs-p6-01', 'p6', '2024-12-25', 0.48, 0.38, -0.06, 8),
  createObservation('obs-p6-02', 'p6', '2024-12-27', 0.50, 0.40, -0.05, 5),
  createObservation('obs-p6-03', 'p6', '2024-12-29', 0.51, 0.41, -0.04, 12),
  createObservation('obs-p6-04', 'p6', '2024-12-31', 0.52, 0.42, -0.03, 10),
  createObservation('obs-p6-05', 'p6', '2025-01-02', 0.50, 0.40, -0.04, 5),
  createObservation('obs-p6-06', 'p6', '2025-01-04', 0.42, 0.32, -0.08, 12),
  createObservation('obs-p6-07', 'p6', '2025-01-06', 0.35, 0.25, -0.12, 8),
  createObservation('obs-p6-08', 'p6', '2025-01-08', 0.28, 0.18, -0.15, 15),
  createObservation('obs-p6-09', 'p6', '2025-01-10', 0.30, 0.20, -0.14, 3),
  createObservation('obs-p6-10', 'p6', '2025-01-12', 0.32, 0.22, -0.13, 7),
  createObservation('obs-p6-11', 'p6', '2025-01-14', 0.34, 0.24, -0.12, 12),
  createObservation('obs-p6-12', 'p6', '2025-01-16', 0.35, 0.25, -0.11, 10),

  createObservation('obs-p7-01', 'p7', '2024-12-25', 0.28, 0.20, -0.12, 8),
  createObservation('obs-p7-02', 'p7', '2024-12-27', 0.30, 0.22, -0.11, 5),
  createObservation('obs-p7-03', 'p7', '2024-12-29', 0.32, 0.24, -0.10, 12),
  createObservation('obs-p7-04', 'p7', '2024-12-31', 0.34, 0.26, -0.09, 10),
  createObservation('obs-p7-05', 'p7', '2025-01-02', 0.36, 0.28, -0.08, 5),
  createObservation('obs-p7-06', 'p7', '2025-01-04', 0.38, 0.29, -0.07, 12),
  createObservation('obs-p7-07', 'p7', '2025-01-06', 0.39, 0.30, -0.06, 8),
  createObservation('obs-p7-08', 'p7', '2025-01-08', 0.40, 0.31, -0.05, 15),
  createObservation('obs-p7-09', 'p7', '2025-01-10', 0.41, 0.32, -0.04, 3),
  createObservation('obs-p7-10', 'p7', '2025-01-12', 0.42, 0.33, -0.04, 7),
  createObservation('obs-p7-11', 'p7', '2025-01-14', 0.43, 0.34, -0.03, 12),
  createObservation('obs-p7-12', 'p7', '2025-01-16', 0.44, 0.35, -0.03, 10),

  createObservation('obs-p8-01', 'p8', '2024-12-25', 0.45, 0.35, -0.08, 8),
  createObservation('obs-p8-02', 'p8', '2024-12-27', 0.47, 0.37, -0.07, 5),
  createObservation('obs-p8-03', 'p8', '2024-12-29', 0.48, 0.38, -0.06, 12),
  createObservation('obs-p8-04', 'p8', '2024-12-31', 0.50, 0.40, -0.05, 10),
  createObservation('obs-p8-05', 'p8', '2025-01-02', 0.51, 0.41, -0.04, 5),
  createObservation('obs-p8-06', 'p8', '2025-01-04', 0.52, 0.42, -0.03, 12),
  createObservation('obs-p8-07', 'p8', '2025-01-06', 0.50, 0.40, -0.04, 8),
  createObservation('obs-p8-08', 'p8', '2025-01-08', 0.45, 0.35, -0.06, 15),
  createObservation('obs-p8-09', 'p8', '2025-01-10', 0.35, 0.25, -0.10, 3),
  createObservation('obs-p8-10', 'p8', '2025-01-12', 0.25, 0.16, -0.14, 7),
  createObservation('obs-p8-11', 'p8', '2025-01-14', 0.20, 0.12, -0.17, 12),
  createObservation('obs-p8-12', 'p8', '2025-01-16', 0.19, 0.11, -0.18, 10),
]

export function getObservationsForPasture(pastureId: string): ExtendedObservation[] {
  return observations.filter(o => o.paddockId === pastureId).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export function getLatestObservation(pastureId: string): ExtendedObservation | undefined {
  const pastureObs = getObservationsForPasture(pastureId)
  return pastureObs[pastureObs.length - 1]
}

export function calculateNdviTrend(pastureId: string): number {
  const obs = getObservationsForPasture(pastureId)
  if (obs.length < 2) return 0

  const recent = obs.slice(-3)
  const earlier = obs.slice(-6, -3)

  if (recent.length === 0 || earlier.length === 0) return 0

  const recentAvg = recent.reduce((sum, o) => sum + o.ndviMean, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, o) => sum + o.ndviMean, 0) / earlier.length

  return Number((recentAvg - earlierAvg).toFixed(3))
}
