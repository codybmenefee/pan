import { Link } from '@tanstack/react-router'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DemoUpsellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function DemoUpsellDialog({
  open,
  onOpenChange,
  title = 'Create Your Account',
  description = 'Sign up to create your own farms, save your settings, and get personalized grazing recommendations.',
}: DemoUpsellDialogProps) {
  const benefits = [
    '5-minute setup',
    'Real satellite imagery for your farm',
    'AI-powered daily recommendations',
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-olive flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue Demo
          </Button>
          <Link to="/sign-in">
            <Button>Create Account</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
