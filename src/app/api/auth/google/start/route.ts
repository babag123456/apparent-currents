import { NextResponse } from 'next/server'

import {
  buildGoogleAuthUrl,
  createGoogleAuthState,
  getGoogleStateCookieName,
  isGoogleAuthConfigured,
  isTrustedOrigin,
} from '../../../../../lib/google-auth'

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured.' },
      { status: 500 },
    )
  }

  const origin = new URL(request.url).origin

  // Only proceed for allowlisted origins. This prevents a spoofed Host header from
  // influencing the OAuth redirect (the redirect target is always Google, but the
  // request-derived origin must still be trusted before it is used).
  if (!isTrustedOrigin(origin)) {
    return NextResponse.json({ error: 'Untrusted request origin.' }, { status: 400 })
  }

  const state = createGoogleAuthState()

  // The redirect target is built purely from constants + configured env (no request-derived
  // data), so it always points at Google's fixed auth endpoint. Set the one-time state cookie
  // directly on the redirect response so the Set-Cookie header is guaranteed to accompany the
  // 3xx (setting it via next/headers cookies() does not reliably attach to a separately-
  // constructed redirect response).
  const response = NextResponse.redirect(buildGoogleAuthUrl(state))

  response.cookies.set(getGoogleStateCookieName(), state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
  })

  return response
}
