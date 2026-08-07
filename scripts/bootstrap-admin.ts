/**
 * One-off local bootstrap for the first admin user.
 *
 * The Users collection denies native create — Google OAuth provisioning is the
 * only supported user lifecycle path. On a fresh database with OAuth not yet
 * configured, that leaves no way to reach the admin. This script covers that
 * gap for local development only: it creates a single user via the Local API
 * with overrideAccess, and refuses to run if any user already exists.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-admin.ts you@example.com 'a-strong-password'
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error("Usage: npx tsx scripts/bootstrap-admin.ts <email> '<password>'")
  process.exit(1)
}

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'users', overrideAccess: true })
if (existing.totalDocs > 0) {
  console.error(
    `Refusing to bootstrap: ${existing.totalDocs} user(s) already exist. ` +
      'Use Google login, or manage users through OAuth provisioning.',
  )
  process.exit(1)
}

await payload.create({
  collection: 'users',
  data: { email, password },
  overrideAccess: true,
})

console.log(`Created first admin user ${email}. Log in at /admin.`)
process.exit(0)
