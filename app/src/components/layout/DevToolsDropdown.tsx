import { Wrench, RotateCcw, Trash2, Calendar, Database, Settings, GraduationCap, Camera, History, RefreshCw, CalendarDays } from 'lucide-react'
import { useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { useAppAuth } from '@/lib/auth'
import { useTutorial } from '@/components/onboarding/tutorial'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DevToolsDropdown() {
  const { isDevAuth } = useAppAuth()
  const { activeFarmId } = useFarmContext()
  const navigate = useNavigate()
  const { startTutorial, resetTutorial } = useTutorial()

  const deleteTodayPlan = useMutation(api.intelligence.deleteTodayPlan)
  const clearGrazingEvents = useMutation(api.intelligence.clearGrazingEvents)
  const resetSettings = useMutation(api.settings.resetSettings)
  const setupTutorialDemo = useMutation(api.farms.setupTutorialDemo)
  const backdateSections = useMutation(api.intelligence.backdateSections)
  const regenerateDemoHistory = useMutation(api.demo.regenerateDemoHistory)

  // Only render in dev mode
  if (!isDevAuth) return null

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
      await deleteTodayPlan({ farmExternalId: activeFarmId ?? undefined })
      toast.success("Today's plan deleted")
    } catch (error) {
      toast.error('Failed to delete plan')
    }
  }

  const handleClearGrazingEvents = async () => {
    try {
      await clearGrazingEvents({ farmExternalId: activeFarmId ?? undefined })
      toast.success('Grazing events cleared')
    } catch (error) {
      toast.error('Failed to clear grazing events')
    }
  }

  const handleClearLocalStorage = () => {
    localStorage.clear()
    toast.success('localStorage cleared')
  }

  const handleResetSettings = async () => {
    if (!activeFarmId) {
      toast.error('No active farm')
      return
    }
    try {
      await resetSettings({ farmId: activeFarmId })
      toast.success('Settings reset to defaults')
    } catch (error) {
      toast.error('Failed to reset settings')
    }
  }

  const handleSetupTutorialDemo = async () => {
    try {
      const result = await setupTutorialDemo({ farmExternalId: activeFarmId ?? undefined })
      toast.success(`Tutorial demo setup complete! ${result.paddocksUpdated} paddocks updated.`)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to setup tutorial demo')
      console.error('Tutorial demo setup error:', error)
    }
  }

  const handleBackdateSections = async () => {
    try {
      const result = await backdateSections({ farmExternalId: activeFarmId ?? undefined })
      toast.success(`Sections backdated by 1 day (${result.updated} sections updated)`)
      // Refresh to show updated dates
      window.location.reload()
    } catch (error) {
      toast.error('Failed to backdate sections')
      console.error('Backdate sections error:', error)
    }
  }

  const handleRegenerateDemoHistory = async () => {
    if (!activeFarmId) {
      toast.error('No active farm')
      return
    }
    try {
      toast.loading('Regenerating demo history...')
      const result = await regenerateDemoHistory({ farmExternalId: activeFarmId })
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
    if (!activeFarmId) {
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
        farmExternalId: activeFarmId,
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetSettings}>
          <Settings className="h-3.5 w-3.5 mr-2" />
          Reset Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
