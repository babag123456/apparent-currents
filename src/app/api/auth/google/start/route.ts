import { cookies } from 'next/headers'
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
  const cookieStore = await cookies()

  cookieStore.set(getGoogleStateCookieName(), state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
  })

  return NextResponse.redirect(buildGoogleAuthUrl(origin, state))
}
