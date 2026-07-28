import { createSign } from 'crypto'

import { loadAwardKitEnv } from '../loadEnv.ts'

loadAwardKitEnv()

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const JWT_BEARER_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer'
const SLIDES_SCOPE = 'https://www.googleapis.com/auth/presentations.readonly'
// Google access tokens live for ~3600s. Refresh a little early so a token is
// never used within its final minute.
const EXPIRY_SKEW_SECONDS = 60

type ServiceAccountCredentials = {
  clientEmail: string
  privateKey: string
}

type CachedToken = {
  accessToken: string
  expiresAtMs: number
}

let cachedToken: CachedToken | null = null

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function normalisePrivateKey(value: string): string {
  // Env files store PEM newlines as the literal characters "\n"; restore them.
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value
}

export function readGoogleSlidesCredentials(): ServiceAccountCredentials | null {
  const rawJson = process.env.GOOGLE_SLIDES_CREDENTIALS_JSON?.trim()
  if (rawJson) {
    try {
      const decoded = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8')
      const parsed = JSON.parse(decoded) as { client_email?: unknown; private_key?: unknown }
      if (typeof parsed.client_email === 'string' && typeof parsed.private_key === 'string') {
        return { clientEmail: parsed.client_email, privateKey: normalisePrivateKey(parsed.private_key) }
      }
    } catch {
      return null
    }
    return null
  }

  const clientEmail = process.env.GOOGLE_SLIDES_CLIENT_EMAIL?.trim()
  const privateKey = process.env.GOOGLE_SLIDES_PRIVATE_KEY?.trim()
  if (clientEmail && privateKey) {
    return { clientEmail, privateKey: normalisePrivateKey(privateKey) }
  }

  return null
}

export function isGoogleSlidesConfigured(): boolean {
  return readGoogleSlidesCredentials() !== null
}

function signServiceAccountAssertion(credentials: ServiceAccountCredentials, nowSeconds: number): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64Url(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: SLIDES_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  )
  const signingInput = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(signingInput).sign(credentials.privateKey)
  return `${signingInput}.${base64Url(signature)}`
}

/**
 * Returns a cached service-account access token for the read-only Slides scope,
 * minting a fresh one when the cache is empty or close to expiry.
 *
 * @param now Injectable clock for tests.
 */
export async function getGoogleSlidesAccessToken({
  fetchImpl = fetch,
  now = () => Date.now(),
}: {
  fetchImpl?: typeof fetch
  now?: () => number
} = {}): Promise<string> {
  const credentials = readGoogleSlidesCredentials()
  if (!credentials) {
    throw new Error(
      'Google Slides service account is not configured. Set GOOGLE_SLIDES_CREDENTIALS_JSON or GOOGLE_SLIDES_CLIENT_EMAIL and GOOGLE_SLIDES_PRIVATE_KEY.',
    )
  }

  const nowMs = now()
  if (cachedToken && cachedToken.expiresAtMs > nowMs) {
    return cachedToken.accessToken
  }

  const nowSeconds = Math.floor(nowMs / 1000)
  const assertion = signServiceAccountAssertion(credentials, nowSeconds)
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: JWT_BEARER_GRANT, assertion }),
  })

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string; error_description?: string }
    | null

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `Google service-account token exchange failed (${response.status}). ${payload?.error_description || payload?.error || 'No access token returned.'}`,
    )
  }

  const expiresInSeconds = typeof payload.expires_in === 'number' ? payload.expires_in : 3600
  cachedToken = {
    accessToken: payload.access_token,
    expiresAtMs: nowMs + Math.max(0, expiresInSeconds - EXPIRY_SKEW_SECONDS) * 1000,
  }
  return cachedToken.accessToken
}

/** Test-only helper to clear the module-level token cache. */
export function resetGoogleSlidesTokenCacheForTests(): void {
  cachedToken = null
}
