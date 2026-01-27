import { Button } from '@/components/ui/button'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to OpenPasture
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Daily decisions for adaptive grazing, powered by satellite sensing and your local knowledge.
      </p>
      
      <Button size="lg" onClick={onNext}>
        Get Started
      </Button>
    </div>
  )
}
