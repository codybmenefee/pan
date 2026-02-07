# Architecture Migration Plan

## Overview

This document defines the target architecture, migration path, and implementation phases for the Grazing Intelligence platform. The goal is to build an **agentic farming platform** that stores satellite and farmer-collected data, analyzes it, and makes intelligent livestock movement recommendations.

---

## Guiding Principles

1. **AOI-first**: All satellite data is clipped, indexed, and cached only to farm boundaries
2. **Shared data substrate**: What the farmer sees = what the agent reasons over
3. **Semi-autonomous agent**: Agent executes in background, reports when done or requests approval
4. **Farm as organization**: Multi-tenant architecture with team support
5. **Trust through transparency**: AI recommendations always traceable to visual data
6. **Braintrust observability**: All agent traffic logged for debugging and fine-tuning

---

## Core Domain Objects

### Farms & Organizations

```
Clerk Organization
    │
    ├── Farm (geographic + operational unit)
    │   ├── Pastures
    │   ├── Zones (sub-pasture areas)
    │   ├── Observations (satellite + farmer)
    │   ├── Plans (daily grazing recommendations)
    │   └── Settings (farm-wide + per-pasture overrides)
    │
    └── Members
        ├── Owner (full access)
        ├── Manager (edit + approve)
        └── Viewer (read only)
```

### Farmer Observations (Semantic, Unstructured)

Farmer-provided qualitative data stored for agent context:

| Field | Type | Description |
|-------|------|-------------|
| `farmId` | `id('farms')` | Reference to farm |
| `authorId` | `id('users')` | Author (from Clerk) |
| `level` | `'farm' \| 'pasture' \| 'zone'` | Granularity of observation |
| `targetId` | `string` | ID of target (pastureId, zoneId, or farmId) |
| `content` | `string` | Unstructured text |
| `tags` | `string[]` | Optional tags for filtering |
| `createdAt` | `string` | ISO timestamp |

### Sub-Pasture Zones

```typescript
zones: defineTable({
  pastureId: v.id('pastures'),
  name: v.string(),
  type: v.union('water', 'shade', 'feeding', 'mineral', 'other'),
  geometry: polygonFeature,
  metadata: v.optional(v.any()),
})
```

---

## Agent Architecture

### Trigger Types

The agent is invoked via triggers that assemble context differently:

| Trigger | Source | Context Assembled |
|---------|--------|-------------------|
| `morning_brief` | Daily cron (6 AM) | Overnight weather + latest satellite + farmer notes + yesterday's plan status |
| `observation_refresh` | Manual button | Latest satellite pass + farmer notes |
| `weather_alert` | External API | Forecast + affected pastures + recommended actions |
| `plan_execution` | User approval | Executed plan status + results + feedback request |

### Context Assembly Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INVOKES AGENT                       │
│                    (cron or button click)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 FETCH USER CONTEXT                           │
│  ┌──────────────┐  ┌──────────────────────┐                 │
│  │ Clerk Auth   │→ │ User + Farm + Team   │                 │
│  └──────────────┘  └──────────────────────┘                 │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Farm: Geometry, Settings, Team Members, Demo Status  │   │
│  │ Pastures: Geometry, Status, History, Zones           │   │
│  │ Observations: Satellite (latest), Farmer (recent 5)  │   │
│  │ Plans: Today's Plan, History, Feedback               │   │
│  │ Weather: Current + 7-day forecast                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ASSEMBLE PROMPT (Braintrust Traced)             │
│  ┌──────────────┐  ┌────────────────────────────────────┐   │
│  │ System Prompt│→ │ Agent Persona + Core Instructions  │   │
│  └──────────────┘  └────────────────────────────────────┘   │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌──────────────┐  ┌────────────────────────────────────┐   │
│  │Event Prompt  │→ │ Trigger-specific instructions      │   │
│  └──────────────┘  │ "For morning_brief: Summarize      │   │
│         │          │  overnight changes, recommend       │   │
│         │          │  today's moves with confidence"     │   │
│         │          └────────────────────────────────────┘   │
│         │                      │                             │
│         │                      ▼                             │
│         │          ┌───────────────────────────────┐         │
│         │          │ Farm Data + Event Data        │         │
│         │          │ (auth-controlled per user)    │         │
│         │          └───────────────────────────────┘         │
│         │                      │                             │
│         │                      ▼                             │
│         │          ┌───────────────────────────────┐         │
│         │          │ Available Tools + Meta-Tools  │         │
│         └──────────┴───────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EXECUTE + LOG TO BRAINTRUST                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ All prompt tokens + tool calls + responses logged    │   │
│  │ Structured for: debugging, fine-tuning, compliance   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Agent Tools

