import type { ArticleContent } from '../types'

export const webhooks: ArticleContent = {
  title: 'Webhooks',
  description:
    'Push notifications for platform events. Webhook architecture, event types, payload formats, and security considerations. Note: Webhooks are currently in beta.',
  sections: [
    {
      heading: 'Webhook Architecture',
      content: `Webhooks enable external systems to receive notifications when events occur in the platform.

**Push model:**
Instead of polling for changes, your system receives HTTP POST requests when relevant events happen.

**Use cases:**
- Trigger downstream processing when plans are approved
- Update external systems when observations refresh
- Log events to external analytics
- Integrate with notification services

**Current status:**
Webhooks are in beta. The API may change based on feedback.`,
    },
    {
      heading: 'Event Types',
      content: `Available webhook events:

**plan_generated**
Triggered when a new daily plan is created by the AI.
- Fires once per day per farm
- Includes plan details and recommendation

**plan_approved**
Triggered when a farmer approves a plan.
- Includes approval timestamp and user
- Useful for triggering downstream actions

**plan_rejected**
Triggered when a farmer rejects a plan.
- Includes feedback if provided
- May indicate need for manual intervention

**observation_updated**
Triggered when new satellite observations are processed.
- May fire multiple times per day (batch updates)
- Includes affected paddocks

**settings_changed**
Triggered when farm settings are modified.
- Threshold changes, preferences updates
- Useful for audit logging`,
    },
    {
      heading: 'Payload Formats',
      content: `Webhook payloads follow a consistent structure:`,
      codeExample: {
        language: 'json',
        code: `{
  "event": "plan_approved",
  "timestamp": "2024-01-15T08:30:00Z",
  "farm": {
    "externalId": "farm-1",
    "name": "Demo Farm"
  },
  "data": {
    "planId": "plan_abc123",
    "date": "2024-01-15",
    "paddockExternalId": "paddock-3",
    "approvedBy": "user-456",
    "approvedAt": "2024-01-15T08:30:00Z"
  },
  "signature": "sha256=..."
}`,
      },
    },
    {
      heading: 'Plan Generated Payload',
      content: `**plan_generated** event data:`,
      codeExample: {
        language: 'json',
        code: `{
  "event": "plan_generated",
  "data": {
    "planId": "plan_abc123",
    "date": "2024-01-15",
    "paddockExternalId": "paddock-3",
    "paddockName": "North Field",
    "confidenceScore": 78,
    "reasoning": [
      "NDVI 0.45 exceeds threshold",
      "Rest period of 24 days is adequate"
    ],
    "sectionAreaHectares": 8.5
  }
}`,
      },
    },
    {
      heading: 'Observation Updated Payload',
      content: `**observation_updated** event data:`,
      codeExample: {
        language: 'json',
        code: `{
  "event": "observation_updated",
  "data": {
    "observationCount": 5,
    "paddocks": [
      {
        "externalId": "paddock-1",
        "ndviMean": 0.42,
        "date": "2024-01-14"
      },
      {
        "externalId": "paddock-2",
        "ndviMean": 0.38,
        "date": "2024-01-14"
      }
    ],
    "provider": "planet",
    "processedAt": "2024-01-15T06:00:00Z"
  }
}`,
      },
    },
    {
      heading: 'Retry Policies',
      content: `The platform retries failed webhook deliveries:

**Retry schedule:**
- First retry: 1 minute after failure
- Second retry: 5 minutes
- Third retry: 30 minutes
- Fourth retry: 2 hours
- Final retry: 24 hours

**Failure conditions:**
- HTTP 4xx or 5xx response
- Connection timeout (30 seconds)
- No response

**Success criteria:**
HTTP 2xx response within timeout.

**After exhaustion:**
Failed events are logged but not retried further. Check webhook logs for persistent failures.`,
    },
    {
      heading: 'Security: Signature Verification',
      content: `Verify webhook authenticity using the signature:`,
      codeExample: {
        language: 'typescript',
        code: `import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const payload = JSON.stringify(req.body)

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature')
  }

  // Process the webhook...
})`,
      },
    },
    {
      heading: 'Configuring Webhooks',
      content: `Webhook configuration (when available) includes:

**Endpoint URL:**
HTTPS URL that will receive POST requests.

**Secret:**
Shared secret for signature verification. Store securely.

**Events:**
Select which event types to receive.

**Active:**
Toggle to enable/disable without deleting configuration.

Configuration is managed through farm settings or the admin interface.`,
    },
    {
      heading: 'Best Practices',
      content: `For reliable webhook handling:

**Respond quickly:**
Return 2xx immediately, process asynchronously. Long processing may trigger timeouts.

**Handle duplicates:**
Retries may deliver the same event multiple times. Use event IDs for deduplication.

**Verify signatures:**
Always verify the signature before trusting the payload.

**Log events:**
Keep records of received webhooks for debugging.

**Monitor failures:**
Set up alerting for persistent delivery failures.

**Use HTTPS:**
Only HTTPS endpoints are supported. Ensure valid SSL certificates.`,
    },
  ],
  relatedArticles: [
    '/docs/platform-interfaces/overview',
    '/docs/platform-interfaces/endpoints',
    '/docs/integrations/fms',
  ],
}
