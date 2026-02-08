import { useEffect, useState, useCallback, useMemo } from 'react'
import { Save, Check, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGeometry, calculateAreaHectares } from '@/lib/geometry'
import { useFarmContext } from '@/lib/farm'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { useAppAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { PaddockModificationDialog } from './PaddockModificationDialog'

interface SaveIndicatorProps {
  className?: string
}

export function SaveIndicator({ className }: SaveIndicatorProps) {
  const { hasUnsavedChanges, isSaving, saveChanges, pendingChanges, resetToInitial } = useGeometry()
  const { activeFarmId } = useFarmContext()
  const { plan } = useTodayPlan(activeFarmId || '')
  const { userId } = useAppAuth()
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRationaleDialog, setShowRationaleDialog] = useState(false)

  const unsavedCount = pendingChanges.filter((c) => !c.synced).length

  // Detect if there's a paddock (daily strip) update for today's plan
  const todayPaddockChange = useMemo(() => {
    if (!plan?._id) return null
    // Find unsynced paddock updates that match today's plan ID
    return pendingChanges.find(
      (c) =>
        !c.synced &&
        c.entityType === 'paddock' &&
        c.changeType === 'update' &&
        c.id === plan._id && // Paddock ID matches plan ID
        c.originalGeometry && // Has original geometry (AI-suggested)
        c.geometry // Has modified geometry
    )
  }, [pendingChanges, plan])

  // Calculate areas for the dialog
  const paddockChangeData = useMemo(() => {
    if (!todayPaddockChange || !todayPaddockChange.originalGeometry || !todayPaddockChange.geometry) {
      return null
    }
    return {
      originalAreaHectares: calculateAreaHectares(todayPaddockChange.originalGeometry),
      modifiedAreaHectares: calculateAreaHectares(todayPaddockChange.geometry),
      originalGeometry: todayPaddockChange.originalGeometry.geometry as {
        type: 'Polygon'
        coordinates: number[][][]
      },
      modifiedGeometry: todayPaddockChange.geometry.geometry as {
        type: 'Polygon'
        coordinates: number[][][]
      },
    }
  }, [todayPaddockChange])

  const handleSave = useCallback(async () => {
    setError(null)

    // If there's a today's paddock change with original geometry, show rationale dialog
    if (todayPaddockChange && paddockChangeData && plan?._id) {
      setShowRationaleDialog(true)
      return
    }

    // Otherwise proceed with normal save
    try {
      await saveChanges()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setTimeout(() => setError(null), 3000)
    }
  }, [saveChanges, todayPaddockChange, paddockChangeData, plan])

  // Called after rationale dialog submission/skip
  const handleRationaleComplete = useCallback(async () => {
    try {
      await saveChanges()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setTimeout(() => setError(null), 3000)
    }
  }, [saveChanges])

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && !isSaving) {
          void handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, isSaving, handleSave])

  // Don't render if no unsaved changes and not showing success/error state
  if (!hasUnsavedChanges && !showSuccess && !error) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 border-2 border-dark bg-white px-3 py-2 shadow-[3px_3px_0_var(--olive)]',
          className
        )}
      >
        {error ? (
          <span className="text-destructive text-sm">{error}</span>
        ) : showSuccess ? (
          <>
            <Check className="h-4 w-4 text-olive" />
            <span className="text-sm text-olive">Saved</span>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs">
              {unsavedCount} unsaved {unsavedCount === 1 ? 'change' : 'changes'}
            </Badge>
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetToInitial}
              disabled={isSaving}
              className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {navigator.platform.includes('Mac') ? '\u2318S' : 'Ctrl+S'}
            </span>
          </>
        )}
      </div>

      {/* Paddock Modification Rationale Dialog */}
      {plan?._id && paddockChangeData && (
        <PaddockModificationDialog
          open={showRationaleDialog}
          onOpenChange={setShowRationaleDialog}
          planId={plan._id}
          originalAreaHectares={paddockChangeData.originalAreaHectares}
          modifiedAreaHectares={paddockChangeData.modifiedAreaHectares}
          originalGeometry={paddockChangeData.originalGeometry}
          modifiedGeometry={paddockChangeData.modifiedGeometry}
          onComplete={handleRationaleComplete}
          userId={userId ?? undefined}
        />
      )}
    </>
  )
}
