import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { mapFarmDoc, mapPaddockDoc, mapSectionDoc, type FarmDoc, type PaddockDoc, type SectionDoc } from '@/lib/convex/mappers'
import { useFarmContext } from '@/lib/farm'
import type { GeometryChange } from '@/lib/geometry/types'
import type { Paddock } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { ErrorState } from '@/components/ui/error/ErrorState'
import { GeometryProvider } from './GeometryContext'

interface GeometryProviderWithConvexProps {
  children: ReactNode
}

export function GeometryProviderWithConvex({ children }: GeometryProviderWithConvexProps) {
  const { activeFarmId: farmId, isLoading: isFarmLoading } = useFarmContext()
  const farmDoc = useQuery(api.farms.getFarm, farmId ? { farmId } : 'skip') as FarmDoc | null | undefined
  const paddockDocs = useQuery(api.paddocks.listPaddocksByFarm, farmId ? { farmId } : 'skip') as
    | PaddockDoc[]
    | undefined
  const sectionDocs = useQuery(api.intelligence.getAllSections, farmId ? { farmExternalId: farmId } : 'skip') as
    | SectionDoc[]
    | undefined

  const applyPaddockChanges = useMutation(api.paddocks.applyPaddockChanges)
  const updatePaddockMetadata = useMutation(api.paddocks.updatePaddockMetadata)

  const paddocks = useMemo(() => (paddockDocs ?? []).map(mapPaddockDoc), [paddockDocs])
  const farm = farmDoc ? mapFarmDoc(farmDoc) : null
  const sections = useMemo(() => {
    console.log('[GeometryProvider] Processing sections:', {
      sectionDocsCount: sectionDocs?.length ?? 0,
      sectionDocs: sectionDocs?.map(d => ({ 
        id: d.id, 
        paddockId: d.paddockId, 
        date: d.date,
        hasGeometry: !!d.geometry,
      })),
    })
    const mapped = (sectionDocs ?? []).map(mapSectionDoc)
    console.log('[GeometryProvider] Mapped sections:', mapped.length, 'sections ready')
    return mapped
  }, [sectionDocs])

  const handleGeometryChange = useCallback(
    async (changes: GeometryChange[]) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }
      await applyPaddockChanges({ farmId, changes })
    },
    [applyPaddockChanges, farmId]
  )

  const handlePaddockMetadataChange = useCallback(
    async (paddockId: string, metadata: Partial<Omit<Paddock, 'id' | 'geometry'>>) => {
      if (!farmId) {
        throw new Error('Farm ID is unavailable.')
      }
      await updatePaddockMetadata({ farmId, paddockId, metadata })
    },
    [farmId, updatePaddockMetadata]
  )

  const isLoading =
    isFarmLoading ||
    (!!farmId && (farmDoc === undefined || paddockDocs === undefined || sectionDocs === undefined))
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading farm geometry..." />
      </div>
    )
  }

  if (!farmId) {
    return (
      <ErrorState
        title="Farm mapping unavailable"
        message="No farm is associated with this account yet."
        details={['Seed a farm record or map this user to a farm in Convex.']}
        className="min-h-screen"
      />
    )
  }

  if (!farm) {
    return (
      <ErrorState
        title="Farm geometry unavailable"
        message="No farm records were found yet. Seed the database or check your Convex connection."
        details={[
          'Ensure VITE_CONVEX_URL is set in your environment.',
          'Run `npx convex dev` in app/ to initialize the project.',
        ]}
        className="min-h-screen"
      />
    )
  }

  return (
    <GeometryProvider
      initialPaddocks={paddocks}
      initialSections={sections}
      onGeometryChange={handleGeometryChange}
      onPaddockMetadataChange={handlePaddockMetadataChange}
    >
      {children}
    </GeometryProvider>
  )
}
