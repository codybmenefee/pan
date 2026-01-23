import { useState, useEffect } from 'react'
import { BriefCard } from './BriefCard'
import { FarmOverview } from './FarmOverview'
import { DataStatusCard } from './DataStatusCard'
import { ApprovedState } from './ApprovedState'
import { FeedbackModal } from './FeedbackModal'
import { BriefSkeleton } from '@/components/ui/loading'
import { LowConfidenceWarning } from '@/components/ui/error'
import { getFormattedDate } from '@/data/mock/plan'
import type { PlanStatus, Section } from '@/lib/types'
import { useGeometry } from '@/lib/geometry'
import { useTodayPlan } from '@/lib/convex/usePlan'
import { NoPlanState } from './NoPlanState'

const LOW_CONFIDENCE_THRESHOLD = 70

function planSectionToSection(plan: any): Section | undefined {
  if (!plan?.sectionGeometry) {
    return undefined
  }
  
  // Convert raw Polygon to GeoJSON Feature
  const sectionFeature = {
    type: 'Feature' as const,
    properties: {},
    geometry: plan.sectionGeometry,
  }
  
  return {
    id: plan._id,
    paddockId: plan.primaryPaddockExternalId || '',
    date: plan.date,
    geometry: sectionFeature,
    targetArea: plan.sectionAreaHectares || 0,
    reasoning: plan.reasoning || [],
  }
}

export function MorningBrief({ farmExternalId }: { farmExternalId: string }) {
  const { getPaddockById } = useGeometry()
  const { plan, isLoading, isError, generatePlan, approvePlan, submitFeedback, deleteTodayPlan } = useTodayPlan(farmExternalId)

  const [planStatus, setPlanStatus] = useState<PlanStatus>('pending')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [approvedAt, setApprovedAt] = useState<string | null>(null)
  const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (plan) {
      setPlanStatus(plan.status)
      if (plan.confidenceScore && plan.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
        setShowLowConfidenceWarning(true)
      }
    }
  }, [plan])

  const handleGeneratePlan = async () => {
    setAnimationComplete(false)
    setIsGenerating(true)
    await generatePlan()
    setIsGenerating(false)
  }

  const handleAnimationComplete = () => {
    setAnimationComplete(true)
  }

  const handleResetPlan = async () => {
    setIsResetting(true)
    setAnimationComplete(false)
    await deleteTodayPlan()
    setIsResetting(false)
  }

  const handleApprove = async () => {
    if (plan) {
      setPlanStatus('approved')
      setApprovedAt(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }))
      await approvePlan(plan._id, 'current-user')
    }
  }

  const handleModify = () => {
    setFeedbackOpen(true)
  }

  const handleFeedbackSubmit = async (feedback: string) => {
    if (plan) {
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
    return <BriefSkeleton />
  }

  if (isError || (!plan && !isGenerating)) {
    return (
      <div className="p-4 xl:p-6 2xl:p-8">
        <div className="mb-4 xl:mb-6">
          <h1 className="text-lg xl:text-xl font-semibold">Morning Brief</h1>
          <p className="text-xs xl:text-sm text-muted-foreground">{getFormattedDate()}</p>
        </div>
        <NoPlanState
          isGenerating={isGenerating}
          onGenerate={handleGeneratePlan}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    )
  }

  if (isGenerating || (plan && !animationComplete)) {
    return <BriefSkeleton />
  }

  if (!plan) {
    return <BriefSkeleton />
  }

  const recommendedPaddock = getPaddockById(plan.primaryPaddockExternalId || '')

  if (planStatus === 'approved' || planStatus === 'modified') {
    return (
      <ApprovedState
        paddock={recommendedPaddock!}
        currentPaddockId={plan.primaryPaddockExternalId || ''}
        approvedAt={approvedAt!}
        confidence={plan.confidenceScore || 0}
        wasModified={planStatus === 'modified'}
        section={planSectionToSection(plan)}
        daysInCurrentPaddock={2}
        totalDaysPlanned={4}
        isPaddockTransition={false}
        previousSections={[]}
        sectionJustification={plan.sectionJustification}
        paddockGrazedPercentage={plan.paddockGrazedPercentage}
      />
    )
  }

  const briefNarrative = plan.reasoning?.length > 0
    ? `Based on satellite analysis, we recommend ${plan.primaryPaddockExternalId || 'the current paddock'} today. ${plan.reasoning[0]}`
    : 'Analyzing pasture conditions for today\'s grazing recommendation.'

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

          <div className="rounded-md border border-border bg-card p-3 xl:p-4">
            <p className="text-sm xl:text-base leading-relaxed">
              {briefNarrative}
            </p>
          </div>

          {/* Debug: Reset plan button */}
          <div className="flex justify-end">
            <button
              onClick={handleResetPlan}
              disabled={isResetting}
              className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Reset plan (debug)'}
            </button>
          </div>

          {recommendedPaddock && (
            <BriefCard
              currentPaddockId={plan.primaryPaddockExternalId || ''}
              paddock={recommendedPaddock}
              confidence={plan.confidenceScore || 0}
              reasoning={plan.reasoning || []}
              onApprove={handleApprove}
              onModify={handleModify}
              section={planSectionToSection(plan)}
              daysInCurrentPaddock={2}
              totalDaysPlanned={4}
              isPaddockTransition={false}
              previousSections={[]}
              sectionAlternatives={[]}
              sectionJustification={plan.sectionJustification}
              paddockGrazedPercentage={plan.paddockGrazedPercentage}
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