| Category | Tools | Purpose |
|----------|-------|---------|
| Data fetch | `getFarmGeometry`, `getPastureStatus`, `getRecentObservations`, `getWeather` | Retrieve farm state |
| Action | `createPlan`, `updatePastureSettings`, `requestVirtualFence` | Modify farm state |
| Meta | `getAvailableTools`, `getAgentMemory`, `explainReasoning` | Agent self-awareness |

### Agent Gateway (Custom Lightweight)

A middleware layer for control and observability:

```typescript
// app/api/agent/route.ts
export async function POST(request: Request) {
  const body = await request.json()

  // 1. Auth check (Clerk)
  const user = await auth.getUser(body.userId)
  if (!user.canAccessFarm(body.farmId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // 2. Rate limiting (Upstash Redis or Clerk limits)
  if (await rateLimit.check(body.userId)) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  // 3. Context assembly (farm data, observations, farmer notes)
  const context = await assembleContext(body.trigger, body.farmId)

  // 4. Log to Braintrust BEFORE calling agent
  const traceId = await braintrust.startTrace({
    userId: body.userId,
    farmId: body.farmId,
    trigger: body.trigger
  })

  // 5. Call agent with tools
  const result = await agent.complete({
    messages: context.messages,
    tools: availableTools,
    maxSteps: 10,
  })

  // 6. Log response
  await braintrust.endTrace(traceId, result)

  return Response.json(result)
}
```

**Responsibilities:**
- Authentication and authorization
- Rate limiting
- Context assembly from Convex
- Braintrust logging for all prompts and tool calls
- Error handling with 3-retry exponential backoff

---

## Data Architecture

### Settings Hierarchy

```typescript
// Farm-level defaults
farmSettings: {
  minNDVIThreshold: 0.4,
  minRestPeriodDays: 21,
  defaultPaddockPct: 0.20,
  // Per-pasture overrides stored in pasture record
}

// Per-pasture overrides
pastures: {
  // ... other fields
  overrideMinNDVIThreshold: 0.35,  // Override for this pasture
  overrideMinRestPeriodDays: 28,   // Override for this pasture
}
```

### Observations

| Type | Source | Storage |
|------|--------|---------|
| Satellite | Sentinel-2, PlanetScope | `observations` table (per-pasture NDVI stats) |
| Farmer | Manual entry | `farmerObservations` table (unstructured text) |

---

## Integrations

| Integration | Phase | Approach |
|-------------|-------|----------|
| Weather | Phase 1 | Open-Meteo API (free, no key required) |
| Farm Management | Phase 1 | Import/export CSV/GeoJSON |
| Collars | Phase 3 | Partner-specific SDKs when available |
| Market/Financial | Future | Webhooks to external systems |
| Braintrust | Phase 1 | All agent traffic logging |

---

## Migration Plan (3 Phases)

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Connect satellite pipeline to Convex, build agent gateway, launch Demo Farm

#### 1.1 Data Model Extensions

| File | Change |
|------|--------|
| `app/convex/schema.ts` | Add `farmerObservations` table |
| `app/convex/schema.ts` | Add `zones` table (sub-pasture) |
| `app/convex/schema.ts` | Add settings overrides pattern |
| `app/convex/schema.ts` | Add `weatherHistory` table |

