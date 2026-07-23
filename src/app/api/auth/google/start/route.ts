import { NextResponse } from 'next/server'

import {
  buildGoogleAuthUrl,
  createGoogleAuthState,
  getGoogleStateCookieName,
  isGoogleAuthConfigured,
} from '../../../../../lib/google-auth'

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured.' },
      { status: 500 },
    )
  }

  const origin = new URL(request.url).origin
  const state = createGoogleAuthState()

  // Set the one-time state cookie directly on the redirect response so the Set-Cookie
  // header is guaranteed to accompany the 3xx to Google (setting it via next/headers
  // cookies() does not reliably attach to a separately-constructed redirect response).
  const response = NextResponse.redirect(buildGoogleAuthUrl(origin, state))

  response.cookies.set(getGoogleStateCookieName(), state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
  })

  return response
}
