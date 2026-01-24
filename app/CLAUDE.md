# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grazing Intelligence Demo - an AI-powered decision support system that translates satellite-derived vegetation data into daily grazing recommendations. The core experience is a "Morning Farm Brief" that recommends which paddock to graze today.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
npx convex dev       # Start Convex backend (run in separate terminal)

# Build & Lint
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
```

## Architecture

**Stack:** React 19 + TypeScript, TanStack Router (file-based), Tailwind CSS v4, Convex (serverless backend), Claude AI via @ai-sdk/anthropic

**Key directories:**
- `src/routes/` - TanStack Router file-based routes (auto-generates `routeTree.gen.ts`)
- `src/components/` - React components organized by feature (brief/, map/, analytics/, ui/)
- `src/lib/` - Utilities, types, hooks
- `convex/` - Serverless backend functions (queries, mutations, actions)

**Data flow:**
1. Frontend uses Convex hooks (`useQuery`, `useMutation`, `useAction`)
2. Convex functions read/write database
3. Agent actions invoke Claude for grazing recommendations

## Convex Patterns

**Function types:**
- `query` - Read-only database access, real-time reactive
- `mutation` - Database writes
- `action` - Async server operations (AI calls, external APIs)

**Agent entry point:** Always use `api.grazingAgentGateway.agentGateway` - never call `grazingAgentDirect` directly.

## Convex Bundler + Native Node Modules

**Rule:** Even with `"use node"` directive, the Convex bundler (esbuild) statically analyzes all `import` and `require` statements at build time. Packages with native Node.js dependencies will cause bundler errors like "No loader is configured for .node files".

**Why this happens:**
1. Convex uses esbuild to bundle all code
2. esbuild analyzes import/require statements even for Node.js targets
3. Native `.node` files can't be processed by any JS bundler
4. The `"use node"` directive only affects *runtime*, not build-time bundling

**Solution:** Use dynamic require that the bundler can't statically analyze:
```typescript
function dynamicRequire(moduleName: string): any {
  return new Function("moduleName", "return require(moduleName)")(moduleName)
}

// Usage:
const { initLogger } = dynamicRequire('braintrust')
const { BraintrustSpanProcessor } = dynamicRequire('@braintrust/otel')
```

**Affected packages:** `braintrust`, `@braintrust/otel`, and any package that transitively depends on `fsevents`, `chokidar`, `simple-git`, or other native addons (typically file watchers, git integrations, native crypto, some observability SDKs).

## Key Types

Domain types in `src/lib/types.ts`: `Plan`, `Paddock`, `Farm`, `Section`, `Observation`, `GrazingEvent`

## Environment Variables

Required for full functionality:
- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk auth (or use `VITE_DEV_AUTH=true` for dev mode)
- `BRAINTRUST_API_KEY` - Agent observability (optional, set in Convex dashboard)

## Generated Files (Do Not Edit)

- `convex/_generated/` - Convex API client
- `src/routeTree.gen.ts` - TanStack Router routes
