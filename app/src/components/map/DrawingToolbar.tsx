import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DrawMode } from '@/lib/hooks'

interface DrawingToolbarProps {
  currentMode: DrawMode
  selectedFeatureIds: string[]
  isDrawing: boolean
  onSetMode: (mode: DrawMode) => void
  onDeleteSelected: () => void
  onCancelDrawing: () => void
  entityType?: 'pasture' | 'paddock'
  className?: string
  compact?: boolean
}

// SVG icons for the toolbar
function MousePointerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="m13 13 6 6" />
    </svg>
  )
}

function PentagonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 8.7c-.2.1-.4.4-.4.8L2 19.8c-.1.5.3 1 .8 1.1.1 0 .2 0 .3 0h17.7c.6 0 1-.4 1-1 0-.1 0-.2 0-.3l-1.1-10.3c0-.3-.2-.6-.5-.8L12.4 3.1c-.3-.2-.6-.2-.9 0L3.5 8.7z" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function DrawingToolbar({
  currentMode,
  selectedFeatureIds,
  isDrawing,
  onSetMode,
  onDeleteSelected,
  onCancelDrawing,
  entityType = 'pasture',
  className,
  compact = false,
}: DrawingToolbarProps) {
  const hasSelection = selectedFeatureIds.length > 0
  const entityLabel = entityType === 'pasture' ? 'Pasture' : 'Paddock'

  if (compact) {
    return (
      <div className={cn('flex gap-0.5 rounded-lg border border-border bg-background/95 backdrop-blur p-0.5', className)}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onSetMode('simple_select')}
                className={cn('size-6', currentMode === 'simple_select' && 'bg-accent')}
              >
                <MousePointerIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Select (click to edit, drag to move)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onSetMode('draw_polygon')}
                className={cn('size-6', currentMode === 'draw_polygon' && 'bg-accent')}
              >
                <PentagonIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Draw {entityLabel}</p>
            </TooltipContent>
          </Tooltip>

          {hasSelection && (
            <>
              <Separator orientation="vertical" className="h-4 mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onDeleteSelected}
                    className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Delete Selected</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {isDrawing && (
            <>
              <Separator orientation="vertical" className="h-4 mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onCancelDrawing}
                    className="size-6"
                  >
                    <XIcon className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-0.5 rounded-lg border border-border bg-background/95 backdrop-blur p-0.5', className)}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetMode('simple_select')}
              className={cn('h-5 px-1.5 text-[10px] gap-1', currentMode === 'simple_select' && 'bg-accent')}
            >
              <MousePointerIcon className="size-3" />
              Select
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Click a shape to edit vertices, drag to move</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetMode('draw_polygon')}
              className={cn('h-5 px-1.5 text-[10px] gap-1', currentMode === 'draw_polygon' && 'bg-accent')}
            >
              <PentagonIcon className="size-3" />
              Draw {entityLabel}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Click to add vertices, double-click to finish</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetMode('direct_select')}
              disabled={!hasSelection}
              className={cn('h-5 px-1.5 text-[10px] gap-1', currentMode === 'direct_select' && 'bg-accent')}
            >
              <EditIcon className="size-3" />
              Edit Vertices
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Drag vertices to reshape. Delete key removes selected vertex.</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className="h-5 px-1.5 text-[10px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:text-muted-foreground"
            >
              <TrashIcon className="size-3" />
              Delete
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Delete selected shapes</p>
          </TooltipContent>
        </Tooltip>

        {isDrawing && (
          <>
            <Separator orientation="vertical" className="h-4 mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelDrawing}
              className="h-5 px-1.5 text-[10px] gap-1"
            >
              <XIcon className="size-3" />
              Cancel
            </Button>
          </>
        )}
      </TooltipProvider>
    </div>
  )
}
