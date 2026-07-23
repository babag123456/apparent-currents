import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  exchangeGoogleCodeForUser,
  getGoogleStateCookieName,
  isTrustedOrigin,
  loginOrProvisionGoogleUser,
} from '../../../../../lib/google-auth'

function redirectToAdminError(origin: string, message: string) {
  const url = new URL('/admin/login', origin)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  // Reject spoofed Host headers before the request-derived origin is used in any redirect.
  if (!isTrustedOrigin(origin)) {
    return NextResponse.json({ error: 'Untrusted request origin.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(getGoogleStateCookieName())?.value
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const providerError = url.searchParams.get('error')

  cookieStore.delete(getGoogleStateCookieName())

  if (providerError) {
    return redirectToAdminError(origin, 'google_oauth_denied')
  }

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return redirectToAdminError(origin, 'google_oauth_state_mismatch')
  }

  try {
    const googleUser = await exchangeGoogleCodeForUser({ code, origin })
    const { cookie } = await loginOrProvisionGoogleUser({
      email: googleUser.email,
      googleSub: googleUser.sub,
      name: googleUser.name,
    })

    return NextResponse.redirect(new URL('/admin', origin), {
      headers: {
        'Set-Cookie': cookie,
      },
    })
  } catch (error) {
    console.error('Google OAuth login failed.', error)
    return redirectToAdminError(origin, 'google_oauth_failed')
  }
}
