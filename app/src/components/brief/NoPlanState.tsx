import { useState, useEffect } from 'react'
import { WordCascade } from './WordCascade'

interface NoPlanStateProps {
  isGenerating: boolean
  onGenerate: () => void
  onAnimationComplete: () => void
}

export function NoPlanState({ isGenerating, onGenerate, onAnimationComplete }: NoPlanStateProps) {
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (!isGenerating && animationComplete) {
      setAnimationComplete(false)
    }
  }, [isGenerating, animationComplete])

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full">
      <WordCascade
        isGenerating={isGenerating}
        onGenerate={onGenerate}
        onAnimationComplete={() => {
          setAnimationComplete(true)
          onAnimationComplete()
        }}
      />
    </div>
  )
}
