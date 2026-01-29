import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertCircle, UserPlus } from 'lucide-react'
import {
  FarmInfoStrip,
  GeneralSettings,
  ThresholdSettings,
  LivestockSettings,
} from '@/components/settings'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'

export const Route = createFileRoute('/demo/settings')({
  component: DemoSettingsPage,
})

function DemoSettingsPage() {
  const { settings, isLoading } = useFarmSettings()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 max-w-4xl">
        <h1 className="text-xl font-semibold mb-3">Settings</h1>

        {/* Demo mode upsell banner */}
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Demo Mode</AlertTitle>
          <AlertDescription className="text-amber-700">
            <span>Settings changes won't persist in demo mode. </span>
            <Link to="/onboarding" className="font-medium underline underline-offset-2 hover:text-amber-900">
              Create a free account
            </Link>
            <span> to save your settings.</span>
          </AlertDescription>
        </Alert>

        <FarmInfoStrip />

        <Card className="mt-3">
          <Tabs defaultValue="general">
            <CardHeader className="pb-0 pt-4">
              <TabsList className="h-10 p-1 gap-1">
                <TabsTrigger value="general" className="px-4 py-2">General</TabsTrigger>
                <TabsTrigger value="thresholds" className="px-4 py-2">Thresholds</TabsTrigger>
                <TabsTrigger value="livestock" className="px-4 py-2">Livestock</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-4">
              <TabsContent value="general" className="mt-0">
                <GeneralSettings settings={settings} onChange={() => {}} />
              </TabsContent>

              <TabsContent value="thresholds" className="mt-0">
                <ThresholdSettings settings={settings} onChange={() => {}} />
              </TabsContent>

              <TabsContent value="livestock" className="mt-0">
                <LivestockSettings />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Sign up CTA */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Ready to create your own farm?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sign up for a free account to save your settings and get personalized grazing recommendations.
              </p>
            </div>
            <Link to="/onboarding">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
