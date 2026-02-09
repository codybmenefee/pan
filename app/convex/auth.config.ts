import { AuthConfig } from "convex/server";

const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN!;

export default {
  providers: [
    // Preferred path: Clerk "convex" JWT template with aud=convex.
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
    // Compatibility path: accept Clerk-issued JWTs without requiring aud=convex.
    // This keeps auth working while environments migrate to the convex template.
    {
      type: "customJwt",
      issuer: clerkIssuerDomain,
      jwks: `${clerkIssuerDomain}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
