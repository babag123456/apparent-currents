# Payload Migration Baseline Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the committed Payload migrations rebuild a blank PostgreSQL database while remaining safe for databases that already recorded the first migration.

**Architecture:** Regenerate the existing first migration from the exact pre-Presentations schema at commit `67bfb061e7e1d742967f4097392e00411e8bba6c`. Replace its delta-only body with that complete baseline under the same migration name, so existing deployments continue to skip the already-recorded migration while blank databases create every prerequisite table before later Presentation deltas run.

**Tech Stack:** Payload CMS 3.84, PostgreSQL 16, TypeScript, Docker Compose, Node.js 20.9+.

## Global Constraints

- Never reset or mutate the existing `award_kit` database while deriving or testing the baseline.
- Use a separately named disposable PostgreSQL database for generation and another for verification.
- Preserve the migration name `20260430_162543_add_user_google_fields` for deployed-database compatibility.
- Derive schema only from pre-Presentations commit `67bfb061e7e1d742967f4097392e00411e8bba6c`.
- Do not edit later Presentation delta migrations unless blank rebuild evidence proves one is independently invalid.
- Node.js must be 20.9 or newer.

---

### Task 1: Add a repeatable blank-database migration check

**Files:**
- Create: `scripts/verify-blank-migrations.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DATABASE_URL` pointing at the normal local Postgres server.
- Produces: `npm run migrate:verify-blank`, which creates a uniquely named disposable database, runs all migrations, verifies core and Presentation tables, and drops the database in `finally`.

- [ ] **Step 1: Add the failing verification script**

Create a Node script that parses `DATABASE_URL`, replaces its database name with `award_kit_migration_verify_<timestamp>`, connects to the `postgres` maintenance database, creates the disposable database, and invokes:

```js
await execFileAsync(node, [payloadBin, 'migrate', '--config', 'src/payload.config.ts'], {
  cwd: projectRoot,
  env: { ...process.env, DATABASE_URL: disposableUrl.toString() },
})
```

After migration, query `to_regclass` for these prerequisites and final tables:

```js
const requiredTables = [
  'users', 'media', 'videos', 'awards', 'award_entries',
  'payload_locked_documents_rels', 'presentations', 'presentation_visits',
  'presentation_visits_block_metrics', 'presentation_visits_block_journey',
]
```

Always terminate connections and execute `DROP DATABASE ... WITH (FORCE)` in `finally`. Reject database identifiers that do not match `/^award_kit_migration_verify_\d+$/` before issuing create/drop SQL.

- [ ] **Step 2: Register and run the test to verify RED**

Add:

```json
"migrate:verify-blank": "node scripts/verify-blank-migrations.mjs"
```

Run: `npm run migrate:verify-blank`

Expected: FAIL in `20260430_162543_add_user_google_fields` because relation `users` does not exist; the disposable database is still removed.

- [ ] **Step 3: Commit the reproducible failure harness**

```bash
git add package.json scripts/verify-blank-migrations.mjs
git commit -m "test: reproduce blank database migration failure"
```

### Task 2: Regenerate the first migration as the true baseline

**Files:**
- Modify: `src/migrations/20260430_162543_add_user_google_fields.ts`
- Create temporarily, then remove: `work/migration-baseline-source/`

**Interfaces:**
- Consumes: pre-Presentations commit `67bfb061e7e1d742967f4097392e00411e8bba6c`.
- Produces: full `up`/`down` SQL for the pre-Presentations Payload schema under the existing migration module exports.

- [ ] **Step 1: Materialize the historical schema source**

Use `git archive 67bfb061e7e1d742967f4097392e00411e8bba6c` into a disposable directory under `/private/tmp`. Copy only the generated migration result back; never commit the historical checkout.

- [ ] **Step 2: Generate a full migration against an empty disposable database**

From the historical checkout, install locked dependencies with Node 20.9+, create `award_kit_baseline_generate_<timestamp>`, set `DATABASE_URL` to it, and run:

```bash
npm run migrate:create -- --name payload_baseline
```

Expected: a migration whose `up` creates the complete pre-Presentations schema, including `users`, `media`, `videos`, `awards`, `award_entries`, Payload preferences/locks/migrations tables, relationships, enums, and indexes.

- [ ] **Step 3: Replace only the first migration body**

Copy the generated `up` and `down` functions into `20260430_162543_add_user_google_fields.ts`, preserving these exports:

```ts
export async function up({ db }: MigrateUpArgs): Promise<void>
export async function down({ db }: MigrateDownArgs): Promise<void>
```

Confirm the baseline contains the current pre-Presentations `users.name` and `users.google_sub` fields and unique Google subject index, rather than appending them with an `ALTER TABLE` that assumes `users` exists.

- [ ] **Step 4: Review schema boundaries**

Run:

```bash
rg -n 'presentations|presentation_visits' src/migrations/20260430_162543_add_user_google_fields.ts
```

Expected: no matches. Then compare table names with the historical Payload configuration and the first Presentation migration prerequisites.

- [ ] **Step 5: Run the blank migration test to verify GREEN**

Run: `npm run migrate:verify-blank`

Expected: PASS and confirmation that every required table exists; disposable database removed.

- [ ] **Step 6: Commit the baseline**

```bash
git add src/migrations/20260430_162543_add_user_google_fields.ts
git commit -m "fix: restore complete Payload migration baseline"
```

### Task 3: Verify upgrade compatibility and repository health

**Files:**
- Modify if needed: `README.md`

**Interfaces:**
- Consumes: repaired migration series.
- Produces: documented blank-rebuild command and verification evidence for both fresh and already-migrated databases.

- [ ] **Step 1: Prove existing migration tracking remains compatible**

Against a disposable database, run the full migrations, record the rows from `payload_migrations`, then run `npm run migrate` again.

Expected: second run reports no pending migrations and leaves schema unchanged. The first migration name remains `20260430_162543_add_user_google_fields`.

- [ ] **Step 2: Document the verification command**

Add to the README database section:

```markdown
Run `npm run migrate:verify-blank` with local PostgreSQL available to prove the committed migration history can rebuild a fresh disposable database. The script never targets the database named in `DATABASE_URL`; it creates and removes a uniquely named verification database on the same server.
```

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run migrate:verify-blank
npm run presentations:smoke
npm run security:smoke
npx tsc --noEmit
npm run lint
npm run build
```

Expected: every command exits 0; blank database is removed; working tree contains only intentional documentation/source changes.

- [ ] **Step 4: Commit documentation**

```bash
git add README.md
git commit -m "docs: document blank migration verification"
```

