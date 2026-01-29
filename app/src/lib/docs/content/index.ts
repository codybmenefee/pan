/**
 * Documentation Content Registry
 *
 * Central registry for all documentation article content.
 * Articles are organized by category and loaded from individual TypeScript modules.
 */

import type { ArticleContent, ContentRegistry } from './types'

// Getting Started
import { introduction } from './getting-started/introduction'
import { quickStart } from './getting-started/quick-start'
import { installation } from './getting-started/installation'

// Core Concepts
import { overview as coreConceptsOverview } from './core-concepts/overview'
import { grazingControlSystem } from './core-concepts/grazing-control-system'
import { stockDensityRecovery } from './core-concepts/stock-density-recovery'
import { timeConstraint } from './core-concepts/time-constraint'
import { partialData } from './core-concepts/partial-data'
import { decisionSupport } from './core-concepts/decision-support'

// System Architecture
import { overview as systemArchitectureOverview } from './system-architecture/overview'
import { dataPipeline } from './system-architecture/data-pipeline'
import { humanInLoop } from './system-architecture/human-in-loop'
import { farmLearning } from './system-architecture/farm-learning'
import { scaling } from './system-architecture/scaling'

// Farm Setup
import { modelingPhilosophy } from './farm-setup/modeling-philosophy'
import { paddocks } from './farm-setup/paddocks'
import { sections } from './farm-setup/sections'
import { waterSources } from './farm-setup/water-sources'
import { importData } from './farm-setup/import'

// Daily Operations
import { overview as dailyOperationsOverview } from './daily-operations/overview'
import { recommendations } from './daily-operations/recommendations'
import { ndvi } from './daily-operations/ndvi'
import { weather } from './daily-operations/weather'
import { confidence } from './daily-operations/confidence'

// Platform Interfaces
import { overview as platformInterfacesOverview } from './platform-interfaces/overview'
import { auth } from './platform-interfaces/auth'
import { endpoints } from './platform-interfaces/endpoints'
import { webhooks } from './platform-interfaces/webhooks'

// Integrations
import { dataFlywheel } from './integrations/data-flywheel'
import { satellites } from './integrations/satellites'
import { weather as weatherIntegration } from './integrations/weather'
import { fms } from './integrations/fms'

export const contentRegistry: ContentRegistry = {
  // Getting Started
  'getting-started/introduction': introduction,
  'getting-started/quick-start': quickStart,
  'getting-started/installation': installation,

  // Core Concepts
  'core-concepts/overview': coreConceptsOverview,
  'core-concepts/grazing-control-system': grazingControlSystem,
  'core-concepts/stock-density-recovery': stockDensityRecovery,
  'core-concepts/time-constraint': timeConstraint,
  'core-concepts/partial-data': partialData,
  'core-concepts/decision-support': decisionSupport,

  // System Architecture
  'system-architecture/overview': systemArchitectureOverview,
  'system-architecture/data-pipeline': dataPipeline,
  'system-architecture/human-in-loop': humanInLoop,
  'system-architecture/farm-learning': farmLearning,
  'system-architecture/scaling': scaling,

  // Farm Setup
  'farm-setup/modeling-philosophy': modelingPhilosophy,
  'farm-setup/paddocks': paddocks,
  'farm-setup/sections': sections,
  'farm-setup/water-sources': waterSources,
  'farm-setup/import': importData,

  // Daily Operations
  'daily-operations/overview': dailyOperationsOverview,
  'daily-operations/recommendations': recommendations,
  'daily-operations/ndvi': ndvi,
  'daily-operations/weather': weather,
  'daily-operations/confidence': confidence,

  // Platform Interfaces
  'platform-interfaces/overview': platformInterfacesOverview,
  'platform-interfaces/auth': auth,
  'platform-interfaces/endpoints': endpoints,
  'platform-interfaces/webhooks': webhooks,

  // Integrations
  'integrations/data-flywheel': dataFlywheel,
  'integrations/satellites': satellites,
  'integrations/weather': weatherIntegration,
  'integrations/fms': fms,
}

export function getArticleContent(
  category: string,
  article: string
): ArticleContent | null {
  const key = `${category}/${article}` as keyof typeof contentRegistry
  return contentRegistry[key] ?? null
}

export type { ArticleContent, ArticleSection } from './types'
