# Payload Migration Baseline

## Current state

The schema history was reset on 2026-08-07, before any Currents deployment
existed. The single committed baseline migration is:

- `src/migrations/20260807_085222_initial_baseline.ts` — creates `users`,
  `users_sessions`, and the Payload internal tables (`payload_migrations`,
  `payload_locked_documents(_rels)`, `payload_preferences(_rels)`,
  `payload_kv`) from the trimmed collection set (`Users` only).

The previous application's four-migration chain (award entries, presentations,
media/videos) was deleted as part of the pre-Currents cleanup. It remains
available in git history if archaeology is ever needed.

## Rules

- **Never edit or renumber a migration once any real database has run it.**
  Add new migrations with `npm run migrate:create` after collection changes,
  and run `npm run generate:types` in the same change.
- Down-migrations are destructive by design; never run `migrate:down` toward
  the baseline on a database you care about.
- On Vercel, migrations run during `vercel-build` (after
  `scripts/clear-dev-migration-row.mjs` removes the interactive `dev` sentinel
  row that would hang a non-TTY build). Any non-Vercel deployment needs an
  equivalent migrate step.

## Verification methodology

`npm run migrate:verify-blank` (`scripts/verify-blank-migrations.mjs`) proves
the committed history can rebuild a database from nothing:

1. Parses `DATABASE_URL`, replaces the database name with
   `apparent_currents_migration_verify_<timestamp>` (identifier validated by
   regex before any create/drop SQL is issued), and creates that disposable
   database via the `postgres` maintenance connection.
2. Runs `payload migrate` **twice** — the second run proves idempotency.
3. Asserts every required table exists and that `payload_migrations` contains
   exactly the expected history (currently: the single baseline).
4. Drops the disposable database in `finally` with `WITH (FORCE)`. The script
   never touches the database named in `DATABASE_URL`.

When a new migration is added, update `requiredTables` (if new tables appear)
and the expected history assertion in the script — the exact-history check is
deliberate: it forces migration changes to be conscious.
