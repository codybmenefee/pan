import type { ArticleContent } from '../types'

export const overview: ArticleContent = {
  title: 'Platform Overview',
  description:
    'Introduction to the platform APIs. Why API-first design matters, available interface types, and how to think about integrating with the system.',
  sections: [
    {
      heading: 'Why API-First',
      content: `The platform exposes all functionality through typed APIs. The web interface is one consumer; others can be built.

**Strategic benefits:**

**Hardware integration:**
Soil sensors, water monitors, animal trackers—any device can push data or query status.

**Autonomy pathways:**
Virtual fencing, automated gates, drone surveys—autonomous systems need programmatic interfaces.

**Research access:**
Agronomists, universities, and research institutions can query historical data for analysis.

**Third-party integration:**
Farm management software, accounting systems, and compliance platforms can connect.

**UI flexibility:**
Mobile apps, voice interfaces, dashboards—different interfaces for different contexts, same backend.

API-first ensures the platform isn't locked to any particular interface paradigm.`,
    },
    {
      heading: 'Interface Types',
      content: `The Convex backend provides three function types:

**Queries (Read)**
Real-time reactive data access. Subscribe to queries and receive updates automatically.
- Paddock status and observations
- Plan history and details
- Farm configuration

**Mutations (Write)**
State changes to the database.
- Record grazing events
- Approve/reject plans
- Update settings

**Actions (Compute)**
Server-side operations that may involve external services.
- Generate daily plans (invokes AI)
- Refresh observations (fetches satellite data)
- Send notifications

Each type serves a specific purpose in the data flow.`,
    },
    {
      heading: 'Authentication Model',
      content: `Access control follows standard patterns:

**User authentication:**
- Clerk handles identity management
- JWT tokens for session management
- Development mode available for testing

**Farm association:**
Users are associated with farms. Queries and mutations filter by farm ownership.

**API keys:**
For automated integrations, API keys can be generated (if enabled).

See [Authentication](/docs/platform-interfaces/auth) for implementation details.`,
    },
    {
      heading: 'Rate Limits and Quotas',
      content: `Current limits (subject to change):

**Query rate:**
No explicit rate limit; Convex handles scaling. Reasonable use expected.

**Mutation rate:**
Standard transaction limits apply. Batch operations where appropriate.

**Action invocation:**
AI-backed actions have higher latency and cost. Generate plans thoughtfully, not repeatedly.

**Storage:**
Observation history, plans, and events accumulate. Long-term storage limits may apply by tier.

These limits protect platform stability and ensure fair resource allocation.`,
    },
    {
      heading: 'Getting Started with APIs',
      content: `For developers integrating with the platform:

**1. Authentication**
Set up user authentication or obtain API credentials.

**2. Explore endpoints**
Review available queries, mutations, and actions in the API reference.

**3. Start with queries**
Read data before attempting writes. Understand the data model.

**4. Test in development**
Use development mode and sample data before connecting to production farms.

**5. Handle errors**
Implement proper error handling for failed requests and retries.

The typed API provides IntelliSense and compile-time checking when using TypeScript.`,
    },
    {
      heading: 'Convex Client Libraries',
      content: `Official Convex clients available for:

**JavaScript/TypeScript:**
Full support with real-time subscriptions and type generation.

**React:**
Hooks for queries, mutations, and actions with automatic re-rendering.

**React Native:**
Mobile app support with the same API.

**Other platforms:**
HTTP API available for languages without native clients.

The TypeScript experience is first-class, with generated types from the schema.`,
    },
  ],
  relatedArticles: [
    '/docs/platform-interfaces/auth',
    '/docs/platform-interfaces/endpoints',
    '/docs/system-architecture/overview',
  ],
}
