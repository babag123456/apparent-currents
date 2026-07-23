import { createHmac } from 'crypto'

import configPromise from '@payload-config'
import { generatePayloadCookie, getPayload } from 'payload'

import { isGoogleEmailAllowed } from './security/googleAllowlist.ts'
import { createSecureOAuthState } from './security/oauth.ts'

type GoogleUserInfo = {
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  sub?: string
}

const GOOGLE_AUTH_COOKIE = 'google-oauth-state'
const GOOGLE_AUTH_SCOPE = ['openid', 'email', 'profile'].join(' ')

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || ''
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || ''
}

function getGoogleCallbackUrl(origin: string) {
  return process.env.GOOGLE_OAUTH_CALLBACK_URL || new URL('/api/auth/google/callback', origin).toString()
}

// Allowlist of origins this app is permitted to operate on. Derived from the configured
// OAuth callback URL (the canonical app origin) plus any explicit extras. Used to reject
// spoofed Host headers before a request-derived origin is ever used to build a redirect.
export function getTrustedOrigins(): string[] {
  const origins = new Set<string>()

  const callbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL
  if (callbackUrl) {
    try {
      origins.add(new URL(callbackUrl).origin)
    } catch {
      // Ignore an unparseable callback URL; a misconfigured value simply contributes nothing.
    }
  }

  for (const value of (process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS || '').split(',')) {
    const trimmed = value.trim()
    if (!trimmed) continue
    try {
      origins.add(new URL(trimmed).origin)
    } catch {
      // Skip malformed allowlist entries.
    }
  }

  return [...origins]
}

// Returns true only when `origin` is on the configured allowlist. If nothing is configured
// (no callback URL, no extras), no origin can be trusted and this returns false.
export function isTrustedOrigin(origin: string): boolean {
  return getTrustedOrigins().includes(origin)
}

function getGoogleAllowedEmails() {
  return (process.env.GOOGLE_ALLOWED_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function getGoogleAllowedDomain() {
  return (process.env.GOOGLE_ALLOWED_DOMAIN || '').trim().toLowerCase()
}

export function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret())
}

export function getGoogleStateCookieName() {
  return GOOGLE_AUTH_COOKIE
}

export function buildGoogleAuthUrl(origin: string, state: string) {
  const clientId = getGoogleClientId()

  if (!clientId) {
    throw new Error('Missing GOOGLE_CLIENT_ID.')
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', getGoogleCallbackUrl(origin))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GOOGLE_AUTH_SCOPE)
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')

  const allowedDomain = getGoogleAllowedDomain()
  if (allowedDomain) {
    url.searchParams.set('hd', allowedDomain)
  }

  return url.toString()
}

export function createGoogleAuthState() {
  return createSecureOAuthState()
}

function createDerivedGooglePassword(googleSub: string) {
  const secret = process.env.PAYLOAD_SECRET || ''

  if (!secret) {
    throw new Error('Missing PAYLOAD_SECRET.')
  }

  return createHmac('sha256', secret).update(`google:${googleSub}`).digest('hex')
}

export async function exchangeGoogleCodeForUser({
  code,
  origin,
}: {
  code: string
  origin: string
}): Promise<Required<Pick<GoogleUserInfo, 'email' | 'sub'>> & GoogleUserInfo> {
  const clientId = getGoogleClientId()
  const clientSecret = getGoogleClientSecret()

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getGoogleCallbackUrl(origin),
    }),
  })

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as
    | { access_token?: string; error?: string; error_description?: string }
    | null

  if (!tokenResponse.ok || !tokenPayload?.access_token) {
    throw new Error(
      `Google token exchange failed (${tokenResponse.status}). ${tokenPayload?.error_description || tokenPayload?.error || 'No access token returned.'}`,
    )
  }

  const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  })

  const userInfo = (await userInfoResponse.json().catch(() => null)) as GoogleUserInfo | null

  if (!userInfoResponse.ok || !userInfo?.sub || !userInfo?.email) {
    throw new Error(`Google userinfo lookup failed (${userInfoResponse.status}).`)
  }

  if (userInfo.email_verified !== true) {
    throw new Error('Google account email is not verified.')
  }

  return {
    ...userInfo,
    email: userInfo.email.toLowerCase(),
    sub: userInfo.sub,
  }
}

function assertGoogleUserAllowed(email: string) {
  const allowedEmails = getGoogleAllowedEmails()
  const allowedDomain = getGoogleAllowedDomain()

  if (!isGoogleEmailAllowed({ allowedDomain, allowedEmails, email })) {
    throw new Error(
      'Google login is not permitted for this account. Set GOOGLE_ALLOWED_EMAILS or GOOGLE_ALLOWED_DOMAIN to explicitly allow it.',
    )
  }
}

type UserRecord = {
  email: string
  googleSub?: null | string
  id: number | string
  name?: null | string
}

export async function loginOrProvisionGoogleUser({
  email,
  googleSub,
  name,
}: {
  email: string
  googleSub: string
  name?: string
}) {
  assertGoogleUserAllowed(email)

  const payload = await getPayload({ config: configPromise })
  const password = createDerivedGooglePassword(googleSub)

  const byGoogle = await payload.find({
    collection: 'users',
    where: { googleSub: { equals: googleSub } },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  let user = (byGoogle.docs[0] as UserRecord | undefined) ?? null

  if (!user) {
    const byEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    user = (byEmail.docs[0] as UserRecord | undefined) ?? null
  }

  if (!user) {
    user = (await payload.create({
      collection: 'users',
      data: {
        email,
        googleSub,
        name,
        password,
      },
      depth: 0,
      overrideAccess: true,
    })) as UserRecord
  } else {
    user = (await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        email,
        googleSub,
        name: name || user.name || undefined,
        password,
      },
      depth: 0,
      overrideAccess: true,
    })) as UserRecord
  }

  const loginResult = await payload.login({
    collection: 'users',
    data: {
      email,
      password,
    },
    depth: 0,
    overrideAccess: true,
  })

  const collection = payload.collections.users
  const authConfig = collection?.config?.auth

  if (!authConfig) {
    throw new Error('Users collection auth is not configured.')
  }

  if (!loginResult.token) {
    throw new Error('Payload login did not return a token for the Google-authenticated user.')
  }

  const cookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix: payload.config.cookiePrefix,
    token: loginResult.token,
  })

  return { cookie }
}
