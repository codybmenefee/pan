interface ScreenshotDisplayProps {
  src: string
  alt: string
  className?: string
}

export function ScreenshotDisplay({ src, alt, className = '' }: ScreenshotDisplayProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Radial gradient glow background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#075056]/20 via-[#075056]/5 to-transparent blur-2xl scale-110"
        aria-hidden="true"
      />

      {/* Screenshot frame */}
      <div className="relative bg-[#111719]/80 backdrop-blur-sm border border-[#075056]/40 rounded-lg shadow-2xl shadow-[#075056]/20 overflow-hidden">
        {/* Screenshot content */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
    </div>
  )
}
