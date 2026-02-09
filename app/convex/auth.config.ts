import type { AuthConfig } from 'convex/server'

function normalizeIssuerDomain(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

const issuerDomainRaw =
  process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL ?? ''
const issuerDomain = normalizeIssuerDomain(issuerDomainRaw)

if (!issuerDomain) {
  throw new Error(
    'Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAIN (or CLERK_FRONTEND_API_URL) in Convex environment variables.'
  )
}

export default {
  providers: [
    {
      domain: issuerDomain,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig
