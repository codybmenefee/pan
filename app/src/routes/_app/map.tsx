import { createFileRoute, Navigate } from '@tanstack/react-router'

// Map functionality is now integrated into the main GIS view at /
// This route redirects for backwards compatibility
function MapRedirect() {
  return <Navigate to="/" replace />
}

export const Route = createFileRoute('/_app/map')({
  component: MapRedirect,
})
