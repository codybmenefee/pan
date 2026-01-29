import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useFarmContext } from '@/lib/farm'
import { DemoUpsellDialog } from './DemoUpsellDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DemoFarmSelector() {
  const { activeFarm, activeFarmId, availableFarms, isLoading } = useFarmContext()
  const [showUpsellDialog, setShowUpsellDialog] = useState(false)

  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Loading farm...
      </span>
    )
  }

  const handleValueChange = (value: string) => {
    if (value === '__create_new__') {
      setShowUpsellDialog(true)
      return
    }
    // Demo mode only has one farm, no switching
  }

  return (
    <>
      <Select value={activeFarmId ?? undefined} onValueChange={handleValueChange}>
        <SelectTrigger
          size="sm"
          className="h-5 gap-1 border-none bg-transparent shadow-none hover:bg-accent px-1"
        >
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <SelectValue placeholder="Select farm">
            <span className="text-xs">{activeFarm?.name ?? 'Demo Farm'}</span>
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
        </SelectContent>
      </Select>

      <DemoUpsellDialog
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        title="Create Your Own Farm"
        description="Sign up for a free account to create your own farms, save your data, and get personalized grazing recommendations."
      />
    </>
  )
}
