import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useSubmitBugReport,
  captureBugContext,
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  type BugCategory,
  type BugSeverity,
} from '@/lib/convex/useBugReport'
import { useCurrentUser } from '@/lib/convex/useCurrentUser'
import { useFarmContext } from '@/lib/farm'

interface BugReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<BugCategory>('functionality')
  const [severity, setSeverity] = useState<BugSeverity>('medium')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitBugReport = useSubmitBugReport()
  const { user } = useCurrentUser()
  const { activeFarmId } = useFarmContext()

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('functionality')
    setSeverity('medium')
    setStepsToReproduce('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    setIsSubmitting(true)

    try {
      const context = captureBugContext()
      const result = await submitBugReport({
        userExternalId: user?.externalId ?? undefined,
        farmExternalId: activeFarmId ?? undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        context,
      })

      if (result.success) {
        toast.success('Bug report submitted', {
          description: result.githubIssueUrl
            ? 'A GitHub issue has been created.'
            : 'Thank you for your feedback.',
        })
        handleClose()
      } else {
        toast.error('Failed to submit bug report', {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error('Failed to submit bug report')
      console.error('Bug report error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>
              Help us improve by reporting issues you encounter.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as BugCategory)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Severity</label>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <Badge
                    key={option.value}
                    variant={severity === option.value ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-colors',
                      severity === option.value && option.value === 'critical' && 'bg-destructive',
                      severity === option.value && option.value === 'high' && 'bg-orange-500',
                      severity === option.value && option.value === 'medium' && 'bg-yellow-500',
                      severity === option.value && option.value === 'low' && 'bg-green-500'
                    )}
                    onClick={() => !isSubmitting && setSeverity(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {SEVERITY_OPTIONS.find((o) => o.value === severity)?.description}
              </p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="What happened? What did you expect to happen?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="steps" className="text-sm font-medium">
                Steps to Reproduce <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
