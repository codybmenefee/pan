import { useState } from 'react'
import { Wrench, RotateCcw, Trash2, Calendar, Database, Settings, GraduationCap, Camera, History, RefreshCw, CalendarDays, Rewind, Grid2X2, Eraser } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DevToolsDropdown() {
  const { isDevAuth } = useAppAuth()
  const { activeFarmId } = useFarmContext()
  const navigate = useNavigate()
  const { startTutorial, resetTutorial } = useTutorial()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const deleteTodayPlan = useMutation(api.intelligence.deleteTodayPlan)
  const clearGrazingEvents = useMutation(api.intelligence.clearGrazingEvents)
  const resetSettings = useMutation(api.settings.resetSettings)
  const setupTutorialDemo = useMutation(api.farms.setupTutorialDemo)
  const backdatePaddocks = useMutation(api.intelligence.backdatePaddocks)
  const regenerateDemoHistory = useMutation(api.demo.regenerateDemoHistory)
  const shiftPlanDatesBack = useMutation(api.intelligence.shiftPlanDatesBack)
  const deleteForecast = useMutation(api.grazingAgentTools.deleteForecast)
  const resetAllPaddockGrazingData = useMutation(api.intelligence.resetAllPaddockGrazingData)

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
    } catch (_error) {
      toast.error('Failed to delete plan')
    }
  }

  const handleClearGrazingEvents = async () => {
    try {
      await clearGrazingEvents({ farmExternalId: activeFarmId ?? undefined })
      toast.success('Grazing events cleared')
    } catch (_error) {
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
    } catch (_error) {
      toast.error('Failed to reset settings')
    }
  }

  const handleSetupTutorialDemo = async () => {
    try {
      const result = await setupTutorialDemo({ farmExternalId: activeFarmId ?? undefined })
      toast.success(`Tutorial demo setup complete! ${result.pasturesUpdated} pastures updated.`)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to setup tutorial demo')
      console.error('Tutorial demo setup error:', error)
    }
  }

  const handleBackdatePaddocks = async () => {
    try {
      const result = await backdatePaddocks({ farmExternalId: activeFarmId ?? undefined })
      toast.success(`Paddocks backdated by 1 day (${result.updated} paddocks updated)`)
      // Refresh to show updated dates
      window.location.reload()
    } catch (error) {
      toast.error('Failed to backdate paddocks')
      console.error('Backdate paddocks error:', error)
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

  const handleShiftPlanDatesBack = async () => {
    try {
      const result = await shiftPlanDatesBack({ farmExternalId: activeFarmId ?? undefined })
      toast.success(`Shifted ${result.plansUpdated} plan(s) back by one day`)
    } catch (error) {
      toast.error('Failed to shift plan dates')
      console.error('Shift plan dates error:', error)
    }
  }

  const handleDeleteAllForecasts = async () => {
    if (!activeFarmId) {
      toast.error('No active farm')
      return
    }
    try {
      // Delete forecasts for common paddocks (p1-p8)
      const paddocks = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
      let deleted = 0
      for (const paddockId of paddocks) {
        const result = await deleteForecast({ farmExternalId: activeFarmId, paddockExternalId: paddockId })
        if (result.deleted) deleted++
      }
      toast.success(`Deleted ${deleted} forecast(s). New briefs will regenerate with grid sections.`)
    } catch (error) {
      toast.error('Failed to delete forecasts')
      console.error('Delete forecasts error:', error)
    }
  }

  const handleResetAllGrazingData = async () => {
    if (!activeFarmId) {
      toast.error('No active farm')
      return
    }
    try {
      const result = await resetAllPaddockGrazingData({ farmExternalId: activeFarmId })
      const total = result.paddockForecasts + result.sectionGrazingEvents + result.paddockRotations +
                    result.dailyPlans + result.dailyBriefs + result.plans + result.grazingEvents
      toast.success(`Reset complete: ${total} records deleted`)
      setShowResetConfirm(false)
    } catch (error) {
      toast.error('Failed to reset grazing data')
      console.error('Reset grazing data error:', error)
    }
  }

  return (
    <>
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
          <DropdownMenuItem onClick={handleBackdatePaddocks}>
            <History className="h-3.5 w-3.5 mr-2" />
            Backdate Paddocks (-1 day)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShiftPlanDatesBack}>
            <Rewind className="h-3.5 w-3.5 mr-2" />
            Shift Plans Back 1 Day
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
          <DropdownMenuItem onClick={handleDeleteAllForecasts}>
            <Grid2X2 className="h-3.5 w-3.5 mr-2" />
            Reset Forecasts (Grid)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResetConfirm(true)}>
            <Eraser className="h-3.5 w-3.5 mr-2" />
            Reset All Grazing Data
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

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Grazing Data?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All grazing forecasts and sections</li>
                  <li>All daily plans and briefs</li>
                  <li>All grazing events and history</li>
                </ul>
                <p className="font-medium text-foreground">
                  Your paddocks and satellite observations will NOT be affected.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetAllGrazingData}>
              Reset All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
