import { createFileRoute, Outlet } from '@tanstack/react-router'

function PublicLayout() {
  console.log('[_public] Rendering PublicLayout')
  return <Outlet />
}

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})