#### 1.2 Pipeline Integration

| File | Change |
|------|--------|
| `src/ingestion/pipeline.py` | Connect Convex writer (replace JSON output) |
| `src/ingestion/writer.py` | New: Convex writer functions |
| `src/ingestion/weather.py` | New: Open-Meteo integration |
| Railway | Add cron job: `0 6 * * * python pipeline.py --all-farms` |

#### 1.3 Agent Gateway

| File | Change |
|------|--------|
| `app/api/agent/route.ts` | New: Agent gateway endpoint |
| `app/lib/agent/context.ts` | New: Context assembly logic |
| `app/lib/agent/triggers.ts` | New: Trigger definitions |
| `app/lib/braintrust.ts` | New: Braintrust integration |
| `app/convex/grazingAgent*.ts` | Refactor to use gateway |

#### 1.4 Demo Farm

| File | Change |
|------|--------|
| `app/convex/seedData.ts` | Pre-seeded farm with sample data |
| `app/convex/seedData.ts` | Sample farmer observations ("grass looking good in north pasture") |
| `app/convex/seedData.ts` | Sample weather history |
| `app/src/routes/demo.tsx` | New: Demo farm exploration UI |

#### 1.5 Frontend Foundations

| File | Change |
|------|--------|
| `app/src/components/observations/FarmerObservationInput.tsx` | New: Input form |
| `app/src/lib/convex/useFarmerObservations.ts` | New: Query hooks |
| `app/src/components/farm/FarmToggle.tsx` | New: Switch between Demo and My Farm |

**Phase 1 Deliverables:**
- [ ] Automated daily satellite pipeline writing to Convex
- [ ] Farmer observation input form
- [ ] Agent gateway with auth, rate limiting, Braintrust logging
- [ ] Morning brief trigger (daily cron)
- [ ] Demo farm pre-seeded for new users
- [ ] All existing pasture drawing/editing preserved

---

### Phase 2: Multi-Farm + Zones + Charts (Weeks 5-8)

**Goal:** Team support, sub-pasture zones, time-series analytics

#### 2.1 Multi-Tenancy

| File | Change |
|------|--------|
| `app/convex/schema.ts` | Add `organizations` table |
| `app/convex/schema.ts` | Update `users` table for org membership |
| `app/convex/organizations.ts` | New: Org CRUD and membership |
| `app/src/components/team/MemberList.tsx` | New: Team management UI |
| Clerk | Configure organization support |

#### 2.2 Zones

| File | Change |
|------|--------|
| `app/convex/zones.ts` | New: Zone CRUD |
| `app/src/components/map/FarmMap.tsx` | Render zones on map |
| `app/src/components/zones/ZoneEditor.tsx` | New: Zone editing UI |
| `app/lib/convex/useZones.ts` | New: Query hooks |

#### 2.3 Analytics Charts

| File | Change |
|------|--------|
| `app/src/components/charts/NdviTimeSeries.tsx` | New: Per-pasture NDVI trends |
| `app/src/components/charts/PastureStatusChart.tsx` | New: Status distribution |
| `app/src/components/charts/WeatherChart.tsx` | New: Weather overlay |
| `app/src/routes/analytics.tsx` | New: Analytics dashboard |

#### 2.4 Observation Timeline

| File | Change |
|------|--------|
| `app/src/components/map/ObservationSelector.tsx` | New: Date picker |
| `app/src/components/map/FarmMap.tsx` | Support observation date parameter |
| `app/src/lib/convex/useObservations.ts` | Add date filtering |

**Phase 2 Deliverables:**
- [ ] Organizations (farms) with team members
- [ ] Sub-pasture zones (water, shade, feeding areas)
- [ ] NDVI time-series charts per pasture
- [ ] Observation timeline selector with cloud-free indicators
- [ ] Demo Farm continues to work

---

### Phase 3: Weather + Mobile + Virtual Fence (Weeks 9-12)

**Goal:** Weather integration, mobile optimization, virtual fence output

