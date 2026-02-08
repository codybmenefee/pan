/**
 * Pure TypeScript AWS Signature V4 presigned URL generator.
 * Uses only Web Crypto API (crypto.subtle) -- no external dependencies.
 * Designed for Cloudflare R2 (region: "auto", service: "s3").
 */

const REGION = 'auto'
const SERVICE = 's3'
const DEFAULT_EXPIRES = 3600 // 1 hour

// --- Low-level crypto helpers ---

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return toHex(hash)
}

async function hmacSHA256(
  key: ArrayBuffer,
  message: string
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

async function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSHA256(
    new TextEncoder().encode('AWS4' + secretKey).buffer as ArrayBuffer,
    dateStamp
  )
  const kRegion = await hmacSHA256(kDate, region)
  const kService = await hmacSHA256(kRegion, service)
  return hmacSHA256(kService, 'aws4_request')
}

// --- URL encoding per AWS spec (RFC 3986, but "/" is encoded) ---

function uriEncode(str: string, encodeSlash = true): string {
  let encoded = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= 'a' && ch <= 'z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '_' ||
      ch === '-' ||
      ch === '~' ||
      ch === '.'
    ) {
      encoded += ch
    } else if (ch === '/' && !encodeSlash) {
      encoded += ch
    } else {
      const bytes = new TextEncoder().encode(ch)
      for (const b of bytes) {
        encoded += '%' + b.toString(16).toUpperCase().padStart(2, '0')
      }
    }
  }
  return encoded
}

// --- Main export ---

export interface PresignOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  expiresIn?: number // seconds, default 3600
}

/**
 * Generate a presigned GET URL for an R2 object.
 */
export async function presignR2Url(opts: PresignOptions): Promise<string> {
  const {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key,
    expiresIn = DEFAULT_EXPIRES,
  } = opts

  const host = `${accountId}.r2.cloudflarestorage.com`
  const canonicalUri = '/' + bucket + '/' + uriEncode(key, false)

  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const dateStamp = amzDate.slice(0, 8) // YYYYMMDD

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const credential = `${accessKeyId}/${credentialScope}`

  // Canonical query string (sorted)
  const queryParams: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', credential],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host'],
  ]
  queryParams.sort((a, b) => a[0].localeCompare(b[0]))

  const canonicalQueryString = queryParams
    .map(([k, v]) => `${uriEncode(k)}=${uriEncode(v)}`)
    .join('&')

  // Canonical headers
  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'

  // For presigned URLs, payload hash is always UNSIGNED-PAYLOAD
  const payloadHash = 'UNSIGNED-PAYLOAD'

  // Build canonical request
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  // String to sign
  const canonicalRequestHash = await sha256(canonicalRequest)
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n')

  // Derive signing key and sign
  const signingKey = await getSigningKey(
    secretAccessKey,
    dateStamp,
    REGION,
    SERVICE
  )
  const signatureBuffer = await hmacSHA256(signingKey, stringToSign)
  const signature = toHex(signatureBuffer)

  // Assemble URL
  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
}
