// Re-export pastures as paddocks for backward compatibility.
// The data in this file historically represented pastures (not paddocks),
// so it now delegates to the correctly-typed pastures module.
export {
  pastures as paddocks,
  getPastureById as getPaddockById,
  getPasturesByStatus as getPaddocksByStatus,
  getStatusCounts,
} from './pastures'
