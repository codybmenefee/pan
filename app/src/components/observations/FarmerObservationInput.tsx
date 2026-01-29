/**
 * Input component for farmer observations.
 *
 * Allows farmers to add observations at farm, paddock, or zone level.
 */

import React, { useState } from 'react'
import { useCreateFarmerObservation } from '../../lib/convex/useFarmerObservations'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
// Label component - create inline if not available
const Label = ({ htmlFor, children, className = '' }: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
    {children}
  </label>
)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface FarmerObservationInputProps {
  farmId: Id<'farms'>
  authorId: string
  paddocks?: Array<{ externalId: string; name: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function FarmerObservationInput({
  farmId,
  authorId,
  paddocks = [],
  onSuccess,
  onCancel,
}: FarmerObservationInputProps) {
  const [level, setLevel] = useState<'farm' | 'paddock' | 'zone'>('farm')
  const [targetId, setTargetId] = useState<string>('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createObservation = useCreateFarmerObservation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    // Determine target ID based on level
    const finalTargetId =
      level === 'farm' ? farmId : targetId || paddocks[0]?.externalId || ''

    if (!finalTargetId) {
      console.error('No target ID available')
      return
    }

    setIsSubmitting(true)

    try {
      await createObservation({
        farmId,
        authorId,
        level,
        targetId: finalTargetId,
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      })

      // Reset form
      setContent('')
      setTags([])
      setTagInput('')
      setLevel('farm')
      setTargetId('')

      onSuccess?.()
    } catch (error) {
      console.error('Error creating observation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Observation</CardTitle>
        <CardDescription>
          Record your observations about the farm, paddock, or zone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="level">Observation Level</Label>
            <Select
              value={level}
              onValueChange={(value) => {
                setLevel(value as 'farm' | 'paddock' | 'zone')
                setTargetId('')
              }}
            >
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farm">Farm</SelectItem>
                <SelectItem value="paddock">Paddock</SelectItem>
                <SelectItem value="zone">Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(level === 'paddock' || level === 'zone') && (
            <div className="space-y-2">
              <Label htmlFor="target">
                {level === 'paddock' ? 'Paddock' : 'Zone'}
              </Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="target">
                  <SelectValue placeholder={`Select ${level}`} />
                </SelectTrigger>
                <SelectContent>
                  {paddocks.map((paddock) => (
                    <SelectItem key={paddock.externalId} value={paddock.externalId}>
                      {paddock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Observation</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what you're observing..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Observation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
