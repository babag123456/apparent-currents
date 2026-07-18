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
   For Google admin login, also set:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and either
   `GOOGLE_ALLOWED_EMAILS` or `GOOGLE_ALLOWED_DOMAIN`.
   If your Google OAuth app requires an explicit callback URL, set
   `GOOGLE_OAUTH_CALLBACK_URL` to `/api/auth/google/callback` on the correct origin.
   To sync Figma prototype frames into presentation slides, set a server-only
   `FIGMA_ACCESS_TOKEN` with read access to the relevant Figma files.
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

## Google Admin Login

Google login is exposed on the Payload login screen and redirects through:

- `/api/auth/google/start`
- `/api/auth/google/callback`

Required environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- either `GOOGLE_ALLOWED_EMAILS` as a comma-separated allowlist
- or `GOOGLE_ALLOWED_DOMAIN` for a single approved Google Workspace domain

Optional:

- `GOOGLE_OAUTH_CALLBACK_URL`

Typical callback URLs:

- local: `http://localhost:3000/api/auth/google/callback`
- production: `https://thisisour.agency/api/auth/google/callback`

The Google callback creates or updates the matching Payload `users` record, links it by Google subject ID, and then creates a normal Payload auth cookie for `/admin`.

## Security Model

The public frontend is read-only. Public routes render award-entry content server-side through Payload's Local API, while content creation and updates happen through the authenticated Payload admin and native Payload APIs.

Access controls:

- `award-entries`, `awards`, `media`, and `videos` allow public reads.
- `award-entries`, `awards`, `media`, and `videos` require an authenticated Payload session for create, update, and delete.
- Native `users` collection create, update, delete, and unlock operations are disabled. Google OAuth provisioning is the only supported user lifecycle path and uses server-side `overrideAccess`.
- Authenticated users can only read their own user record through the native user API.

Public API redaction:

- Anonymous `media` responses keep display-oriented fields like `url`, `thumbnailURL`, filename, dimensions, and MIME metadata.
- Anonymous `media` responses do not expose internal UploadThing fields such as `uploadthingKey` or `uploadthingUrl`.
- Anonymous `videos` responses keep playable/display fields like `url` and `thumbnailUrl`.
- Anonymous `videos` responses do not expose `sourceUploadthingKey`, `sourceUploadthingUrl`, `muxAssetId`, `muxPlaybackId`, or `muxStatus`.

Input hardening:

- UploadThing direct-upload metadata is only accepted when the uploaded file URL is HTTPS and hosted on an allowed UploadThing host (`utfs.io`, `*.utfs.io`, `ufs.sh`, or `*.ufs.sh`).
- CMS-authored public links are limited to `http:`, `https:`, or root-relative paths. Unsafe schemes such as `javascript:`, `data:`, protocol-relative URLs, and malformed URLs are rejected during validation and skipped during rendering.
- Google OAuth state tokens are generated from 32 random bytes and verified against the callback state parameter before login is completed.
- Google login allowlisting uses exact normalized email or domain equality, avoiding wildcard or regex-style domain matching.

Security smoke checks:

```bash
npm run security:smoke
npm run lint
npx tsc --noEmit
```

Recommended deployment checks after each preview or production deploy:

- `GET /api/media?limit=1` returns public display fields but no UploadThing internal field names.
- `GET /api/videos?limit=1` returns public display fields but no Mux or UploadThing internal field names.
- `GET /api/users?limit=1` returns `403` when unauthenticated.
- `POST /api/users` returns `403` when unauthenticated.
- `/` and `/admin/login` return `200`.

## CSS And Fonts

- `src/styles/award-theme.css` is imported by the frontend route-group layout.
- Local fonts already live under `public/fonts`.
- Keep the font filenames unchanged.

## Client Presentations

Payload administrators can publish unbranded, block-based presentations at private, unlisted URLs. Presentations reuse the same content blocks as Award Entries; Google Slides is available as an optional block alongside images, video, rich text, results, quotes, and other native blocks.

Authoring workflow:

1. In Payload, create a Presentation and add content blocks in the desired order.
2. Choose a light or dark theme and either **Scrolling webpage** or **Full-screen slideshow** mode.
3. Optionally add a Google Slides block. Set that deck to **Anyone with the link can view**, then paste its sharing or published URL.
4. Add an optional cover image, introduction, and supporting links, then publish with **Active** enabled.
5. Use **Open presentation** to verify the private page, then copy its `/present/<token>` URL for the client.

Figma prototype blocks use one pasted prototype URL. On save, the server uses
`FIGMA_ACCESS_TOKEN` to follow the prototype's linear forward connections, or
to use top-to-bottom/left-to-right canvas order when the page has no connections, and
stores the resulting frame sequence. In slideshow mode, those frames become
native presentation slides, so the site's arrows, keyboard navigation, counter,
and analytics remain authoritative. Tokens must be configured as local or
deployment secrets and must never be entered into Payload content.

Create a least-privilege personal access token in Figma, grant it access only to
the required files, and set it in `.env.local` for local development and in the
deployment environment for preview/production. Re-save a presentation to refresh
its frame sequence. If refresh fails, the last successful sequence remains live
and the admin record stores a safe sync error. The first release supports linear
flows only; branches and loops must be resolved in Figma before syncing.

The URL token is generated from cryptographically secure random bytes and does not contain the client or project name. Presentation pages are excluded from navigation and search indexing. Clearing the token and saving generates a replacement link; disabling **Active** immediately makes the current link return not found.

Anonymous engagement records page opens, repeat visits from the same browser, approximate active viewing time, coarse device category, supporting-link clicks, block viewing time, and slideshow navigation. It does not store authored block content, presentation URLs, names, emails, raw IP addresses, precise location, or activity inside a Google Slides iframe. Existing Slides-only presentations continue to render as a legacy fallback. Google Slides must remain link-viewable, and this MVP does not provide password protection.

Authenticated Payload administrators can view **Presentation analytics** inside each Presentation. The dashboard shows anonymous viewers, total visits, average active time, completion, the most-viewed slide, per-slide reach/time/drop-off, and expandable anonymous session journeys. In scrolling mode these are content blocks; in slideshow mode each native block is a slide. Google Slides is measured as one iframe block because activity inside Google's iframe is not observable.

Session journeys store only block ID/type, display mode, and a server timestamp. Consecutive duplicate entries collapse and each visit is limited to 500 journey entries. Dashboard results are calculated from visit records and align historical activity by stable block ID plus type; deleted blocks remain labelled as legacy activity rather than being reassigned by position.

Run presentation-specific checks with:

```bash
npm run presentations:smoke
```

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

Run `npm run migrate:verify-blank` with local PostgreSQL available to prove the committed migration history can rebuild a fresh disposable database. The script never targets the database named in `DATABASE_URL`; it creates and removes a uniquely named verification database on the same server.

## Validate The Seed

- `npm run security:smoke`
- `npm run lint`
- `npx tsc --noEmit`
- open `/mumbrella-2026`
- confirm the entry renders with the exported block order
- confirm the awards list data imports cleanly

## Deferred Decisions

- broader site navigation and layout
- additional awards pages beyond this extracted slice
- any local workaround needed for `payload generate:types` in your chosen Node runtime
- Neon connection strings for staging and production once Vercel is in place
