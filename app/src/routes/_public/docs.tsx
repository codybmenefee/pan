import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocsLayout } from '@/components/docs'

export const Route = createFileRoute('/_public/docs')({
  component: DocsLayoutRoute,
})

function DocsLayoutRoute() {
  return (
    <DocsLayout>
      <Outlet />
    </DocsLayout>
  )
}
