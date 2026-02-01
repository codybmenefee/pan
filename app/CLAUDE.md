# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenPasture - an open-source AI-powered decision support system that translates satellite-derived vegetation data into daily grazing recommendations. The core experience is a "Morning Farm Brief" that recommends which paddock to graze today.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
npx convex dev       # Start Convex backend (run in separate terminal)

# Build & Lint
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
```

**Important:** Do NOT run `npm run dev` yourself. The dev server is already running and managed by the user.

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
- `VITE_PAYWALL_DISABLED` - Set to "true" to disable the subscription paywall (paywall is enabled by default)
- `BRAINTRUST_API_KEY` - Agent observability (optional, set in Convex dashboard)
- `BRAINTRUST_PROJECT_NAME` - Braintrust project name (optional, defaults to 'grazing-agent')

## Pre-Commit Checks (IMPORTANT)

**Before committing any code changes, ALWAYS run:**

```bash
npx tsc -b
```

This catches TypeScript errors that Vite's dev server ignores but will fail the Railway build:
- Unused variables, imports, and types (`noUnusedLocals`, `noUnusedParameters`)
- Type mismatches
- Missing type declarations

**Why this matters:** The `convex/_generated/api.d.ts` imports all Convex files, so TypeScript checks the entire `convex/` folder even when building just the frontend. Errors in `convex/*.ts` or `lib/*.ts` will fail the production build.

**Common issues to avoid:**
- Declaring variables you don't use (prefix with `_` or remove)
- Importing functions/types you don't use
- Adding new prop values without updating type definitions
- Using `process.env` in shared libs without type declarations

## Post-Push Deployment Verification

**After pushing commits to the `main` branch, ALWAYS verify successful deployment using the Railway skill:**

```
/railway-deployment
```

This checks deployment status, logs, and catches any build or runtime errors that may occur on Railway. Don't assume a push succeeded—verify it deployed correctly.

## Generated Files (Do Not Edit)

- `convex/_generated/` - Convex API client
- `src/routeTree.gen.ts` - TanStack Router routes

## Browser Testing

**Always use the `agent-browser` skill** for browser automation and UI testing. Do NOT use Playwright MCP tools directly.

```bash
# Example workflow
agent-browser open http://localhost:5173
agent-browser snapshot -i          # Get interactive elements with refs
agent-browser click @e1            # Click element by ref
agent-browser screenshot test.png  # Capture screenshot
```

Note: The app requires authentication. Set `VITE_DEV_AUTH=true` in `.env.local` to bypass Clerk auth during development.

## Style Guidelines

**No emojis.** Never use emojis in code, comments, commit messages, PR descriptions, documentation, or any other output. This is a strict project rule.

## Design Principles

### Farmer-Configurable Decision Variables

**All variables used in grazing calculations must be configurable per farm with sensible defaults.** This allows farmers to fine-tune recommendations to their specific conditions, breeds, and management style.

This principle applies to:
- Animal unit (AU) conversion factors
- Daily consumption rates
- NDVI thresholds
- Rest period minimums
- Any future calculation parameters

When adding new calculation logic, always:
1. Define sensible defaults in `convex/seedData.ts`
2. Add configuration fields to `farmSettings` table
3. Expose settings in the UI via the Settings page
4. Document the default values and their meaning
