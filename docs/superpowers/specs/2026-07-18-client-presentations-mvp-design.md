# Client Presentations MVP Design

## Summary

Add an unbranded client-presentation feature to the existing Next.js and Payload application. Payload administrators will create presentations backed by Google Slides, publish them at private unlisted URLs, and review anonymous engagement summaries.

The MVP prioritises a reliable embed-first workflow. It does not recreate the agency's Google Slides or Figma design systems as native web components.

## Goals

- Let an administrator create and manage a client presentation in Payload.
- Embed an existing Google Slides deck in a responsive, unbranded page.
- Share the page through an unlisted, hard-to-guess URL.
- Record anonymous opens, repeat visits, approximate active viewing time, device category, and supporting-link clicks.
- Preserve the existing award-entry routes, authentication model, media handling, and visual foundations.

## Non-goals

- Passwords, client accounts, or named-recipient tracking.
- Per-slide analytics or inspection of interactions inside Google's iframe.
- Native Payload slide authoring or importing Slides/Figma designs.
- Figma embeds.
- Precise location, advertising identifiers, fingerprinting, or cross-device identity.
- A general-purpose analytics platform.

## Existing Context

The repository is a focused Next.js 16 and Payload 3 application deployed at `thisisour.agency`. It already provides:

- Payload admin authentication through Google OAuth.
- Authenticated writes and public server-rendered reads for content collections.
- Media and video collections backed by existing upload services.
- Block-based award-entry pages and an established editorial design system.
- Strict no-index metadata on unlisted entry routes and a site-wide restrictive robots policy.

The presentation feature will follow these conventions and remain isolated from the award-entry content model.

## Content Model

### Presentations

Create a `presentations` Payload collection with authenticated create, update, and delete access. Public collection reads remain disabled; the presentation route performs a narrowly scoped server-side lookup.

Fields:

- `title`: required internal and metadata title.
- `clientLabel`: optional internal client or project label; never included in the public URL.
- `slidesUrl`: required Google Slides sharing, presentation, or published URL.
- `embedUrl`: derived safe Google embed URL, not freely authorable.
- `shareToken`: cryptographically random, URL-safe token with a unique database constraint.
- `status`: draft or published.
- `active`: independent emergency on/off control.
- `coverImage`: optional relationship to existing media.
- `introduction`: optional short rich text or constrained text field.
- `supportingLinks`: optional array of labels and safe HTTP(S) or root-relative URLs.
- timestamps supplied by Payload.

The admin interface provides a presentation-page shortcut and copyable share URL. Regenerating the share token immediately invalidates the old link.

### Presentation Visits

Create a `presentation-visits` collection that is readable by authenticated administrators and cannot be created, updated, or deleted through Payload's public APIs. A dedicated server endpoint writes validated visit data using the Local API.

Fields:

- `presentation`: required relationship.
- `anonymousSessionId`: random client-generated identifier scoped to this site and browser.
- `firstSeenAt` and `lastSeenAt`.
- `visitCount`.
- `activeSeconds` stored as a bounded integer.
- `deviceCategory`: desktop, tablet, mobile, or unknown.
- `linkClicks`: bounded records identifying only configured supporting-link positions or stable IDs.

Add a compound uniqueness rule for presentation and anonymous session so repeat visits update one record rather than creating unlimited duplicates.

## URL and Access Model

The public route is:

`/present/[shareToken]`

The route returns content only when the token matches a presentation that is both published and active. Missing, malformed, draft, inactive, and expired links all return the same standard not-found response.

The route includes strict `noindex`, `nofollow`, `nocache`, and no-preview metadata. It is absent from navigation and sitemaps. Client and project labels never appear in the URL.

This is privacy through an unlisted high-entropy link, not authentication. It is appropriate for ordinary client presentations but not highly confidential material. Password protection is deferred.

## Google Slides Safety

Administrators may paste a supported `docs.google.com/presentation` sharing or published URL. Server-side parsing extracts only a valid presentation identifier and constructs the embed URL. The application does not render arbitrary iframe source URLs or author-provided iframe HTML.

The source deck must be configured so anyone with its link can view it. Unsupported hosts, unsafe protocols, malformed presentation identifiers, and arbitrary query parameters are rejected.

When embedding is unavailable on a device, the page offers a safe `Open presentation` link to the validated Google Slides URL.

