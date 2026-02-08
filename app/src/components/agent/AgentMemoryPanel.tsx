import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AgentMemory } from '@/lib/types'

interface AgentMemoryPanelProps {
  memories: AgentMemory[]
  archivedMemories: AgentMemory[]
  recentFarmerObservations: Array<{
    _id: string
    level: 'farm' | 'paddock' | 'zone'
    targetId: string
    content: string
    tags?: string[]
    createdAt: string
  }>
  onCreate: (input: {
    scope: 'farm' | 'paddock'
    targetId?: string
    title: string
    content: string
    tags?: string[]
    priority: number
  }) => Promise<void>
  onArchive: (memoryId: string) => Promise<void>
  onUnarchive: (memoryId: string) => Promise<void>
  onUpdate: (input: {
    memoryId: string
    title?: string
    content?: string
    tags?: string[]
    priority?: number
    status?: 'active' | 'archived'
  }) => Promise<void>
  onPromote: (observationId: string, title: string, priority: number) => Promise<void>
}

export function AgentMemoryPanel({
  memories,
  archivedMemories,
  recentFarmerObservations,
  onCreate,
  onArchive,
  onUnarchive,
  onUpdate,
  onPromote,
}: AgentMemoryPanelProps) {
  const [scope, setScope] = useState<'farm' | 'paddock'>('farm')
  const [targetId, setTargetId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [priority, setPriority] = useState('3')
  const [isCreating, setIsCreating] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [observationId, setObservationId] = useState('')
  const [promoteTitle, setPromoteTitle] = useState('')
  const [memoryView, setMemoryView] = useState<'active' | 'archived'>('active')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editPriority, setEditPriority] = useState('3')
  const [savingMemoryId, setSavingMemoryId] = useState<string | null>(null)

  const promotedCandidates = useMemo(() => recentFarmerObservations.slice(0, 20), [recentFarmerObservations])
  const visibleMemories = memoryView === 'active' ? memories : archivedMemories

  const beginEditing = (memory: AgentMemory) => {
    setEditingId(memory._id)
    setEditTitle(memory.title)
    setEditContent(memory.content)
    setEditTags((memory.tags ?? []).join(', '))
    setEditPriority(String(memory.priority))
  }

  const resetEditing = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
    setEditPriority('3')
  }

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setIsCreating(true)
    try {
      await onCreate({
        scope,
        targetId: scope === 'paddock' ? targetId : undefined,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        priority: Number(priority),
      })
      setTitle('')
      setContent('')
      setTags('')
      setTargetId('')
      setPriority('3')
    } finally {
      setIsCreating(false)
    }
  }

  const handlePromote = async () => {
    if (!observationId || !promoteTitle.trim()) return
    setIsPromoting(true)
    try {
      await onPromote(observationId, promoteTitle.trim(), Number(priority))
      setObservationId('')
      setPromoteTitle('')
    } finally {
      setIsPromoting(false)
    }
  }

  const handleSaveEdit = async (memoryId: string) => {
    if (!editTitle.trim() || !editContent.trim()) return
    setSavingMemoryId(memoryId)
    try {
      await onUpdate({
        memoryId,
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: editTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        priority: Number(editPriority),
      })
      resetEditing()
    } finally {
      setSavingMemoryId(null)
    }
  }

  const handleArchive = async (memoryId: string) => {
    setSavingMemoryId(memoryId)
    try {
      await onArchive(memoryId)
    } finally {
      setSavingMemoryId(null)
    }
  }

  const handleUnarchive = async (memoryId: string) => {
    setSavingMemoryId(memoryId)
    try {
      await onUnarchive(memoryId)
    } finally {
      setSavingMemoryId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Memory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded border-2 border-border p-3 space-y-3">
          <h4 className="text-sm font-medium">Create Memory</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select value={scope} onValueChange={(value) => setScope(value as 'farm' | 'paddock')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farm">Farm Scope</SelectItem>
                <SelectItem value="paddock">Paddock Scope</SelectItem>
              </SelectContent>
            </Select>
            {scope === 'paddock' && (
              <Input placeholder="Target paddock id" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            )}
            <Input placeholder="Priority (1-5)" value={priority} onChange={(e) => setPriority(e.target.value)} />
            <Input placeholder="Memory title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Textarea rows={3} placeholder="Memory content" value={content} onChange={(e) => setContent(e.target.value)} />
          <Input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={isCreating || !title.trim() || !content.trim()} onClick={handleCreate}>
              {isCreating ? 'Saving...' : 'Add Memory'}
            </Button>
          </div>
        </div>

        <div className="rounded border-2 border-border p-3 space-y-3">
          <h4 className="text-sm font-medium">Promote Observation</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={observationId} onValueChange={setObservationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select recent observation" />
              </SelectTrigger>
              <SelectContent>
                {promotedCandidates.map((obs) => (
                  <SelectItem key={obs._id} value={obs._id}>
                    [{obs.level}] {obs.content.slice(0, 48)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Memory title"
              value={promoteTitle}
              onChange={(e) => setPromoteTitle(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" disabled={isPromoting || !observationId || !promoteTitle.trim()} onClick={handlePromote}>
              {isPromoting ? 'Promoting...' : 'Promote'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Memory Library</h4>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={memoryView === 'active' ? 'secondary' : 'ghost'}
                onClick={() => setMemoryView('active')}
              >
                Active ({memories.length})
              </Button>
              <Button
                size="sm"
                variant={memoryView === 'archived' ? 'secondary' : 'ghost'}
                onClick={() => setMemoryView('archived')}
              >
                Archived ({archivedMemories.length})
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {visibleMemories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {memoryView === 'active' ? 'No active memories yet.' : 'No archived memories.'}
              </p>
            )}
            {visibleMemories.map((memory) => {
              const isEditing = editingId === memory._id
              const isSaving = savingMemoryId === memory._id
              return (
                <div key={memory._id} className="rounded border-2 border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{memory.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {memory.scope}{memory.targetId ? `:${memory.targetId}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">P{memory.priority}</Badge>
                      {!isEditing && (
                        <Button size="sm" variant="ghost" onClick={() => beginEditing(memory)}>
                          Edit
                        </Button>
                      )}
                      {memory.status === 'active' ? (
                        <Button size="sm" variant="ghost" disabled={isSaving} onClick={() => handleArchive(memory._id)}>
                          {isSaving ? 'Saving...' : 'Archive'}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={isSaving} onClick={() => handleUnarchive(memory._id)}>
                          {isSaving ? 'Saving...' : 'Unarchive'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <Textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          placeholder="Tags (comma separated)"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                        />
                        <Input
                          placeholder="Priority (1-5)"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={resetEditing}>
                          Cancel
                        </Button>
                        <Button size="sm" disabled={isSaving || !editTitle.trim() || !editContent.trim()} onClick={() => handleSaveEdit(memory._id)}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{memory.content}</p>
                      {memory.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      ) : null}
                      {memory.lastUsedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Last used: {new Date(memory.lastUsedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
