import type { ArticleContent } from '../types'

export const overview: ArticleContent = {
  title: 'How the Platform Thinks',
  description:
    'High-level architecture of the grazing intelligence system: data flow from ingestion to recommendation, key design principles, and how components interact to produce daily briefings.',
  sections: [
    {
      heading: 'Pipeline Overview',
      content: `The platform processes information through four stages:

**1. Ingestion**
Data enters from satellite providers, weather services, and user input. Sources update on different cadences (daily satellite, hourly weather, event-driven user input).

**2. Normalization**
Raw data is validated, cleaned, and stored in a consistent format. Farm-specific thresholds and configurations are applied.

**3. Inference**
The AI agent analyzes normalized data, applies decision logic, and generates recommendations with reasoning.

**4. Presentation**
Recommendations are displayed to users for review, with supporting visualizations and documentation.

Each stage is designed to fail gracefully—problems in one component don't crash the entire system.`,
    },
    {
      heading: 'Why This Architecture',
      content: `Several design decisions shape the architecture:

**Separation of concerns**
Each component does one thing well. Data ingestion doesn't know about AI models. AI models don't know about UI rendering. This separation enables independent testing and evolution.

**API-first design**
The backend exposes all functionality through typed APIs. The web UI is one consumer; future integrations (mobile, hardware, third-party) use the same interfaces.

**Event-driven state**
Changes propagate through reactive queries. When data updates, dependent views update automatically. No manual refresh required.

**Explicit reasoning**
The AI doesn't just output decisions—it outputs reasoning. This makes the system auditable and enables feedback loops.`,
    },
    {
      heading: 'Data Flow Diagram',
      content: `The system architecture follows this flow:

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────┬─────────────┬─────────────┬───────────────────────┤
│  Satellite  │   Weather   │    User     │      Historical       │
│   (NDVI)    │   (Temp,    │  (Events,   │    (Past plans,       │
│             │   Precip)   │  Feedback)  │     observations)     │
└──────┬──────┴──────┬──────┴──────┬──────┴───────────┬───────────┘
       │             │             │                  │
       ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONVEX DATABASE                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │observations│  │  weather  │  │  grazing  │  │   plans   │    │
│  │           │  │  History  │  │  Events   │  │           │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT GATEWAY                               │
│  - Fetches farm context                                         │
│  - Assembles data for agent                                     │
│  - Routes to appropriate handler                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GRAZING AGENT                               │
│  - Analyzes paddock conditions                                  │
│  - Applies decision logic                                       │
│  - Generates section geometry                                   │
│  - Produces reasoning text                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PLAN                                     │
│  - Target paddock                                               │
│  - Section geometry                                             │
│  - Confidence score                                             │
│  - Reasoning array                                              │
│  - Status: pending → approved/rejected                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│  - Morning brief display                                        │
│  - Map visualization                                            │
│  - Approval/feedback controls                                   │
└─────────────────────────────────────────────────────────────────┘
\`\`\``,
    },
    {
      heading: 'Key Design Principles',
      content: `Three principles guide architectural decisions:

**Observability**
Every significant operation is logged. AI reasoning is captured and stored. Farmers can understand why recommendations were made.

**Correctability**
Humans can override any automated decision. Feedback mechanisms exist at multiple levels. Mistakes can be caught and corrected before causing harm.

**Adaptability**
The system evolves with new data sources, improved models, and changing requirements. Interfaces are versioned. Breaking changes are rare.`,
    },
    {
      heading: 'Technology Stack',
      content: `The platform is built on:

**Frontend**
- React 19 with TypeScript
- TanStack Router (file-based routing)
- Tailwind CSS for styling
- MapLibre GL for map rendering

**Backend**
- Convex (serverless database and functions)
- Queries for real-time reactive data
- Mutations for state changes
- Actions for external operations (AI calls)

**AI**
- Anthropic Claude for reasoning
- Tool-use pattern for structured outputs
- Braintrust for observability

**Data**
- Convex document database
- GeoJSON for spatial data
- Indexed queries for performance`,
    },
  ],
  relatedArticles: [
    '/docs/system-architecture/data-pipeline',
    '/docs/system-architecture/human-in-loop',
    '/docs/platform-interfaces/overview',
  ],
}
