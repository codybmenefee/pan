import { createFileRoute, Navigate } from '@tanstack/react-router'

// Map functionality is now integrated into the main GIS view at /
// This route redirects for backwards compatibility
function MapRedirect() {
  return <Navigate to="/app" replace />
}

export const Route = createFileRoute('/app/map')({
  component: MapRedirect,
})
