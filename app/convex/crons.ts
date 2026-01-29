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

export default crons
