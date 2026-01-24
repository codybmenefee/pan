import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import { useAppAuth } from '@/lib/auth'
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
      navigate({ to: redirectTo || '/' })
    }
  }, [isSignedIn, isDevAuth, redirectTo, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <SignIn routing="hash" afterSignInUrl={redirectTo || '/'} />
    </div>
  )
}
