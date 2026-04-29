# Award Kit

Standalone Next.js + Payload app for the extracted awards slice from this repo. The directory is now packaged to run directly instead of being copied into another app first.

## In Scope

- `award-entries` collection and all 10 block types
- `/<slug>` submission route
- entry theme provider and toggle
- standalone awards list section
- slim `media` collection
- exported content JSON
- recovered-asset manifest and verification script
- local fonts needed for the extracted styling

## Intentionally Removed

- all non-awards collections
- header/footer globals
- generic page builder usage outside award entries
- redirects, SEO, search, form-builder, nested-docs plugins
- revalidation hooks, jobs, dashboard/login customizations
- Mongo adapter code
- media naming metadata and hooks

## Required Packages

- `payload`
- `@payloadcms/next`
- `@payloadcms/richtext-lexical`
- `@payloadcms/db-postgres`
- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `@tailwindcss/typography`

## Run Locally

1. `cd award-kit`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `PAYLOAD_SECRET`.
   For external media, also set `UPLOADTHING_TOKEN`, plus
   `MUX_ACCESS_TOKEN_ID` / `MUX_ACCESS_TOKEN_SECRET`
   in `.env.local` for local development and in Vercel env vars for preview / production.
3. `npm install`
4. `npm run db:start`
5. Wait for Postgres to become healthy, or watch with `npm run db:logs`
6. `npm run seed:verify`
7. `npm run dev`

The standalone app already wires:

- `src/payload.config.ts`
- Payload admin under `/admin`
- REST and GraphQL routes under the standard Payload route group
- frontend submission route at `/<slug>`
- root showcase page at `/`

## CSS And Fonts

- `src/styles/award-theme.css` is imported by the frontend route-group layout.
- Local fonts already live under `public/fonts`.
- Keep the font filenames unchanged.

## Award Media

- Put recovered binaries under `award-kit/public/award-media` for seed imports and UploadThing migrations.
- Do not rename files without updating `src/data/asset-manifest.json`.
- Current state: all four referenced assets have been recovered and checksummed.
- Provenance:
  `wake-up-call-03_v1-1.png` was recovered from the live Vanuatu Wake-Up Call page.
  The three Audi assets were recovered from the live Audi F1 microsite and publisher-hosted coverage where the original Payload files were no longer publicly available.

## Import Content

Run after the app can connect to Postgres:

```bash
npm run seed:verify
npm run seed:import
npm run media:migrate:uploadthing
```

## Local Docker Postgres

The local development database runs through Docker Compose:

- service: `postgres`
- image: `postgres:16-alpine`
- host port: `5433`
- database: `award_kit`
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

## Validate The Seed

- `npm run lint`
- `npx tsc --noEmit`
- open `/mumbrella-2026`
- confirm the entry renders with the exported block order
- confirm the awards list data imports cleanly

## Deferred Decisions

- auth model for create/update/delete access
- broader site navigation and layout
- additional awards pages beyond this extracted slice
- any local workaround needed for `payload generate:types` in your chosen Node runtime
- Neon connection strings for staging and production once Vercel is in place
