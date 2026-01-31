import { useState, useMemo, useCallback } from 'react'
import { X, Trash2, Info, Pencil, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Feature, Polygon } from 'geojson'
import { useGeometry, calculateAreaHectares } from '@/lib/geometry'
import { cn } from '@/lib/utils'
import { useAreaUnit } from '@/lib/hooks/useAreaUnit'
import { isDemoDevMode } from '@/lib/demo'

interface SectionEditDrawerProps {
  sectionId: string
  paddockId: string
  geometry: Feature<Polygon>
  isEditMode?: boolean
  onEnterEditMode?: () => void
  onClose: () => void
}

export function SectionEditDrawer({
  sectionId,
  paddockId,
  geometry,
  isEditMode = false,
  onEnterEditMode,
  onClose
}: SectionEditDrawerProps) {
  const { deleteSection, getSectionById, getPaddockById, updateSectionMetadata } = useGeometry()
  const { format } = useAreaUnit()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const section = getSectionById(sectionId)
  const paddock = getPaddockById(paddockId)
  const area = section?.targetArea ?? calculateAreaHectares(geometry)

  // Compute section age category
  const sectionAge = useMemo(() => {
    // Use local date (not UTC) for comparison since section dates are in local time
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const sectionDate = section?.date ?? ''

    if (!sectionDate) return 'unknown'
    if (sectionDate === today) return 'today'
    if (sectionDate < today) {
      // Determine if it's "previous" (yellow) or "historical" (gray)
      // Previous is the most recently grazed (yesterday by default)
      const yesterdayDate = new Date(now)
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`
      if (sectionDate === yesterday) return 'previous'
      return 'historical'
    }
    return 'future'
  }, [section?.date])

  // Format date in human-readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Short date format for badge
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Get styling based on section age
  const ageStyles = useMemo(() => {
    switch (sectionAge) {
      case 'today':
        return {
          headerText: "Today's Grazing Section",
          badgeText: 'Today',
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          accentClass: 'border-green-500',
          dotClass: 'bg-green-500'
        }
      case 'previous':
        return {
          headerText: 'Previously Grazed Section',
          badgeText: 'Previous',
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          accentClass: 'border-yellow-500',
          dotClass: 'bg-yellow-500'
        }
      case 'historical':
        return {
          headerText: 'Historical Section',
          badgeText: section?.date ? formatShortDate(section.date) : 'Historical',
          badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
          accentClass: 'border-gray-400',
          dotClass: 'bg-gray-400'
        }
      default:
        return {
          headerText: 'Grazing Section',
          badgeText: 'Section',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          accentClass: 'border-blue-500',
          dotClass: 'bg-blue-500'
        }
    }
  }, [sectionAge, section?.date])

  const isPastSection = sectionAge === 'previous' || sectionAge === 'historical'

  const handleDateChange = useCallback((newDate: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      updateSectionMetadata(sectionId, { date: newDate })
    }
  }, [sectionId, updateSectionMetadata])

  const handleDelete = () => {
    deleteSection(sectionId)
    setDeleteDialogOpen(false)
    onClose()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with accent border */}
      <div className={cn("flex items-start justify-between border-b p-4 border-l-4", ageStyles.accentClass)}>
        <div>
          <h2 className="font-semibold text-base">
            {isEditMode ? 'Edit Section' : ageStyles.headerText}
          </h2>
          <p className="text-xs text-muted-foreground">
            in {paddock?.name ?? `Paddock ${paddockId}`}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 -mt-1 -mr-1">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Status badge with date - only show in view mode for past sections */}
          {!isEditMode && section?.date && (
            <div className={cn(
              "rounded-md border p-3 flex items-start gap-3",
              ageStyles.badgeClass
            )}>
              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", ageStyles.dotClass)} />
              <div>
                <div className="font-medium text-sm">{ageStyles.badgeText}</div>
                <div className="text-xs mt-0.5 opacity-80">
                  Grazed: {formatDate(section.date)}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Section Area</div>
            <div className="text-2xl font-semibold">{format(area, 2)}</div>
          </div>

          {/* Date picker - only show in edit mode for dev mode */}
          {isEditMode && isDemoDevMode && section?.date && (
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Section Date
                </label>
              </div>
              <Input
                type="date"
                value={section.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dev tool: Change when this section was grazed.
              </p>
            </div>
          )}

          {section?.reasoning && section.reasoning.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Reasoning</label>
              <ul className="text-sm space-y-1">
                {section.reasoning.map((reason, i) => (
                  <li key={i} className="text-muted-foreground">• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Show edit instructions only in edit mode */}
          {isEditMode && (
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">
                Drag section vertices on the map to resize. Changes are tracked in "unsaved changes."
              </p>
            </div>
          )}

          {/* Info callout in view mode */}
          {!isEditMode && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                {isPastSection
                  ? "This section was grazed previously. Update if the actual grazing area was different."
                  : "Update the section boundary if it doesn't match the actual grazing area."}
              </p>
            </div>
          )}
        </div>

        {/* Edit Section button in view mode - available for all sections */}
        {!isEditMode && onEnterEditMode && (
          <>
            <Separator className="my-4" />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onEnterEditMode}
            >
              <Pencil className="h-4 w-4" />
              {isPastSection ? 'Update Section' : 'Edit Section'}
            </Button>
          </>
        )}

        {/* Danger Zone - only show in edit mode */}
        {isEditMode && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <label className="text-xs text-destructive uppercase tracking-wide">Danger Zone</label>
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Section
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
