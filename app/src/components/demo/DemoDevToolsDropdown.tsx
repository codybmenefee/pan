import { Wrench, RotateCcw, Trash2, Calendar, Database, Settings, GraduationCap, Camera, Eraser, History, RefreshCw, CalendarDays } from 'lucide-react'
import { useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { useTutorial } from '@/components/onboarding/tutorial'
import { useDemoAuth } from '@/lib/auth/DemoAuthProvider'
import { isDemoDevMode, clearDemoEdits, hasDemoEdits } from '@/lib/demo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DemoDevToolsDropdown() {
  const { activeFarmId } = useFarmContext()
  const navigate = useNavigate()
  const { startTutorial, resetTutorial } = useTutorial()
  const { demoSessionId } = useDemoAuth()

  const deleteTodayPlan = useMutation(api.intelligence.deleteTodayPlan)
  const clearGrazingEvents = useMutation(api.intelligence.clearGrazingEvents)
  const resetSettings = useMutation(api.settings.resetSettings)
  const setupTutorialDemo = useMutation(api.farms.setupTutorialDemo)
  const backdateSections = useMutation(api.intelligence.backdateSections)
  const regenerateDemoHistory = useMutation(api.demo.regenerateDemoHistory)

  // In dev mode, operate on source farm (farm-1) to edit demo source data
  // In public demo mode, operate on session-specific farm
  const effectiveFarmId = isDemoDevMode ? 'farm-1' : activeFarmId

  const handleViewTutorial = () => {
    resetTutorial()
    startTutorial()
  }

  const handleResetOnboarding = () => {
    navigate({ to: '/app/onboarding' })
    toast.success('Navigating to onboarding')
  }

  const handleDeleteTodayPlan = async () => {
    try {
      await deleteTodayPlan({ farmExternalId: effectiveFarmId ?? undefined })
      toast.success("Today's plan deleted")
    } catch {
      toast.error('Failed to delete plan')
    }
  }

  const handleClearGrazingEvents = async () => {
    try {
      await clearGrazingEvents({ farmExternalId: effectiveFarmId ?? undefined })
      toast.success('Grazing events cleared')
    } catch {
      toast.error('Failed to clear grazing events')
    }
  }

  const handleClearLocalStorage = () => {
    localStorage.clear()
    toast.success('localStorage cleared')
  }

  const handleResetSettings = async () => {
    if (!effectiveFarmId) {
      toast.error('No active farm')
      return
    }
    try {
      await resetSettings({ farmId: effectiveFarmId })
      toast.success('Settings reset to defaults')
    } catch {
      toast.error('Failed to reset settings')
    }
  }

  const handleSetupTutorialDemo = async () => {
    try {
      const result = await setupTutorialDemo({ farmExternalId: effectiveFarmId ?? undefined })
      toast.success(`Tutorial demo setup complete! ${result.paddocksUpdated} paddocks updated.`)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to setup tutorial demo')
      console.error('Tutorial demo setup error:', error)
    }
  }

  const handleClearDemoEdits = () => {
    if (!demoSessionId) {
      toast.error('No demo session')
      return
    }
    clearDemoEdits(demoSessionId)
    toast.success('Demo edits cleared - reverting to base data')
    // Refresh the page to show Convex base data
    window.location.reload()
  }

  const handleBackdateSections = async () => {
    try {
      const result = await backdateSections({ farmExternalId: effectiveFarmId ?? undefined })
      toast.success(`Sections backdated by 1 day (${result.updated} sections updated)`)
      // Refresh to show updated dates
      window.location.reload()
    } catch (error) {
      toast.error('Failed to backdate sections')
      console.error('Backdate sections error:', error)
    }
  }

  const handleRegenerateDemoHistory = async () => {
    if (!effectiveFarmId) {
      toast.error('No active farm')
      return
    }
    console.log('[DemoDevToolsDropdown] Regenerating demo history for farm:', effectiveFarmId, 'isDemoDevMode:', isDemoDevMode, 'activeFarmId:', activeFarmId)
    try {
      toast.loading('Regenerating demo history...')
      const result = await regenerateDemoHistory({ farmExternalId: effectiveFarmId })
      toast.dismiss()
      toast.success(`Demo history regenerated: ${result.plansCreated} plans created`)
      // Refresh to show updated data
      window.location.reload()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to regenerate demo history')
      console.error('Regenerate demo history error:', error)
    }
  }

  const handleSetDemoDate = async () => {
    if (!effectiveFarmId) {
      toast.error('No active farm')
      return
    }

    // Simple prompt for date input
    const dateInput = window.prompt('Enter demo date (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
    if (!dateInput) return

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      toast.error('Invalid date format. Please use YYYY-MM-DD')
      return
    }

    try {
      toast.loading('Setting demo date...')
      const result = await regenerateDemoHistory({
        farmExternalId: effectiveFarmId,
        demoDate: dateInput,
        historyDays: 14,
      })
      toast.dismiss()
      toast.success(`Demo date set to ${dateInput}: ${result.plansCreated} plans created`)
      // Refresh to show updated data
      window.location.reload()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to set demo date')
      console.error('Set demo date error:', error)
    }
  }

  // Check if there are demo edits to clear
  const showClearDemoEdits = !isDemoDevMode && demoSessionId && hasDemoEdits(demoSessionId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent" title="Dev Tools">
          <Wrench className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleSetupTutorialDemo}>
          <Camera className="h-3.5 w-3.5 mr-2" />
          Setup Tutorial Demo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewTutorial}>
          <GraduationCap className="h-3.5 w-3.5 mr-2" />
          View Tutorial
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetOnboarding}>
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          Reset Onboarding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDeleteTodayPlan}>
          <Calendar className="h-3.5 w-3.5 mr-2" />
          Delete Today's Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBackdateSections}>
          <History className="h-3.5 w-3.5 mr-2" />
          Backdate Sections (-1 day)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRegenerateDemoHistory}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Regenerate Demo History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSetDemoDate}>
          <CalendarDays className="h-3.5 w-3.5 mr-2" />
          Set Demo Date...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleClearGrazingEvents}>
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Clear Grazing Events
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleClearLocalStorage}>
          <Database className="h-3.5 w-3.5 mr-2" />
          Clear localStorage
        </DropdownMenuItem>
        {showClearDemoEdits && (
          <DropdownMenuItem onClick={handleClearDemoEdits}>
            <Eraser className="h-3.5 w-3.5 mr-2" />
            Clear Demo Edits
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetSettings}>
          <Settings className="h-3.5 w-3.5 mr-2" />
          Reset Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
