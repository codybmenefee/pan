# OpenPasture App

Frontend for the Morning Farm Brief experience. Built with Vite, React, and TypeScript.

## Getting Started

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

## Environment

Required env vars (set in `app/.env.local`):

- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_DEV_AUTH=true` - bypass Clerk sign-in locally
- `VITE_CLERK_PUBLISHABLE_KEY` - required when `VITE_DEV_AUTH` is not set

## Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build for production
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

## Project Structure

- `src/components` - UI and feature components
- `src/data/mock` - mock data used by the UI
- `src/routes` - application routes (TanStack Router)
- `src/lib` - shared utilities, hooks, and types

## More

See the root [README](../README.md) for project overview and docs.
