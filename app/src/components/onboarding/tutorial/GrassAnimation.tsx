import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GrassAnimationProps {
  className?: string
}

export function GrassAnimation({ className }: GrassAnimationProps) {
  // Create blades of grass with staggered animations
  const blades = [
    { delay: '0s', height: 'h-12', color: 'text-olive' },
    { delay: '0.2s', height: 'h-16', color: 'text-olive' },
    { delay: '0.4s', height: 'h-14', color: 'text-olive' },
    { delay: '0.1s', height: 'h-18', color: 'text-olive' },
    { delay: '0.3s', height: 'h-12', color: 'text-olive' },
    { delay: '0.5s', height: 'h-16', color: 'text-olive' },
    { delay: '0.15s', height: 'h-14', color: 'text-olive' },
  ]

  return (
    <div className={cn('relative flex items-end justify-center gap-1', className)}>
      {/* Ground */}
      <div className="absolute bottom-0 left-1/2 h-2 w-40 -translate-x-1/2 rounded-full bg-gradient-to-r from-terracotta/20 via-terracotta/40 to-terracotta/20" />

      {/* Grass blades */}
      {blades.map((blade, index) => (
        <div
          key={index}
          className={cn(
            'relative flex flex-col items-center',
            blade.height,
            blade.color
          )}
          style={{
            animation: 'grass-sway 3s ease-in-out infinite',
            animationDelay: blade.delay,
          }}
        >
          <Leaf
            className="h-8 w-8 rotate-180"
            style={{
              animation: 'grass-grow 6s ease-in-out infinite',
              animationDelay: blade.delay,
            }}
          />
          <div
            className={cn(
              'w-0.5 flex-1 rounded-full',
              'bg-gradient-to-b from-current to-current/60'
            )}
          />
        </div>
      ))}

      {/* Cattle icon that moves across */}
      <div
        className="absolute bottom-1 left-0"
        style={{
          animation: 'cattle-move 6s ease-in-out infinite',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-terracotta/60"
          fill="currentColor"
        >
          <path d="M5 4h2v2H5zm12 0h2v2h-2zM4 7h3v2H4zm13 0h3v2h-3zM3 10h18v4H3zm1 5h16v2H4zm2 3h4v2H6zm8 0h4v2h-4z" />
        </svg>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes grass-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes grass-grow {
          0%, 100% { opacity: 1; transform: scale(1); }
          25% { opacity: 0.6; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(0.9); }
          75% { opacity: 1; transform: scale(1); }
        }

        @keyframes cattle-move {
          0% { transform: translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          45% { transform: translateX(140px); opacity: 1; }
          55% { transform: translateX(140px); opacity: 0; }
          100% { transform: translateX(0px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
