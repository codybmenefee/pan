import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFarmContext } from '@/lib/farm'

export function FarmSelector() {
  const { activeFarm, activeFarmId, availableFarms, isLoading, switchFarm } = useFarmContext()

  // Loading state
  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Loading farm...
      </span>
    )
  }

  // Single farm or no farms: show text only
  if (availableFarms.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span>{activeFarm?.name ?? 'No farm'}</span>
      </div>
    )
  }

  // Multiple farms: show dropdown selector
  return (
    <Select value={activeFarmId ?? undefined} onValueChange={switchFarm}>
      <SelectTrigger
        size="sm"
        className="h-7 gap-1.5 border-none bg-transparent shadow-none hover:bg-accent px-2"
      >
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder="Select farm">
          <span className="text-xs">{activeFarm?.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableFarms.map((farm) => (
          <SelectItem key={farm.id} value={farm.id}>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{farm.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
