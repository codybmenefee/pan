/**
 * Check if we're in demo dev mode (developer editing demo source data).
 * When VITE_DEV_AUTH=true, writes go directly to Convex (persistent).
 * When not set, writes go to localStorage (ephemeral, per-session).
 */
export const isDemoDevMode = import.meta.env.VITE_DEV_AUTH === 'true'
