import {
  BookOpen,
  Lightbulb,
  Cpu,
  Map,
  Sun,
  Code,
  Plug,
} from 'lucide-react'
import type { DocsConfig } from './types'

export const docsConfig: DocsConfig = {
  title: 'Morning Farm Brief',
  description: 'Documentation for the AI-powered grazing decision support system',
  navigation: [
    {
      title: 'Getting Started',
      slug: 'getting-started',
      icon: BookOpen,
      defaultOpen: true,
      items: [
        { title: 'Introduction', href: '/docs/getting-started/introduction' },
        { title: 'Quick Start', href: '/docs/getting-started/quick-start' },
        { title: 'Installation', href: '/docs/getting-started/installation' },
      ],
    },
    {
      title: 'Core Concepts',
      slug: 'core-concepts',
      icon: Lightbulb,
      items: [
        { title: 'Overview', href: '/docs/core-concepts/overview' },
        { title: 'Grazing as a Control System', href: '/docs/core-concepts/grazing-control-system' },
        { title: 'Stock Density & Recovery', href: '/docs/core-concepts/stock-density-recovery' },
        { title: 'Time as the Constraint', href: '/docs/core-concepts/time-constraint' },
        { title: 'Partial Data & Uncertainty', href: '/docs/core-concepts/partial-data' },
        { title: 'Decision Support Philosophy', href: '/docs/core-concepts/decision-support' },
      ],
    },
    {
      title: 'System Architecture',
      slug: 'system-architecture',
      icon: Cpu,
      items: [
        { title: 'How the Platform Thinks', href: '/docs/system-architecture/overview' },
        { title: 'Data Pipeline', href: '/docs/system-architecture/data-pipeline' },
        { title: 'Human-in-the-Loop', href: '/docs/system-architecture/human-in-loop' },
        { title: 'Farm-Level Learning', href: '/docs/system-architecture/farm-learning' },
        { title: 'Scaling Architecture', href: '/docs/system-architecture/scaling' },
      ],
    },
    {
      title: 'Farm Setup',
      slug: 'farm-setup',
      icon: Map,
      items: [
        { title: 'Modeling Philosophy', href: '/docs/farm-setup/modeling-philosophy' },
        { title: 'Pastures', href: '/docs/farm-setup/pastures' },
        { title: 'Paddocks', href: '/docs/farm-setup/paddocks' },
        { title: 'Water Sources', href: '/docs/farm-setup/water-sources' },
        { title: 'Importing Data', href: '/docs/farm-setup/import' },
      ],
    },
    {
      title: 'Daily Operations Brief',
      slug: 'daily-operations',
      icon: Sun,
      items: [
        { title: 'Morning Brief Overview', href: '/docs/daily-operations/overview' },
        { title: 'Recommendations', href: '/docs/daily-operations/recommendations' },
        { title: 'NDVI Analysis', href: '/docs/daily-operations/ndvi', badge: 'New' },
        { title: 'Weather Integration', href: '/docs/daily-operations/weather' },
        { title: 'Confidence Scoring', href: '/docs/daily-operations/confidence' },
      ],
    },
    {
      title: 'Platform Interfaces',
      slug: 'platform-interfaces',
      icon: Code,
      items: [
        { title: 'Platform Overview', href: '/docs/platform-interfaces/overview' },
        { title: 'Authentication', href: '/docs/platform-interfaces/auth' },
        { title: 'Endpoints', href: '/docs/platform-interfaces/endpoints' },
        { title: 'Webhooks', href: '/docs/platform-interfaces/webhooks', badge: 'Beta' },
      ],
    },
    {
      title: 'Integrations',
      slug: 'integrations',
      icon: Plug,
      items: [
        { title: 'Data Flywheel', href: '/docs/integrations/data-flywheel' },
        { title: 'Satellite Providers', href: '/docs/integrations/satellites' },
        { title: 'Weather Services', href: '/docs/integrations/weather' },
        { title: 'Farm Management Systems', href: '/docs/integrations/fms' },
      ],
    },
  ],
}
