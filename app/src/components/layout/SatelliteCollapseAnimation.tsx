import { useEffect, useState } from 'react'
import { Satellite } from 'lucide-react'
import { useSatelliteAnimation } from '@/lib/satellite-animation'

export function SatelliteCollapseAnimation() {
  const { animationState, targetRef } = useSatelliteAnimation()
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Get target position when animation starts
  useEffect(() => {
    if (animationState === 'animating' && targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect()
      setTargetPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      // Small delay to ensure the element is rendered before animation starts
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else if (animationState === 'idle') {
      setIsAnimating(false)
      setTargetPosition(null)
    }
  }, [animationState, targetRef])

  if (animationState !== 'animating' || !targetPosition) {
    return null
  }

  // Start position: center of viewport
  const startX = window.innerWidth / 2
  const startY = window.innerHeight / 2

  // Calculate translation to target
  const translateX = targetPosition.x - startX
  const translateY = targetPosition.y - startY

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: startX,
        top: startY,
        transform: isAnimating
          ? `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(0.5)`
          : 'translate(-50%, -50%) scale(1)',
        opacity: isAnimating ? 0.8 : 1,
        transition: 'transform 400ms ease-out, opacity 400ms ease-out',
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-light shadow-hard-sm">
        <Satellite className="h-5 w-5 text-olive" />
      </div>
    </div>
  )
}
