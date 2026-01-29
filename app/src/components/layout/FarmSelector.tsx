import { useState } from 'react'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { useOrganization } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { CreateFarmForm } from './CreateFarmForm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFarmContext } from '@/lib/farm'
import { useAppAuth } from '@/lib/auth'

// Wrapper that only renders when Clerk is available (not in dev mode)
function ClerkFarmSelector() {
  const { organization } = useOrganization()
  return <FarmSelectorInner organization={organization ?? null} />
}

// Dev mode version - no Clerk hooks
function DevFarmSelector() {
  return <FarmSelectorInner organization={null} />
}

export function FarmSelector() {
  const { isDevAuth } = useAppAuth()

  // Use different components based on auth mode to avoid calling Clerk hooks in dev mode
  if (isDevAuth) {
    return <DevFarmSelector />
  }
  return <ClerkFarmSelector />
}

interface FarmSelectorInnerProps {
  organization: { destroy: () => Promise<void> } | null
}

function FarmSelectorInner({ organization }: FarmSelectorInnerProps) {
  const { activeFarm, activeFarmId, availableFarms, isLoading, switchFarm } = useFarmContext()
  const { isDevAuth } = useAppAuth()
  const deleteFarmMutation = useMutation(api.organizations.deleteFarm)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Loading state
  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Loading farm...
      </span>
    )
  }

  const handleValueChange = (value: string) => {
    if (value === '__create_new__') {
      setShowCreateDialog(true)
      return
    }
    if (value === '__delete_current__') {
      setShowDeleteDialog(true)
      return
    }
    switchFarm(value)
  }

  const handleDeleteFarm = async () => {
    if (!activeFarmId || !organization) return

    setIsDeleting(true)
    try {
      // Delete farm data from Convex first
      await deleteFarmMutation({ farmExternalId: activeFarmId })

      // Then delete the Clerk organization
      await organization.destroy()

      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete farm:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Always show dropdown selector (even with single farm for consistency)
  return (
    <>
      <Select value={activeFarmId ?? undefined} onValueChange={handleValueChange}>
        <SelectTrigger
          size="sm"
          className="h-5 gap-1 border-none bg-transparent shadow-none hover:bg-accent px-1"
        >
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <SelectValue placeholder="Select farm">
            <span className="text-xs">{activeFarm?.name ?? 'No farm'}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="!max-h-none !overflow-visible">
          {availableFarms.map((farm) => (
            <SelectItem key={farm.id} value={farm.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{farm.name}</span>
              </div>
            </SelectItem>
          ))}
          {availableFarms.length > 0 && <SelectSeparator />}
          <SelectItem value="__create_new__">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Plus className="h-3.5 w-3.5" />
              <span>Create new farm</span>
            </div>
          </SelectItem>
          {activeFarmId && !isDevAuth && (
            <SelectItem value="__delete_current__">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete current farm</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Farm</DialogTitle>
          </DialogHeader>
          {isDevAuth ? (
            <div className="text-sm text-muted-foreground py-4">
              Organization creation is not available in dev mode.
              <br />
              Switch to Clerk authentication to create farms.
            </div>
          ) : (
            <CreateFarmForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Farm</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{activeFarm?.name}</strong>? This will permanently delete all paddocks, observations, grazing history, and plans associated with this farm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFarm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Farm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
