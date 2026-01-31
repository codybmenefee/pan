/**
 * Demo mode utilities and hooks.
 *
 * This module provides a localStorage layer for demo mode that allows
 * public users to make edits without affecting the source data in Convex.
 */

export { isDemoDevMode } from './isDemoDevMode'
export {
  getDemoEdits,
  setDemoEdits,
  clearDemoEdits,
  hasDemoEdits,
  getDemoSettings,
  setDemoSettings,
} from './demoLocalStorage'
export { DemoGeometryProvider } from './DemoGeometryProvider'
export { useDemoFarmSettings } from './useDemoFarmSettings'
export {
  useDemoFarmerObservations,
  useDemoRecentFarmerObservations,
  useDemoCreateFarmerObservation,
} from './useDemoObservations'