#### 3.1 Weather Integration

| File | Change |
|------|--------|
| `app/lib/weather.ts` | Open-Meteo API client |
| `app/convex/weather.ts` | Weather table + queries |
| `app/src/components/weather/WeatherWidget.tsx` | New: Current + forecast |
| `app/src/routes/_index.tsx` | Show weather on dashboard |

#### 3.2 Mobile Optimization

| File | Change |
|------|--------|
| `app/src/components/map/MobileMap.tsx` | New: Touch-optimized map |
| `app/src/components/observations/MobileObservationInput.tsx` | New: Voice + quick entry |
| `app/src/routes/mobile.tsx` | New: Mobile-first route |
| Responsive CSS | Optimize for field use |

#### 3.3 Virtual Fence Output

| File | Change |
|------|--------|
| `app/lib/export/virtualFence.ts` | New: Export format generators |
| `app/src/components/plan/VirtualFenceExport.tsx` | New: Export UI |
| `app/convex/plans.ts` | Store virtual fence geometry |

#### 3.4 Agent Enhancements

| File | Change |
|------|--------|
| `app/lib/agent/triggers.ts` | Add `weather_alert` trigger |
| `app/lib/agent/tools.ts` | Add weather-aware tools |
| `app/src/components/brief/MorningBrief.tsx` | Enhanced with weather |

**Phase 3 Deliverables:**
- [ ] Weather integration (current + 7-day forecast)
- [ ] Mobile-optimized UI for field work
- [ ] Virtual fence export (GeoJSON for collar providers)
- [ ] Weather alert trigger for agent
- [ ] All features working together

---

## Preserved: Pasture Drawing Functionality

The existing pasture drawing and editing implementation is **fully preserved** across all phases:

| Feature | Location | Status |
|---------|----------|--------|
| Polygon Draw Tool | `createDraftSquare`, Mapbox Draw | ✓ Retained |
| Vertex Editing | `FarmMap.tsx` lines 1000-1085 | ✓ Retained |
| Multi-Selection | `selectedFeatureIds` array | ✓ Retained |
| Save/Cancel/Undo | `DrawingToolbar` + Convex mutations | ✓ Retained |
| Geometry Validation | `clipPolygonToPolygon` | ✓ Retained |
| Paddock Rendering | AI-generated grazing paddocks | ✓ Retained |

---

## Key Files by Phase

### Phase 1

```
app/
├── convex/
│   ├── schema.ts              # Add tables
│   ├── farmerObservations.ts  # New CRUD
│   └── zones.ts               # New (placeholder)
├── api/
│   └── agent/
│       └── route.ts           # New: Agent gateway
├── lib/
│   ├── agent/
│   │   ├── context.ts         # New: Context assembly
│   │   └── triggers.ts        # New: Trigger definitions
│   ├── braintrust.ts          # New: Logging
│   └── convex/
│       └── useFarmerObservations.ts  # New hooks
└── src/
    ├── components/
    │   └── observations/
    │       └── FarmerObservationInput.tsx  # New
    └── routes/
        └── demo.tsx           # New: Demo farm

src/
└── ingestion/
    ├── pipeline.py            # Connect Convex writer
    ├── writer.py              # New: Convex writer
    └── weather.py             # New: Open-Meteo
```

### Phase 2

```
app/
├── convex/
│   ├── organizations.ts       # New: Multi-tenant
│   └── zones.ts               # Implement
├── lib/
│   └── convex/
│       └── useZones.ts        # New hooks
└── src/
    ├── components/
    │   ├── charts/
    │   │   ├── NdviTimeSeries.tsx    # New
    │   │   ├── PastureStatusChart.tsx  # New
    │   │   └── WeatherChart.tsx      # New
    │   ├── map/
    │   │   └── ObservationSelector.tsx  # New
    │   ├── team/
    │   │   └── MemberList.tsx        # New
    │   └── zones/
    │       └── ZoneEditor.tsx        # New
    └── routes/
        ├── analytics.ts        # New: Dashboard
        └── mobile.tsx          # New: Mobile route
```

