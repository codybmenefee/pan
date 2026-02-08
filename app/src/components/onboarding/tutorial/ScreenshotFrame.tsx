import { cn } from '@/lib/utils'

interface ScreenshotFrameProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'video' | 'square' | 'portrait'
}

export function ScreenshotFrame({
  src,
  alt,
  className,
  aspectRatio = 'video',
}: ScreenshotFrameProps) {
  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
  }[aspectRatio]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-muted/50',
        'shadow-xl shadow-black/10',
        'ring-1 ring-black/5',
        aspectClass,
        className
      )}
    >
      {/* Browser chrome header */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center gap-1.5 bg-muted/80 px-3 backdrop-blur-sm">
        <div className="h-2.5 w-2.5 rounded-full bg-terracotta-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-terracotta-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-olive/80" />
        <div className="ml-2 flex-1 rounded-md bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
          grazing.ai
        </div>
      </div>

      {/* Screenshot image */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-top pt-8"
        loading="lazy"
      />

      {/* Subtle gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  )
}
