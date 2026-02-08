import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Bot, RotateCcw } from 'lucide-react'
import {
  FarmInfoStrip,
  GeneralSettings,
  ThresholdSettings,
  LivestockSettings,
  PlanSummary,
} from '@/components/settings'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useFarmSettings } from '@/lib/convex/useFarmSettings'
import { useFarmContext } from '@/lib/farm'
import type { FarmSettings } from '@/lib/types'
import { useAppAuth } from '@/lib/auth'
import { hasAgentDashboardAccess } from '@/lib/agentAccess'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { settings, isLoading, saveSettings, resetSettings } = useFarmSettings()
  const { activeFarmId } = useFarmContext()
  const { hasFeature, hasPlan, isDevAuth } = useAppAuth()
  const [pendingSettings, setPendingSettings] = useState<FarmSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const canAccessAgentDashboard = hasAgentDashboardAccess({ hasFeature, hasPlan, isDevAuth })

  const displaySettings = pendingSettings ?? settings
  const hasChanges = pendingSettings !== null

  const handleChange = (newSettings: FarmSettings) => {
    setPendingSettings(newSettings)
    setSaved(false)
  }

  const handleSave = async () => {
    if (pendingSettings) {
      await saveSettings(pendingSettings)
      setPendingSettings(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleReset = async () => {
    await resetSettings()
    setPendingSettings(null)
  }

  const handleCancel = () => {
    setPendingSettings(null)
  }

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

      <FarmInfoStrip />

      {canAccessAgentDashboard && (
        <Card className="mt-3 border-2 border-cobalt/40">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cobalt" />
                <div>
                  <p className="text-sm font-medium">Agent Command Center</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor runs, tune behavior, manage memory and rules.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/agent">Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-3">
        <Tabs defaultValue="general">
          <CardHeader className="pb-0 pt-4">
            <TabsList className="h-10 p-1 gap-1">
              <TabsTrigger value="general" className="px-4 py-2">General</TabsTrigger>
              <TabsTrigger value="thresholds" className="px-4 py-2">Thresholds</TabsTrigger>
              <TabsTrigger value="livestock" className="px-4 py-2">Livestock</TabsTrigger>
              <TabsTrigger value="plan" className="px-4 py-2">Plan</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            <TabsContent value="general" className="mt-0">
              <GeneralSettings settings={displaySettings} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="thresholds" className="mt-0">
              <ThresholdSettings settings={displaySettings} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="livestock" className="mt-0">
              <LivestockSettings />
            </TabsContent>

            <TabsContent value="plan" className="mt-0">
              {activeFarmId ? (
                <PlanSummary farmId={activeFarmId} farmAcreage={50} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select a farm to view subscription details
                </p>
              )}
            </TabsContent>
          </CardContent>

          <CardFooter className="border-t justify-between gap-2 pt-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset to Defaults
            </Button>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-sm text-olive">Saved</span>
              )}
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={!hasChanges}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
    </div>
  )
}
