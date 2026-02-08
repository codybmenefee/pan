import { useState, useEffect } from 'react'
import type { Geometry, Polygon } from 'geojson'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BriefCard } from './BriefCard'
import { FarmOverview } from './FarmOverview'
import { DataStatusCard } from './DataStatusCard'
import { ApprovedState } from './ApprovedState'
import { FeedbackModal } from './FeedbackModal'
import { PlanModifyView } from './PlanModifyView'
import { BriefSkeleton } from '@/components/ui/loading'
import { LowConfidenceWarning } from '@/components/ui/error'
import { getFormattedDate } from '@/data/mock/plan'
import type { PlanStatus, Paddock } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { NoPlanState } from './NoPlanState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getGrassQuality } from '@/lib/grassQuality'
import { useAnalytics } from '@/lib/analytics'

const LOW_CONFIDENCE_THRESHOLD = 70

/** Plan document fields used by planDocToPaddock */
interface PlanDocument {
  _id: string
  date: string
  primaryPaddockExternalId?: string
  sectionGeometry?: Polygon
  sectionAreaHectares?: number
  reasoning?: string[]
}

interface MorningBriefProps {
  farmExternalId: string
  compact?: boolean
  onClose?: () => void
  onZoomToPaddock?: (geometry: Geometry) => void
  onEnterModifyMode?: (geometry: Geometry, pastureId: string) => void
  modifyModeActive?: boolean
  onSaveModification?: (feedback: string) => void
  onCancelModify?: () => void
}

function planDocToPaddock(plan: PlanDocument | null | undefined): Paddock | undefined {
  if (!plan?.sectionGeometry) {
    return undefined
  }

  // Convert raw Polygon to GeoJSON Feature
  const paddockFeature = {
    type: 'Feature' as const,
    properties: {},
    geometry: plan.sectionGeometry,
  }

  return {
    id: plan._id,
    pastureId: plan.primaryPaddockExternalId || '',
    date: plan.date,
    geometry: paddockFeature,
    targetArea: plan.sectionAreaHectares || 0,
    reasoning: plan.reasoning || [],
  }
}

