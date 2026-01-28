import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
  type RefObject,
} from 'react'

type AnimationState = 'idle' | 'animating' | 'complete'

interface SatelliteAnimationContextValue {
  triggerCollapseAnimation: () => void
  showTooltip: boolean
  animationState: AnimationState
  registerTargetRef: (ref: RefObject<HTMLDivElement | null>) => void
  targetRef: RefObject<HTMLDivElement | null> | null
}

const SatelliteAnimationContext = createContext<SatelliteAnimationContextValue | null>(null)

const ANIMATION_DURATION = 400
const TOOLTIP_DURATION = 5000

export function SatelliteAnimationProvider({ children }: { children: ReactNode }) {
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [showTooltip, setShowTooltip] = useState(false)
  const [targetRef, setTargetRef] = useState<RefObject<HTMLDivElement | null> | null>(null)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registerTargetRef = useCallback((ref: RefObject<HTMLDivElement | null>) => {
    setTargetRef(ref)
  }, [])

  const triggerCollapseAnimation = useCallback(() => {
    setAnimationState('animating')

    // After animation completes, show tooltip
    setTimeout(() => {
      setAnimationState('complete')
      setShowTooltip(true)

      // Hide tooltip after 5 seconds
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false)
        setAnimationState('idle')
      }, TOOLTIP_DURATION)
    }, ANIMATION_DURATION)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  return (
    <SatelliteAnimationContext.Provider
      value={{
        triggerCollapseAnimation,
        showTooltip,
        animationState,
        registerTargetRef,
        targetRef,
      }}
    >
      {children}
    </SatelliteAnimationContext.Provider>
  )
}

export function useSatelliteAnimation() {
  const context = useContext(SatelliteAnimationContext)
  if (!context) {
    throw new Error('useSatelliteAnimation must be used within SatelliteAnimationProvider')
  }
  return context
}
