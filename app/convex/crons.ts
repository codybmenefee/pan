import { cronJobs } from 'convex/server'
import { api } from './_generated/api'

const crons = cronJobs()

// Clean up demo farms older than 24 hours
// Runs daily at 3:00 AM UTC
crons.daily(
  'cleanup-demo-farms',
  { hourUTC: 3, minuteUTC: 0 },
  api.demo.cleanupOldDemoFarms
)

// Backup: ensure demo farm has a pending satellite fetch job daily
// Belt-and-suspenders in case the Python scheduler is down.
// createForScheduledCheck deduplicates against existing pending jobs.
crons.daily(
  'ensure-demo-farm-satellite-job',
  { hourUTC: 5, minuteUTC: 0 },
  api.satelliteFetchJobs.createForScheduledCheck,
  { farmExternalId: 'farm-1' }
)

export default crons
