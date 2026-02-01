import { Link } from '@tanstack/react-router'
import { FlaskConical, RotateCcw, UserPlus } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { useState } from 'react'
import { toast } from 'sonner'

export function DemoBanner() {
  const { demoSessionId, resetDemoSession } = useDemoAuth()
  const resetDemoFarmMutation = useMutation(api.demo.resetDemoFarm)
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    if (!demoSessionId) return

    setIsResetting(true)
    try {
      await resetDemoFarmMutation({ sessionId: demoSessionId })
      // Reset the session to get a fresh start
      resetDemoSession()
      toast.success('Demo reset successfully', {
        description: 'Your demo farm has been restored to its initial state.',
      })
      // Reload the page to reinitialize
      window.location.reload()
    } catch (err) {
      console.error('[DemoBanner] Error resetting demo:', err)
      toast.error('Failed to reset demo')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 px-3 py-1 bg-amber-500/90 text-amber-950 text-xs">
      <div className="flex items-center gap-1.5">
        <FlaskConical className="h-3 w-3" />
        <span className="font-medium">Demo Mode</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/50 hover:bg-white/70 text-amber-900 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset'}</span>
        </button>

        <Link
          to="/sign-in"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900 hover:bg-amber-800 text-white transition-colors"
        >
          <UserPlus className="h-3 w-3" />
          <span>Sign Up Free</span>
        </Link>
      </div>
    </div>
  )
}
