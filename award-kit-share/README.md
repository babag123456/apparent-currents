# Award Kit

Portable extraction of the awards slice from this repo. Copy `award-kit/` into a fresh Next.js + Payload app and wire it in as a module.

## In Scope

- `award-entries` collection and all 10 block types
- `/entries/[slug]` route
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

## Register In A Fresh Payload App

1. Copy `award-kit/` to the target repo root.
2. Import `awardKitCollections` and `defaultLexical` from `award-kit/src/payload/award-kit.config-fragment`.
3. Add those collections to the target `buildConfig`.
4. Configure Postgres with `@payloadcms/db-postgres`.
5. Use `blocksAsJSON: true` in the Postgres adapter for easier import fidelity.

Example shape:

```ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { awardKitCollections, awardKitConfigFragment } from './award-kit/src/payload/award-kit.config-fragment'

export default buildConfig({
  editor: awardKitConfigFragment.editor,
  collections: [...awardKitCollections],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    blocksAsJSON: true,
  }),
})
```

## Route Placement

- Copy `award-kit/src/app/entries` into the target app router so `/entries/[slug]` exists.
- If you keep the files inside `award-kit/`, make sure the target app resolves and includes them in the App Router.

## CSS And Fonts

- Import `award-kit/src/styles/award-theme.css` from the extracted entries layout or from the target app shell.
- Copy `award-kit/public/fonts` into the target app `public/fonts`.
- Keep the font filenames unchanged.

## Award Media

- Put recovered binaries under `award-kit/public/award-media`.
- Do not rename files without updating `src/data/asset-manifest.json`.
- Current state: all four referenced assets have been recovered and checksummed.
- Provenance:
  `wake-up-call-03_v1-1.png` was recovered from the live Vanuatu Wake-Up Call page.
  The three Audi assets were recovered from the live Audi F1 microsite and publisher-hosted coverage where the original Payload files were no longer publicly available.

## Import Content

Run after the target app has registered the extracted collections:

```bash
npx tsx award-kit/src/scripts/verify-award-assets.ts
npx tsx award-kit/src/scripts/import-award-kit.ts
```

## Validate The Seed

- `pnpm payload generate:types`
- `pnpm tsc --noEmit`
- open `/entries/mumbrella-2026`
- confirm the entry renders with the exported block order
- confirm the awards list data imports cleanly

## Deferred Decisions For The Target App

- production media storage for Vercel
- auth model for create/update/delete access
- broader site navigation and layout
- additional awards pages beyond this extracted slice
