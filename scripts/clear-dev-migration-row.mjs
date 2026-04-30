// One-shot pre-migrate cleanup for `payload migrate`.
//
// Payload's drizzle adapter records a sentinel row (`batch = -1`, name = `dev`)
// in `payload_migrations` whenever schema is pushed in dev mode. When that row
// exists, `payload migrate` unconditionally shows an interactive prompt — and
// in non-TTY environments like Vercel build, that prompt hangs forever (the
// `--force-accept-warning` flag only applies to `migrate:fresh`/`migrate:create`,
// not `migrate`).
//
// This script deletes the sentinel row so `payload migrate` runs unattended.
// It's idempotent: if the table or row doesn't exist, it no-ops.

import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.log('[clear-dev-migration-row] DATABASE_URL not set; skipping.')
  process.exit(0)
}

const client = new pg.Client({ connectionString })

try {
  await client.connect()

  const { rows: tableRows } = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payload_migrations'",
  )

  if (tableRows.length === 0) {
    console.log('[clear-dev-migration-row] payload_migrations table not present; nothing to clear.')
  } else {
    const result = await client.query("DELETE FROM payload_migrations WHERE batch = -1")
    console.log(`[clear-dev-migration-row] cleared ${result.rowCount} dev sentinel row(s).`)
  }
} catch (error) {
  console.error('[clear-dev-migration-row] failed:', error)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
