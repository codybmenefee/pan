import type { ArticleContent } from '../types'

export const fms: ArticleContent = {
  title: 'Farm Management Systems',
  description:
    'Integrating with existing farm management software. Philosophy of coexistence, reducing duplicate data entry, common integration patterns, and data sync strategies.',
  sections: [
    {
      heading: 'Integration Philosophy: Coexist, Not Replace',
      content: `Farms typically have existing software for:
- Financial management and accounting
- Livestock tracking and identification
- Compliance and record-keeping
- Inventory and supplies

The platform doesn't try to replace these systems. Instead, it integrates as a specialized component focused on grazing decisions.

**Why coexistence:**
- Existing systems have invested configuration
- Switching costs are prohibitive
- Specialized tools do their jobs well
- Forcing replacement creates adoption barriers

**The platform's role:**
One component in a farm's technology ecosystem, exchanging data with others rather than centralizing everything.`,
    },
    {
      heading: 'Reducing Duplicate Data Entry',
      content: `Double-entry is a common complaint with farm software. The platform minimizes this through:

**Automatic data capture:**
- Satellite observations arrive without manual entry
- Plan approvals record grazing events automatically
- Weather data syncs from services

**Integration sync:**
- Events can push to external systems
- Status can pull from external systems
- Two-way sync where supported

**API-first design:**
- Everything in the platform is accessible via API
- External systems can query and write
- No UI-only functionality

The goal: enter data once, use it everywhere.`,
    },
    {
      heading: 'Common Integration Patterns',
      content: `Typical integrations with farm management systems:

**Grazing events → Financial systems**
When grazing events are recorded, sync to systems that track paddock usage for costing.

**Animal locations → Platform**
If your FMS tracks animal locations, sync this to inform which paddock is currently active.

**Plan approvals → Compliance records**
Export approved plans to compliance systems that require grazing management documentation.

**NDVI data → FMS dashboards**
Feed vegetation data to existing dashboards for a unified farm view.

**Weather → Multiple systems**
Weather data useful for multiple purposes can be shared across systems.`,
    },
    {
      heading: 'Respecting Existing Workflows',
      content: `Integration should fit your existing routine, not disrupt it:

**Don't require login switching:**
Embed platform data in existing dashboards where possible.

**Don't duplicate alerts:**
If your FMS handles notifications, integrate rather than create parallel alerting.

**Don't conflict with authoritative records:**
If livestock numbers live in your FMS, reference them rather than maintaining a separate count.

**Don't force immediate adoption:**
Allow gradual integration. Start with data flow in one direction, expand as comfort grows.

The platform adapts to you, not the reverse.`,
    },
    {
      heading: 'Data Sync Strategies',
      content: `Different sync patterns suit different needs:

**Push (platform → external):**
Events trigger immediate sync to external systems. Use for time-sensitive data like plan approvals.

**Pull (external → platform):**
Platform queries external systems on schedule. Use for reference data that changes slowly.

**Bidirectional:**
Both systems can initiate sync. Requires conflict resolution rules. Use carefully.

**Batch:**
Sync accumulated changes periodically (daily, weekly). Lower overhead, acceptable latency.

**Real-time:**
Immediate sync on every change. Higher complexity but current data.

Choose patterns based on data freshness requirements and system capabilities.`,
    },
    {
      heading: 'Technical Integration',
      content: `For developers building integrations:

**REST API:**
Platform exposes HTTP endpoints for query and mutation. Standard REST patterns.

**Webhooks:**
Subscribe to events for push notifications. See [Webhooks](/docs/platform-interfaces/webhooks).

**Data formats:**
- GeoJSON for spatial data
- ISO 8601 for dates
- JSON for structured data

**Authentication:**
API keys or OAuth tokens depending on integration type.

**Rate limits:**
Respect rate limits to avoid throttling. Batch operations where appropriate.`,
    },
    {
      heading: 'Popular FMS Integrations',
      content: `Integrations in development or available:

**AgriWebb:**
Livestock management system. Sync animal locations and grazing events.

**Figured:**
Farm financial management. Sync for cost tracking and reporting.

**MaiaGrazing:**
Grazing management. Complementary or competitive depending on use case.

**Datamars:**
Livestock identification. Animal tracking and inventory.

**Custom systems:**
Many farms have custom or legacy systems. API integration enables connection to anything.

Contact support for specific integration availability and status.`,
    },
  ],
  relatedArticles: [
    '/docs/integrations/data-flywheel',
    '/docs/platform-interfaces/webhooks',
    '/docs/platform-interfaces/endpoints',
  ],
}
