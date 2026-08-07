# Semrush integration

Server-side adapter for the Semrush **Analytics API v3**
(`https://api.semrush.com/`, `?key=` auth, semicolon-CSV responses).

## Why v3, verified 2026-08-07

Checked against https://developer.semrush.com/api/ on 2026-08-07:

- **v4** is the recommended version for *new* integrations, but its keyword
  endpoints (`/apis/v4/keywords/v1/metrics`) are **Early Access** — JSON
  responses, different auth (`Authorization: Apikey …`), and "endpoints,
  response formats, and pricing are subject to change until GA".
- **v3** is deprecated for new integrations but stable, fully documented,
  and works with standard subscription API keys.

Decision: build on v3 now; all version specifics live in `client.ts` and
`normalizers.ts`, so migrating to v4 at GA touches only this directory.
Re-verify docs before adding endpoints — do not trust remembered syntax.

## Implemented reports and unit costs

| Report | Purpose | Cost (per response line) |
|---|---|---|
| `phrase_these` | Batch keyword overview (≤100 phrases) | 10 units |
| `phrase_related` | Related keywords for a seed phrase | 40 units |
| `domain_organic` | Organic keywords a domain ranks for | 10 units |

Historical requests (`display_date`) cost 5× — not used yet. Every
`SemrushReportResult` carries `estimatedUnits` (lines × documented cost);
callers must log it. Keep `display_limit` tight — this is a paid API.

## Layering rules

```
SemrushClient (client.ts)      HTTP, key handling, CSV/error parsing, metering
  └─ queries/                  the only surface the app may call
       └─ normalizers.ts       vendor rows → canonical DemandEvidence
            └─ src/intelligence/…   markers and beyond (no vendor types)
```

- `SEMRUSH_API_KEY` is read server-side only; the client throws in a browser
  context and never logs or echoes the key.
- `ERROR 50 :: NOTHING FOUND` is an **empty result**, not a failure.
- Vendor row shapes must never leave this directory.

## Probe

One narrow live request to validate key, response shape and assumptions
(trend ordering, intent codes):

```bash
npx tsx scripts/semrush-probe.ts "ev charging" au
```

## Known assumptions to confirm on first live call

- `Td` (Trends) series is oldest-month-first, values 0..1.
- `In` (Intent) codes: 0 commercial, 1 informational, 2 navigational,
  3 transactional.
