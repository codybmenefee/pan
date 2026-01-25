import { useState, useRef, useEffect } from 'react'
import { Plus, Pentagon, Ban, Droplet, MapPin, Hexagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MapAddMenuProps {
  onAddPaddock: () => void
  onAddNoGrazeZone: () => void
  onAddWaterSource: (geometryType: 'point' | 'polygon') => void
  className?: string
}

export function MapAddMenu({
  onAddPaddock,
  onAddNoGrazeZone,
  onAddWaterSource,
  className,
}: MapAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [waterSubmenuOpen, setWaterSubmenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleAddPaddock = () => {
    setIsOpen(false)
    onAddPaddock()
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
    <div ref={menuRef} className={cn("absolute top-3 right-3 z-20", className)}>
      {/* Plus button trigger */}
      <Button
        size="icon"
        className={cn(
          'h-10 w-10 rounded-full shadow-lg transition-transform',
          isOpen && 'rotate-45'
        )}
        onClick={() => {
          setIsOpen(!isOpen)
          setWaterSubmenuOpen(false)
        }}
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-48 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* Add Paddock */}
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors"
            onClick={handleAddPaddock}
          >
            <Pentagon className="h-4 w-4 text-green-500" />
            <span>Add Paddock</span>
          </button>

          {/* Add No-graze Zone */}
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors border-t border-border"
            onClick={handleAddNoGrazeZone}
          >
            <Ban className="h-4 w-4 text-red-500" />
            <span>Add No-graze Zone</span>
          </button>

          {/* Add Water Source (with submenu) */}
          <div className="relative">
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors border-t border-border"
              onClick={() => setWaterSubmenuOpen(!waterSubmenuOpen)}
            >
              <Droplet className="h-4 w-4 text-blue-500" />
              <span className="flex-1 text-left">Add Water Source</span>
              <span className={cn(
                'text-xs text-muted-foreground transition-transform',
                waterSubmenuOpen && 'rotate-90'
              )}>
                &rsaquo;
              </span>
            </button>

            {/* Water source submenu */}
            {waterSubmenuOpen && (
              <div className="bg-muted/50 border-t border-border">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 pl-8 text-sm hover:bg-accent transition-colors"
                  onClick={() => handleAddWaterSource('point')}
                >
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span>Place marker</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 pl-8 text-sm hover:bg-accent transition-colors border-t border-border/50"
                  onClick={() => handleAddWaterSource('polygon')}
                >
                  <Hexagon className="h-4 w-4 text-blue-400" />
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
