import { useState } from 'react'
import { Sparkles, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FeatureRequestModal } from '@/components/layout/FeatureRequestModal'

interface PostOnboardingWelcomeCardProps {
  onContinue: () => void
}

export function PostOnboardingWelcomeCard({ onContinue }: PostOnboardingWelcomeCardProps) {
  const [featureModalOpen, setFeatureModalOpen] = useState(false)

  return (
    <>
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20">
        <Card className="max-w-md shadow-xl border-2 border-primary/50">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Welcome to OpenPasture!</h2>
              <p className="text-sm text-muted-foreground">
                Thanks for joining! OpenPasture is currently in{' '}
                <span className="inline-flex items-center rounded-full bg-terracotta/20 px-2 py-0.5 text-xs font-medium text-terracotta ring-1 ring-inset ring-terracotta/30">
                  beta
                </span>{' '}
                as we refine the AI-powered grazing recommendations. We're actively
                adding features like weather integration and historical analytics.
              </p>
              <p className="text-sm text-muted-foreground">
                Your feedback helps shape the product — we'd love to hear what's working
                and what could be better.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFeatureModalOpen(true)}
              >
                <MessageSquarePlus className="h-4 w-4" />
                Request a Feature
              </Button>
              <Button onClick={onContinue}>
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <FeatureRequestModal
        open={featureModalOpen}
        onOpenChange={setFeatureModalOpen}
      />
    </>
  )
}
