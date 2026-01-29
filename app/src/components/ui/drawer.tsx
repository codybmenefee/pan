import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right'
  width?: number | string
  modal?: boolean
}

function Drawer({
  open,
  onOpenChange,
  children,
  modal = false,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      {children}
    </DialogPrimitive.Root>
  )
}

function DrawerTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="drawer-trigger"
      className={className}
      {...props}
    />
  )
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="drawer-close"
      className={className}
      {...props}
    />
  )
}

interface DrawerOverlayProps extends React.ComponentProps<typeof DialogPrimitive.Overlay> {
  transparent?: boolean
}

function DrawerOverlay({
  className,
  transparent = false,
  ...props
}: DrawerOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-40",
        !transparent && "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/30",
        className
      )}
      {...props}
    />
  )
}

interface DrawerContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  side?: 'left' | 'right'
  width?: number | string
  showCloseButton?: boolean
  showOverlay?: boolean
  ariaLabel?: string  // For content with custom visible headers
}

function DrawerContent({
  className,
  children,
  side = 'left',
  width = 400,
  showCloseButton = true,
  showOverlay = true,
  ariaLabel,
  ...props
}: DrawerContentProps) {
  const widthValue = typeof width === 'number' ? `${width}px` : width

  return (
    <DrawerPortal>
      {showOverlay && <DrawerOverlay transparent />}
      <DialogPrimitive.Content
        data-slot="drawer-content"
        aria-describedby={undefined}
        className={cn(
          "bg-background fixed top-0 z-50 flex h-full flex-col border shadow-lg outline-none",
          // Animation classes
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:duration-300 data-[state=open]:duration-300",
          // Side-specific styles
          side === 'left' && [
            "left-0 border-r",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          ],
          side === 'right' && [
            "right-0 border-l",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          ],
          // Mobile responsive - full width on small screens
          "w-full sm:w-auto",
          className
        )}
        style={{
          maxWidth: widthValue,
        }}
        {...props}
      >
        {ariaLabel && (
          <DialogPrimitive.Title className="sr-only">
            {ariaLabel}
          </DialogPrimitive.Title>
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="drawer-close"
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-1 p-4 border-b",
        className
      )}
      {...props}
    />
  )
}

function DrawerBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("flex-1 overflow-y-auto p-4", className)}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "flex flex-col-reverse gap-2 p-4 border-t sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
