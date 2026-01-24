import { createFileRoute } from '@tanstack/react-router'
import { MapView } from '@/components/map/MapView'
import { z } from 'zod'

const mapSearchSchema = z.object({
  edit: z.boolean().optional(),
  paddockId: z.string().optional(),
  sectionId: z.string().optional(),
  entityType: z.enum(['paddock', 'section']).optional(),
})

export const Route = createFileRoute('/_app/map')({
  component: MapView,
  validateSearch: mapSearchSchema,
})