### Phase 3

```
app/
├── lib/
│   ├── weather.ts             # New: Weather API client
│   └── export/
│       └── virtualFence.ts    # New: Export formats
└── src/
    ├── components/
    │   ├── weather/
    │   │   └── WeatherWidget.tsx      # New
    │   ├── map/
    │   │   └── MobileMap.tsx          # New
    │   ├── observations/
    │   │   └── MobileObservationInput.tsx  # New
    │   └── plan/
    │       └── VirtualFenceExport.tsx  # New
    └── routes/
        └── mobile.tsx          # Enhance
```

---

## Rollout Checklist

### Before Phase 1

- [ ] Braintrust account and API key
- [ ] Open-Meteo API documentation reviewed
- [ ] Clerk organization support configured
- [ ] Railway cron job scheduled

### Before Phase 2

- [ ] Phase 1 deliverables tested
- [ ] Demo farm user flow validated
- [ ] Chart library selected (recharts or visx)
- [ ] Zone types finalized

### Before Phase 3

- [ ] Phase 2 deliverables tested
- [ ] Mobile design reviewed on actual devices
- [ ] Virtual fence export formats validated with partner
- [ ] Weather alert thresholds configured

---

## Success Metrics

### Phase 1 Success

- [ ] Daily pipeline runs without manual intervention
- [ ] Farmer can enter observations
- [ ] Agent generates morning brief automatically
- [ ] All agent runs logged to Braintrust
- [ ] New users see Demo Farm on first sign-up
- [ ] No regressions in pasture editing

### Phase 2 Success

- [ ] Users can create multiple farms
- [ ] Team members can collaborate
- [ ] Zones render correctly on map
- [ ] Charts show meaningful NDVI trends
- [ ] Observation timeline works

### Phase 3 Success

- [ ] Weather displays correctly
- [ ] Mobile UI works in field conditions
- [ ] Virtual fence exports are valid
- [ ] Agent responds to weather alerts
- [ ] End-to-end flow tested by real farmers

---

## Appendix: Farmer Observation UX

### Input Form Fields

| Field | Type | Required? |
|-------|------|-----------|
| Level | Radio: Farm / Pasture / Zone | Yes |
| Target | Dropdown (based on level) | Yes |
| Content | Textarea | Yes |
| Tags | Multi-select or freeform | No |

### Example Agent Prompt with Farmer Observations

```
SYSTEM: You are a grazing intelligence agent for Hillcrest Station.

FARM DATA:
- 7 pastures, 320 hectares total
- Current weather: 22°C, 0.2mm rain overnight
- NDVI range: 0.32 (Pasture G) to 0.61 (Pasture A)

FARMER OBSERVATIONS (last 5):
- "Water trough in Pasture B is leaking, fixed yesterday" - 2024-01-20
- "Grass looking good in north pasture" - 2024-01-19  [Agent: This refers to Pasture A]
- "Cattle seem to be favoring the shade zone in Pasture C" - 2024-01-18
- "Noticed some weeds near the fence line in Pasture E" - 2024-01-17
- "Lime spread on Pasture D last week" - 2024-01-15

TRIGGER: morning_brief

INSTRUCTIONS:
Summarize overnight changes, recommend today's grazing plan with confidence score,
and reference visible evidence (NDVI layer, weather, farmer notes).
```

---

## Appendix: Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TypeScript |
| State | TanStack Query + TanStack Router |
| Backend | Convex (serverless functions) |
| Auth | Clerk (with Organizations) |
| Maps | MapLibre GL + Mapbox Draw |
| Satellite | Sentinel-2 (MPC) + PlanetScope |
| Agent | Anthropic Claude + Vercel Agent SDK patterns |
| Logging | Braintrust (all agent traffic) |
| Weather | Open-Meteo API |
| Deployment | Railway (cron + app) + Vercel (API routes) |
| Storage | Convex (document) + S3/R2 (COG tiles) |
