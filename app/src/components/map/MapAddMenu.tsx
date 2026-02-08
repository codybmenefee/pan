import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Pentagon, Ban, Droplet, MapPin, Hexagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DragEntityType } from './DragPreview'

interface MapAddMenuProps {
  onAddPasture: () => void
  onAddNoGrazeZone: () => void
  onAddWaterSource: (geometryType: 'point' | 'polygon') => void
  onDragStart?: (type: DragEntityType, startPosition: { x: number; y: number }) => void
  className?: string
}

const DRAG_THRESHOLD = 4 // pixels before drag starts

export function MapAddMenu({
  onAddPasture,
  onAddNoGrazeZone,
  onAddWaterSource,
  onDragStart,
  className,
}: MapAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [waterSubmenuOpen, setWaterSubmenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use state to track drag attempt so useEffect re-runs
  const [dragAttempt, setDragAttempt] = useState<{
    type: DragEntityType
    startX: number
    startY: number
  } | null>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setWaterSubmenuOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Document-level listeners for drag tracking
  useEffect(() => {
    if (!dragAttempt) return

    let dragStarted = false

    const handleDocumentPointerMove = (e: PointerEvent) => {
      if (dragStarted) return // Already started dragging

      const dx = e.clientX - dragAttempt.startX
      const dy = e.clientY - dragAttempt.startY
      const distance = Math.hypot(dx, dy)

      if (distance >= DRAG_THRESHOLD) {
        dragStarted = true
        setIsOpen(false)
        setWaterSubmenuOpen(false)
        setDragAttempt(null)
        onDragStart?.(dragAttempt.type, { x: e.clientX, y: e.clientY })
      }
    }

    const handleDocumentPointerUp = () => {
      setDragAttempt(null)
    }

    document.addEventListener('pointermove', handleDocumentPointerMove)
    document.addEventListener('pointerup', handleDocumentPointerUp)

    return () => {
      document.removeEventListener('pointermove', handleDocumentPointerMove)
      document.removeEventListener('pointerup', handleDocumentPointerUp)
    }
  }, [dragAttempt, onDragStart])

  const handlePointerDown = useCallback((type: DragEntityType, e: React.PointerEvent) => {
    if (!onDragStart) return

    e.preventDefault() // Prevent text selection during drag

    setDragAttempt({
      type,
      startX: e.clientX,
      startY: e.clientY,
    })
  }, [onDragStart])

  const handleAddPasture = () => {
    setIsOpen(false)
    onAddPasture()
  }

  const handleAddNoGrazeZone = () => {
    setIsOpen(false)
    onAddNoGrazeZone()
  }

  const handleAddWaterSource = (geometryType: 'point' | 'polygon') => {
    setIsOpen(false)
    setWaterSubmenuOpen(false)
    onAddWaterSource(geometryType)
  }

  return (
    <div ref={menuRef} className={cn("absolute top-2 right-1 z-20", className)}>
      {/* Plus button trigger */}
      <Button
        size="icon"
        className={cn(
          'h-8 w-8 shadow-[2px_2px_0_var(--dark)] transition-transform border-2 border-dark',
          isOpen && 'rotate-45'
        )}
        onClick={() => {
          setIsOpen(!isOpen)
          setWaterSubmenuOpen(false)
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-9 right-0 w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* Add Pasture */}
          <button
            className={cn(
              "flex w-full items-center gap-2 px-2.5 py-2 text-xs hover:bg-accent transition-colors touch-none select-none",
              onDragStart && "cursor-grab active:cursor-grabbing"
            )}
            onClick={handleAddPasture}
            onPointerDown={(e) => handlePointerDown('pasture', e)}
          >
            <Pentagon className="h-3.5 w-3.5 text-olive" />
            <span>Add Pasture</span>
          </button>

          {/* Add No-graze Zone */}
          <button
            className={cn(
              "flex w-full items-center gap-2 px-2.5 py-2 text-xs hover:bg-accent transition-colors border-t border-border touch-none select-none",
              onDragStart && "cursor-grab active:cursor-grabbing"
            )}
            onClick={handleAddNoGrazeZone}
            onPointerDown={(e) => handlePointerDown('noGrazeZone', e)}
          >
            <Ban className="h-3.5 w-3.5 text-terracotta" />
            <span>Add No-graze Zone</span>
          </button>

          {/* Add Water Source (with submenu) */}
          <div className="relative">
            <button
              className="flex w-full items-center gap-2 px-2.5 py-2 text-xs hover:bg-accent transition-colors border-t border-border"
              onClick={() => setWaterSubmenuOpen(!waterSubmenuOpen)}
            >
              <Droplet className="h-3.5 w-3.5 text-cobalt" />
              <span className="flex-1 text-left">Add Water Source</span>
              <span className={cn(
                'text-[10px] text-muted-foreground transition-transform',
                waterSubmenuOpen && 'rotate-90'
              )}>
                &rsaquo;
              </span>
            </button>

            {/* Water source submenu */}
            {waterSubmenuOpen && (
              <div className="bg-muted/50 border-t border-border">
                <button
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 pl-6 text-xs hover:bg-accent transition-colors touch-none select-none",
                    onDragStart && "cursor-grab active:cursor-grabbing"
                  )}
                  onClick={() => handleAddWaterSource('point')}
                  onPointerDown={(e) => handlePointerDown('waterPoint', e)}
                >
                  <MapPin className="h-3.5 w-3.5 text-cobalt-muted" />
                  <span>Place marker</span>
                </button>
                <button
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 pl-6 text-xs hover:bg-accent transition-colors border-t border-border/50 touch-none select-none",
                    onDragStart && "cursor-grab active:cursor-grabbing"
                  )}
                  onClick={() => handleAddWaterSource('polygon')}
                  onPointerDown={(e) => handlePointerDown('waterPolygon', e)}
                >
                  <Hexagon className="h-3.5 w-3.5 text-cobalt-muted" />
                  <span>Draw area</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
