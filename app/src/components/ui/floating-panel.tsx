import * as React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  headerActions?: React.ReactNode
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  initialPosition?: { x: number; y: number }
  className?: string
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

type ResizeDirection = 'right' | 'bottom' | 'corner' | null

export function FloatingPanel({
  open,
  onOpenChange,
  children,
  title,
  subtitle,
  headerActions,
  defaultWidth = 400,
  defaultHeight = 600,
  minWidth = 320,
  maxWidth = 600,
  minHeight = 300,
  maxHeight,
  initialPosition = { x: 64, y: 64 },
  className,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<Position>(initialPosition)
  const [size, setSize] = useState<Size>({ width: defaultWidth, height: defaultHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<ResizeDirection>(null)

  // Track drag/resize start positions
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0, mouseY: 0, posX: 0, posY: 0
  })
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number }>({
    mouseX: 0, mouseY: 0, width: 0, height: 0
  })

  // Get viewport-constrained max height
  const effectiveMaxHeight = maxHeight ?? (typeof window !== 'undefined' ? window.innerHeight - 128 : 800)

  // Constrain position to viewport
  const constrainPosition = useCallback((pos: Position, currentSize: Size): Position => {
    if (typeof window === 'undefined') return pos

    const padding = 16
    const maxX = window.innerWidth - currentSize.width - padding
    const maxY = window.innerHeight - currentSize.height - padding

    return {
      x: Math.max(padding, Math.min(pos.x, maxX)),
      y: Math.max(padding, Math.min(pos.y, maxY)),
    }
  }, [])

  // Constrain size to limits
  const constrainSize = useCallback((newSize: Size): Size => {
    return {
      width: Math.max(minWidth, Math.min(newSize.width, maxWidth)),
      height: Math.max(minHeight, Math.min(newSize.height, effectiveMaxHeight)),
    }
  }, [minWidth, maxWidth, minHeight, effectiveMaxHeight])

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Ignore if clicking close button
    if ((e.target as HTMLElement).closest('[data-close-button]')) return

    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }, [position])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(direction)
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
    }
  }, [size])

  // Handle mouse move for drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.mouseX
        const deltaY = e.clientY - dragStartRef.current.mouseY

        const newPosition = {
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY,
        }

        setPosition(constrainPosition(newPosition, size))
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.mouseX
        const deltaY = e.clientY - resizeStartRef.current.mouseY

        let newWidth = resizeStartRef.current.width
        let newHeight = resizeStartRef.current.height

        if (isResizing === 'right' || isResizing === 'corner') {
          newWidth = resizeStartRef.current.width + deltaX
        }
        if (isResizing === 'bottom' || isResizing === 'corner') {
          newHeight = resizeStartRef.current.height + deltaY
        }

        const constrained = constrainSize({ width: newWidth, height: newHeight })
        setSize(constrained)

        // Also constrain position if panel would go off-screen
        setPosition(prev => constrainPosition(prev, constrained))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, size, constrainPosition, constrainSize])

  // Reset position on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => constrainPosition(prev, size))
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [size, constrainPosition])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 flex flex-col",
        "bg-olive-light border-3 border-dark",
        "overflow-hidden",
        "shadow-[4px_4px_0_var(--olive)]",
        "transition-shadow",
        "hover:shadow-[6px_6px_0_var(--olive)]",
        isDragging && "select-none",
        isResizing && "select-none",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        borderWidth: '3px',
      }}
    >
      {/* Window Chrome Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5",
          "bg-dark border-b-2 border-dark",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#d45a5a]" />
            <div className="w-2 h-2 rounded-full bg-[#d4a84a]" />
            <div className="w-2 h-2 rounded-full bg-[#5aaa5a]" />
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            {title && <span className="font-semibold text-[10px] text-white/80">{title}</span>}
            {subtitle && <span className="text-[9px] text-white/40">-- {subtitle}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {headerActions}
          <button
            data-close-button
            onClick={() => onOpenChange(false)}
            className={cn(
              "p-0.5 opacity-50 transition-opacity",
              "hover:opacity-100",
              "focus:outline-none focus:ring-1 focus:ring-olive"
            )}
          >
            <XIcon className="h-3 w-3 text-white" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </div>

      {/* Right resize handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-2 h-full cursor-ew-resize",
          "hover:bg-olive/10 transition-colors"
        )}
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />

      {/* Bottom resize handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full h-2 cursor-ns-resize",
          "hover:bg-olive/10 transition-colors"
        )}
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />

      {/* Corner resize handle */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize",
          "hover:bg-olive/20 transition-colors"
        )}
        onMouseDown={(e) => handleResizeStart(e, 'corner')}
      >
        <svg
          className="absolute bottom-1 right-1 w-2 h-2 text-muted-foreground/50"
          viewBox="0 0 6 6"
          fill="currentColor"
        >
          <circle cx="5" cy="5" r="1" />
          <circle cx="2" cy="5" r="1" />
          <circle cx="5" cy="2" r="1" />
        </svg>
      </div>
    </div>
  )
}
