import { mutation } from '../_generated/server'

/**
 * One-time migration to update farm-1 paddock geometries with real field shapes.
 * Run with: npx convex run migrations/updateDemoGeometries:updateGeometries --prod
 */

const FARM_EXTERNAL_ID = 'farm-1'

// Real paddock geometries oriented over actual fields
const paddockGeometries: Record<string, { coordinates: number[][][] }> = {
  p1: {
    coordinates: [[
      [-87.0397151751705, 35.64517947639289],
      [-87.03859429334015, 35.64481193563437],
      [-87.03774455927639, 35.64426942801891],
      [-87.0392354865863, 35.64344523496971],
      [-87.04003725584133, 35.64408961008082],
      [-87.03960210716617, 35.644556580655056],
      [-87.03980940419737, 35.64493484980728],
      [-87.0397151751705, 35.64517947639289],
    ]],
  },
  p2: {
    coordinates: [[
      [-87.04129253080069, 35.645489348163714],
      [-87.03998354641223, 35.64471899067983],
      [-87.0404278, 35.64461346],
      [-87.04047000608041, 35.64415853002819],
      [-87.03960934858975, 35.643314249419596],
      [-87.04119274471498, 35.64244250645793],
      [-87.04129253080069, 35.645489348163714],
    ]],
  },
  p3: {
    coordinates: [[
      [-87.03793806153855, 35.64398436238422],
      [-87.0371872608203, 35.64407217655365],
      [-87.03602321174208, 35.64352716],
      [-87.03539432293357, 35.64318068832997],
      [-87.03522492457154, 35.64278754147296],
      [-87.03616337293026, 35.642323140968294],
      [-87.03793806153855, 35.64398436238422],
    ]],
  },
  p4: {
    coordinates: [[
      [-87.03754364707473, 35.641668279812805],
      [-87.03628096325767, 35.642172808890706],
      [-87.03512001710901, 35.6425942771626],
      [-87.03485083970001, 35.64184580957378],
      [-87.03484013324115, 35.641175136772496],
      [-87.03658744189558, 35.64038521823965],
      [-87.03754364707473, 35.641668279812805],
    ]],
  },
  p5: {
    coordinates: [[
      [-87.0406044827726, 35.6396559687299],
      [-87.0373031908863, 35.64106750277516],
      [-87.0366576096398, 35.64036891907377],
      [-87.04036547413159, 35.639016396706715],
      [-87.04062866443813, 35.63923238216604],
      [-87.0406044827726, 35.6396559687299],
    ]],
  },
  p6: {
    coordinates: [[
      [-87.03884751709019, 35.64339541993121],
      [-87.03798785636894, 35.643953401441024],
      [-87.03625145893781, 35.64226066124887],
      [-87.03746820096396, 35.64183209220326],
      [-87.03884751709019, 35.64339541993121],
    ]],
  },
  p7: {
    coordinates: [[
      [-87.03934550934439, 35.64193806372046],
      [-87.0389974656823, 35.642496819503236],
      [-87.03915182562857, 35.64304578996256],
      [-87.03900245715545, 35.64330015418798],
      [-87.03775642063364, 35.64177810914282],
      [-87.03911227371509, 35.641141876784275],
      [-87.03934550934439, 35.64193806372046],
    ]],
  },
  p8: {
    coordinates: [[
      [-87.04123692533379, 35.64202019092877],
      [-87.04054797413285, 35.64239044525953],
      [-87.04031355794291, 35.64165524105345],
      [-87.03979879170721, 35.64112106426853],
      [-87.04076483026331, 35.64054630948765],
      [-87.04111631764795, 35.641068816643575],
      [-87.04091275646923, 35.64145069411512],
      [-87.04123692533379, 35.64202019092877],
    ]],
  },
}

// Farm boundary that encompasses all paddocks
const farmGeometry = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[
      [-87.04303251567856, 35.646039653104296],
      [-87.03323954437344, 35.646039653104296],
      [-87.03323954437344, 35.638081167693215],
      [-87.04303251567856, 35.638081167693215],
      [-87.04303251567856, 35.646039653104296],
    ]],
  },
}

const farmCoordinates: [number, number] = [-87.03813603002601, 35.642060410398756]

export const updateGeometries = mutation({
  handler: async (ctx) => {
    // Find farm-1
    let farm = await ctx.db
      .query('farms')
      .withIndex('by_externalId', (q) => q.eq('externalId', FARM_EXTERNAL_ID))
      .first()

    if (!farm) {
      farm = await ctx.db
        .query('farms')
        .withIndex('by_legacyExternalId', (q: any) => q.eq('legacyExternalId', FARM_EXTERNAL_ID))
        .first()
    }

    if (!farm) {
      return { success: false, error: 'Farm not found' }
    }

    // Update farm geometry and coordinates
    await ctx.db.patch(farm._id, {
      geometry: farmGeometry,
      coordinates: farmCoordinates,
      location: '120 River Heights Drive, Columbia, Tennessee, 38401',
      updatedAt: new Date().toISOString(),
    })

    // Get all paddocks for this farm
    const paddocks = await ctx.db
      .query('paddocks')
      .withIndex('by_farm', (q) => q.eq('farmId', farm._id))
      .collect()

    let updatedCount = 0
    for (const paddock of paddocks) {
      const geometry = paddockGeometries[paddock.externalId]
      if (geometry) {
        await ctx.db.patch(paddock._id, {
          geometry: {
            type: 'Feature',
            properties: { entityId: paddock.externalId, entityType: 'paddock' },
            geometry: {
              type: 'Polygon',
              coordinates: geometry.coordinates,
            },
          },
          updatedAt: new Date().toISOString(),
        })
        updatedCount++
      }
    }

    return {
      success: true,
      farmId: farm._id,
      updatedPaddocks: updatedCount,
      totalPaddocks: paddocks.length,
    }
  },
})
