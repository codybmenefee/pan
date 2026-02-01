export type TutorialPhase = 'fullscreen' | 'reveal' | 'spotlight' | 'complete'

export function useRevealState(currentStep: number) {
  const phase: TutorialPhase =
    currentStep < 5 ? 'fullscreen'
    : currentStep === 5 ? 'reveal'
    : currentStep < 10 ? 'spotlight'
    : 'complete'

  const overlayOpacity = {
    fullscreen: 0.5,
    reveal: 0.5,
    spotlight: 0.5,
    complete: 0
  }[phase]

  return { phase, overlayOpacity }
}