## Client Experience

The page uses a restrained, neutral presentation shell consistent with the quality of the current design system without showing the public website navigation.

The content order is:

1. Optional cover image and short introduction.
2. Responsive 16:9 Google Slides embed.
3. Full-screen affordance where supported by the browser and Google.
4. Optional supporting links for downloads, prototypes, contact, or next steps.
5. Mobile fallback guidance and a direct open link when required.

The presentation remains usable when analytics is unavailable or blocked.

## Anonymous Analytics

The browser creates a random anonymous session ID and stores it locally. No names, email addresses, precise locations, advertising identifiers, or fingerprinting inputs are collected.

The tracker records:

- An initial open.
- A repeat visit when the same locally stored session returns.
- Approximate active time while the page is visible and the user has recently interacted.
- Coarse device category.
- Clicks on supporting links rendered by this application.

It does not claim to measure slide changes, slide-level dwell time, video plays inside Google Slides, or other activity within the cross-origin iframe.

The client batches activity into small periodic updates and sends a final best-effort update when the page becomes hidden. Updates are non-blocking, bounded, and tolerant of network failure.

## Tracking Endpoint

Add a dedicated same-origin endpoint for initial opens and activity updates. It accepts only:

- The presentation share token.
- A structurally valid anonymous session ID.
- A bounded active-time increment.
- A recognised event type.
- A configured supporting-link identifier when recording a click.

The server derives the presentation relationship from the token, ignores unknown fields, rejects excessive values, and rate-limits or coalesces frequent updates. It never returns raw visit records.

Analytics failure must not prevent or delay presentation rendering.

## Admin Reporting

The presentation admin experience shows a compact summary derived from visit records:

- Total anonymous sessions.
- Total and average approximate active time.
- Total visit count and returning-session count.
- Most recent view.
- Supporting-link click totals.

Raw visit records are available only to authenticated administrators. Sophisticated charts and export workflows are deferred.

## Error Handling

- Invalid or inactive public links return the standard not-found page.
- Invalid Slides URLs are rejected during authoring with a specific validation message.
- Failed iframe loading retains a direct safe link where browser behaviour permits a useful fallback.
- Invalid analytics payloads return a non-sensitive client error.
- Database or network failures in analytics are logged server-side and do not affect the presentation response.
- Duplicate anonymous-session updates are handled idempotently or merged into the existing visit record.

## Security and Privacy

- Use a cryptographically secure random generator for high-entropy share tokens.
- Enforce token uniqueness and allow regeneration.
- Keep presentation and visit collection APIs private to anonymous callers.
- Render only constructed Google Slides embed URLs.
- Apply the repository's existing safe-link validation to supporting links.
- Bound analytics payload sizes, time increments, string lengths, and event frequency.
- Do not store raw IP addresses in the presentation visit collection.
- Keep all admin mutations behind the existing authenticated Payload session.

## Testing and Verification

Automated coverage will verify:

- Accepted Google Slides URL forms and canonical embed conversion.
- Rejection of unsupported hosts, schemes, and malformed IDs.
- Share-token entropy assumptions, uniqueness handling, and regeneration behaviour.
- Published/active access rules and indistinguishable not-found outcomes.
- Anonymous denial and authenticated access for both collections.
- Initial visit creation, repeat-visit merging, active-time bounds, and supporting-link validation.
- Malformed, oversized, and unknown analytics events.
- Presentation metadata and crawler directives.
- Existing award-entry routes and security assumptions remain intact.

Completion checks include the repository's lint, TypeScript, build, and security-smoke commands, plus focused route and responsive-browser verification.

## Delivery Sequence

1. Add URL parsing, token, and analytics validation utilities with tests.
2. Add Payload collections and access rules.
3. Add the private presentation route and responsive presentation shell.
4. Add the anonymous tracker and validated tracking endpoint.
5. Add admin shortcuts and engagement summary.
6. Generate Payload types and any required database migration.
7. Run automated, security, build, and visual verification.

## Deferred Follow-ups

- Password-protected or expiring presentation links.
- Named recipient links and consent-aware contact analytics.
- Figma embeds and interactive prototypes.
- Native Payload-authored web presentation sections.
- Per-section analytics for native content.
- Analytics export, dashboards, and retention controls.
