import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

/**
 * The signed-in admin for this request, or null. Cached per request so the
 * layout, pages and queries share one session lookup.
 */
export const getViewer = cache(async () => {
  // Read the request first: it marks every caller as dynamic, so nothing
  // behind this gate is ever prerendered at build time (and the build never
  // needs the database for it).
  const requestHeaders = await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: requestHeaders })
  return { payload, user: user ?? null }
})

/**
 * Currents is private: every page and every query that reads domain data
 * starts here. No session → the admin login. Call it outside any try/catch
 * (redirect works by throwing).
 *
 * Reads must then pass `user` with `overrideAccess: false`: the Payload
 * Local API skips collection access rules by default, so without that the
 * `read: isAuthenticated` rules on the collections are never applied.
 */
export async function requireViewer() {
  const viewer = await getViewer()
  if (!viewer.user) redirect('/admin/login')
  return { payload: viewer.payload, user: viewer.user }
}