export function MorningBrief({
  farmExternalId,
  compact = false,
  onClose: _onClose,
  onZoomToPaddock: _onZoomToPaddock,
  onEnterModifyMode,
  modifyModeActive = false,
  onSaveModification,
  onCancelModify,
}: MorningBriefProps) {
  const { getPastureById } = useGeometry()
  const { plan, isLoading, isError, generatePlan, approvePlan, submitFeedback } = useTodayPlan(farmExternalId)
  const { trackPlanGenerated, trackPlanApproved, trackPlanModified } = useAnalytics()

  const [planStatus, setPlanStatus] = useState<PlanStatus>('pending')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [approvedAt, setApprovedAt] = useState<string | null>(null)
  const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    farmOverview: !compact,
    dataStatus: !compact,
  })

  const toggleSection = (section: 'farmOverview' | 'dataStatus') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    if (plan) {
      setPlanStatus(plan.status)
      if (plan.confidenceScore && plan.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
        setShowLowConfidenceWarning(true)
      }
    }
  }, [plan])

  const handleGeneratePlan = async () => {
    setGenerationError(null)
    setIsGenerating(true)
    try {
      await generatePlan()
      trackPlanGenerated({ farmId: farmExternalId, triggeredBy: 'user' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate a plan.'
      setGenerationError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (plan) {
      const pasture = getPastureById(plan.primaryPaddockExternalId || '')
      trackPlanApproved({
        planId: plan._id,
        confidenceScore: plan.confidenceScore,
        pastureName: pasture?.name,
      })
      setPlanStatus('approved')
      setApprovedAt(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }))
      await approvePlan(plan._id, 'current-user')
    }
  }

  const handleReject = () => {
    if (onEnterModifyMode && plan?.sectionGeometry) {
      onEnterModifyMode(plan.sectionGeometry, plan.primaryPaddockExternalId || '')
    } else {
      setFeedbackOpen(true) // fallback to feedback modal
    }
  }

  const handleFeedbackSubmit = async (feedback: string) => {
    if (plan) {
      trackPlanModified({ planId: plan._id, hasFeedback: !!feedback })
      setPlanStatus('modified')
      setFeedbackOpen(false)
      setApprovedAt(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }))
      await submitFeedback(plan._id, feedback)
    }
  }

  const handleProceedWithLowConfidence = () => {
    setShowLowConfidenceWarning(false)
  }

  if (isLoading) {
    return (
      <div className={cn(compact && 'h-full')}>
        <BriefSkeleton />
      </div>
    )
  }

  // No plan for today yet (Convex returns null), show generation UI.
  if (isError || !plan) {
    return (
      <div className={cn('h-full flex flex-col', compact ? 'p-3' : 'p-4 xl:p-6 2xl:p-8')}>
        {/* Header - only show in non-compact mode (compact mode has parent widget header) */}
        {!compact && (
          <div className="flex items-start justify-between mb-4 xl:mb-6">
            <div>
              <h1 className="text-lg xl:text-xl font-semibold">Morning Brief</h1>
              <p className="text-xs text-muted-foreground">{getFormattedDate()}</p>
            </div>
          </div>
        )}
        {generationError && (
          <div className="mb-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            {generationError}
          </div>
        )}
        <NoPlanState
          isGenerating={isGenerating}
          onGenerate={handleGeneratePlan}
          onAnimationComplete={() => {}}
        />
      </div>
    )
  }

  // If a plan exists, render it immediately. Generation animations should not gate the dashboard.

  const recommendedPasture = getPastureById(plan.primaryPaddockExternalId || '')

  // Compute grass quality from pasture NDVI
  const grassQuality = recommendedPasture ? getGrassQuality(recommendedPasture.ndvi) : undefined

  // Generate summary reason from first reasoning item or justification
  const summaryReason = plan.sectionJustification
    || (plan.reasoning && plan.reasoning.length > 0
      ? plan.reasoning[0]
      : recommendedPasture
        ? `Best forage available after ${recommendedPasture.restDays} days rest`
        : 'Analyzing pasture conditions')

  // Use remaining reasoning items as expandable details
  const reasoningDetails = plan.reasoning && plan.reasoning.length > 1
    ? plan.reasoning.slice(1)
    : []

  if (planStatus === 'approved' || planStatus === 'modified') {
    return (
      <ApprovedState
        pasture={recommendedPasture!}
        currentPastureId={plan.primaryPaddockExternalId || ''}
        approvedAt={approvedAt!}
        wasModified={planStatus === 'modified'}
        paddock={planDocToPaddock(plan)}
        daysInCurrentPasture={2}
        totalDaysPlanned={4}
        previousPaddocks={[]}
        grassQuality={grassQuality}
        summaryReason={summaryReason}
      />
    )
  }

  // Compact layout for drawer
  if (compact) {
    // Show modify view when in modify mode
    if (modifyModeActive && onSaveModification && onCancelModify) {
      return (
        <PlanModifyView
          pastureName={recommendedPasture?.name ?? 'Unknown'}
          onSave={onSaveModification}
          onCancel={onCancelModify}
        />
      )
    }

    return (
      <div className="h-full flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {showLowConfidenceWarning && (
            <LowConfidenceWarning
              cloudCover={65}
              cloudCoverThreshold={50}
              lastClearImage="5 days ago"
              confidence={plan.confidenceScore || 0}
              onProceed={handleProceedWithLowConfidence}
              onWait={() => setShowLowConfidenceWarning(false)}
            />
          )}

          {recommendedPasture && (
            <BriefCard
              currentPastureId={plan.primaryPaddockExternalId || ''}
              pasture={recommendedPasture}
              onApprove={handleApprove}
              onReject={handleReject}
              paddock={planDocToPaddock(plan)}
              daysInCurrentPasture={2}
              totalDaysPlanned={4}
              previousPaddocks={[]}
              grassQuality={grassQuality}
              summaryReason={summaryReason}
              reasoningDetails={reasoningDetails}
              hideActions={true}
            />
          )}

          {/* Collapsible Farm Overview */}
          <div className="rounded-md border border-border bg-card">
            <button
              onClick={() => toggleSection('farmOverview')}
              className="flex w-full items-center justify-between p-2 text-left"
            >
              <span className="text-xs font-medium">Farm Overview</span>
              {expandedSections.farmOverview ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            {expandedSections.farmOverview && (
              <div className="border-t px-2 pb-2">
                <FarmOverview />
              </div>
            )}
          </div>

          {/* Collapsible Data Status */}
          <div className="rounded-md border border-border bg-card">
            <button
              onClick={() => toggleSection('dataStatus')}
              className="flex w-full items-center justify-between p-2 text-left"
            >
              <span className="text-xs font-medium">Data Status</span>
              {expandedSections.dataStatus ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            {expandedSections.dataStatus && (
              <div className="border-t px-2 pb-2">
                <DataStatusCard />
              </div>
            )}
          </div>

        </div>

        {/* Sticky Footer with Action Buttons - Binary decision */}
        <div className="sticky bottom-0 z-10 border-t bg-background p-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReject} className="flex-1 h-9">
              Reject
            </Button>
            <Button onClick={handleApprove} className="flex-1 h-9">
              Approve
            </Button>
          </div>
        </div>

        <FeedbackModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          alternatives={[]}
          onSubmit={handleFeedbackSubmit}
        />
      </div>
    )
  }

  // Full layout (original)
  return (
    <div className="p-4 xl:p-6 2xl:p-8">
      <div className="mb-4 xl:mb-6">
        <h1 className="text-lg xl:text-xl font-semibold">Morning Brief</h1>
        <p className="text-xs xl:text-sm text-muted-foreground">{getFormattedDate()}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 xl:space-y-6">
          {showLowConfidenceWarning && (
            <LowConfidenceWarning
              cloudCover={65}
              cloudCoverThreshold={50}
              lastClearImage="5 days ago"
              confidence={plan.confidenceScore || 0}
              onProceed={handleProceedWithLowConfidence}
              onWait={() => setShowLowConfidenceWarning(false)}
            />
          )}

          {recommendedPasture && (
            <BriefCard
              currentPastureId={plan.primaryPaddockExternalId || ''}
              pasture={recommendedPasture}
              onApprove={handleApprove}
              onReject={handleReject}
              paddock={planDocToPaddock(plan)}
              daysInCurrentPasture={2}
              totalDaysPlanned={4}
              previousPaddocks={[]}
              grassQuality={grassQuality}
              summaryReason={summaryReason}
              reasoningDetails={reasoningDetails}
            />
          )}
        </div>

        <div className="space-y-4 xl:space-y-6">
          <FarmOverview />
          <DataStatusCard />
        </div>
      </div>

      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        alternatives={[]}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  )
}
