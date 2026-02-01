import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import { useAppAuth } from '@/lib/auth'
import { clerkAppearance } from '@/lib/auth/clerkTheme'
import { useEffect } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: SignInPage,
})

function SignInPage() {
  const { redirect: redirectTo } = useSearch({ from: '/sign-in' })
  const { isSignedIn, isDevAuth } = useAppAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isSignedIn || isDevAuth) {
      navigate({ to: redirectTo || '/app' })
    }
  }, [isSignedIn, isDevAuth, redirectTo, navigate])

  // In dev mode, don't render Clerk's SignIn component (no ClerkProvider)
  // The useEffect above will redirect to /app
  if (isDevAuth) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      {/* OpenPasture branding header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          OpenPasture
        </h1>
        <p className="mt-2 text-muted-foreground">
          AI-powered grazing recommendations
        </p>
      </div>

      <SignIn
        routing="hash"
        forceRedirectUrl={redirectTo || '/app'}
        appearance={clerkAppearance}
      />
    </div>
  )
}
