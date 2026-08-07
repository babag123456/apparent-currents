# Apparent Currents

Audience-intent intelligence product built on Next.js (App Router) + Payload CMS
+ Postgres. The product title is **CURRENTS**; see `CLAUDE.md` for product
principles, language, brand rules and architecture guardrails.

This repository was seeded from an earlier Payload application and stripped
back to a minimal foundation: Payload + Users/Google OAuth authentication, the
Apparent brand styling foundation, and deployment/migration tooling. Product
features (Surface, Deep Dive, integrations) are built on top of this base.

## Run Locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `PAYLOAD_SECRET`.
   For Google admin login (the only way users are created), set:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`,
   and either `GOOGLE_ALLOWED_EMAILS` or `GOOGLE_ALLOWED_DOMAIN`.
2. `npm install`
3. `npm run db:start`
4. Wait for Postgres to become healthy, or watch with `npm run db:logs`
5. `npm run migrate`
6. `npm run dev`

The app wires:

- `src/payload.config.ts`
- Payload admin under `/admin`
- Payload REST under `/api/*`
- frontend shell at `/`

## Google Admin Login

Google login is exposed on the Payload login screen and redirects through:

- `/api/auth/google/start`
- `/api/auth/google/callback`

Required environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_CALLBACK_URL`
- either `GOOGLE_ALLOWED_EMAILS` as a comma-separated allowlist
- or `GOOGLE_ALLOWED_DOMAIN` for a single approved Google Workspace domain

Optional:

- `GOOGLE_OAUTH_ALLOWED_ORIGINS` — extra origins allowed to start the flow

Typical callback URLs:

- local: `http://localhost:3000/api/auth/google/callback`
- production: `https://<production-host>/api/auth/google/callback`

The callback URL is the canonical OAuth origin. If production is visited through
the equivalent `www` or apex host, `/api/auth/google/start` is allowed to begin
the flow and stores the OAuth state cookie on the shared parent domain so the
canonical callback can verify it.

The Google callback creates or updates the matching Payload `users` record,
links it by Google subject ID, and then creates a normal Payload auth cookie
for `/admin`.

Because native user creation is disabled (see below), **Google OAuth must be
configured before the first admin user can exist** on a fresh database.

For local development before OAuth is configured, a one-off fallback exists:

```bash
npx tsx scripts/bootstrap-admin.ts you@example.com 'a-strong-password'
```

It refuses to run if any user already exists.

## Security Model

- Native `users` collection create, update, delete, and unlock operations are
  disabled. Google OAuth provisioning is the only supported user lifecycle path
  and uses server-side `overrideAccess`.
- Authenticated users can only read their own user record through the native
  user API.
- CMS-authored public links must be validated with `getSafePublicHref`
  (`src/lib/security/url.ts`): only `http:`, `https:`, or root-relative paths.
  Unsafe schemes such as `javascript:`, `data:`, protocol-relative URLs, and
  malformed URLs are rejected.
- Google OAuth state tokens are generated from 32 random bytes and verified
  against the callback state parameter before login is completed.
- Google login allowlisting uses exact normalized email or domain equality,
  avoiding wildcard or regex-style domain matching.
- All routes send `X-Robots-Tag: noindex` (see `next.config.ts`) and `robots.ts`
  disallows crawling — this is an internal product.

Security smoke checks:

```bash
npm run security:smoke
npm run lint
npx tsc --noEmit
```

Recommended deployment checks after each preview or production deploy:

- `GET /api/users?limit=1` returns `403` when unauthenticated.
- `POST /api/users` returns `403` when unauthenticated.
- `/` and `/admin/login` return `200`.

## CSS And Fonts

- `src/styles/brand.css` is imported by the frontend route-group layout and is
  the single Tailwind entrypoint plus the Apparent brand tokens and fonts.
- Local fonts live under `public/fonts` (Swiss Posters, Inter Tight, DM Mono).
  Keep the font filenames unchanged.

## Local Docker Postgres

The local development database runs through Docker Compose:

- service: `postgres`
- image: `postgres:16-alpine`
- host port: `5434`
- database: `apparent_currents`
- username: `postgres`
- password: `postgres`

Useful commands:

```bash
npm run db:start
npm run db:logs
npm run db:stop
npm run db:reset
```

`db:reset` removes the Docker volume and wipes the local database completely.

## Migrations

- `npm run migrate` applies committed migrations.
- `npm run migrate:create` generates a new migration after collection changes
  (also run `npm run generate:types`).
- `npm run migrate:verify-blank` proves the committed migration history can
  rebuild a fresh disposable database. The script never targets the database
  named in `DATABASE_URL`; it creates and removes a uniquely named verification
  database on the same server.
- On Vercel, `vercel-build` runs `scripts/clear-dev-migration-row.mjs` then
  `payload migrate` before `next build`. If deploying anywhere other than
  Vercel, an equivalent migrate step must run — nothing else applies migrations.

## Validate

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run security:smoke
npm run migrate:verify-blank
```
