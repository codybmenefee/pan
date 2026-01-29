import type { ArticleContent } from '../types'

export const auth: ArticleContent = {
  title: 'Authentication',
  description:
    'How authentication works in the platform. User identity, farm association, development mode, and security considerations for integrations.',
  sections: [
    {
      heading: 'Current Auth Model',
      content: `The platform uses Convex identity with Clerk as the authentication provider:

**Production mode:**
- Clerk handles user registration and login
- JWT tokens establish sessions
- Convex validates tokens on each request

**Development mode:**
- Set \`VITE_DEV_AUTH=true\`
- No authentication required
- Useful for local development and testing

This model provides standard web authentication with minimal configuration.`,
    },
    {
      heading: 'User-Farm Association',
      content: `Users are linked to farms through the users table:`,
      codeExample: {
        language: 'typescript',
        filename: 'schema.ts',
        code: `users: defineTable({
  externalId: v.string(),      // Clerk user ID
  farmExternalId: v.string(),  // Associated farm
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
}).index('by_externalId', ['externalId'])`,
      },
    },
    {
      heading: 'Accessing User Identity',
      content: `In Convex functions, access the authenticated user:`,
      codeExample: {
        language: 'typescript',
        code: `// In a query or mutation handler
const identity = await ctx.auth.getUserIdentity()

if (!identity) {
  // Not authenticated
  throw new Error('Authentication required')
}

// identity.subject contains the Clerk user ID
const userId = identity.subject

// Look up user record
const user = await ctx.db
  .query('users')
  .withIndex('by_externalId', (q) => q.eq('externalId', userId))
  .first()

// user.farmExternalId provides farm context`,
      },
    },
    {
      heading: 'Development Mode Authentication',
      content: `For local development without Clerk:

**Enable dev auth:**`,
      codeExample: {
        language: 'bash',
        filename: '.env.local',
        code: `VITE_DEV_AUTH=true`,
      },
    },
    {
      heading: 'Dev Auth Behavior',
      content: `**Behavior:**
- No login UI required
- Default user identity assumed
- Farm association uses default farm

**Limitations:**
- Single user only
- No role differentiation
- Not suitable for production

**When to use:**
- Local development
- Testing and debugging
- Demos without account setup`,
    },
    {
      heading: 'API Key Management',
      content: `For programmatic access without interactive login:

**Current status:**
API keys are not yet implemented. Integrations currently require:
- Authenticated user sessions
- Or development mode for testing

**Planned approach:**
- Generate API keys per farm
- Keys provide scoped access (read-only, full access)
- Revocation and rotation supported
- Usage logging for audit

Check documentation updates for API key availability.`,
    },
    {
      heading: 'Security Considerations',
      content: `When building integrations:

**Protect credentials:**
- Never expose API keys in client-side code
- Use environment variables for sensitive values
- Rotate keys periodically

**Validate input:**
- Sanitize data before database operations
- Validate geometry is within expected bounds
- Check numeric ranges are reasonable

**Audit access:**
- Log significant operations
- Monitor for unusual patterns
- Implement alerting for suspicious activity

**HTTPS only:**
All production traffic must use HTTPS. The Convex backend enforces this.

**Minimal permissions:**
Request only the access level needed. Read-only where writes aren't required.`,
    },
    {
      heading: 'Multi-Farm Access',
      content: `Current model: one user, one farm.

**Future consideration:**
- Users managing multiple farms
- Farm managers vs. owners
- Consultant access across operations

The schema supports extending to multi-farm access by modifying user-farm relationships. This is not yet implemented.`,
    },
  ],
  relatedArticles: [
    '/docs/platform-interfaces/overview',
    '/docs/platform-interfaces/endpoints',
    '/docs/getting-started/installation',
  ],
}
