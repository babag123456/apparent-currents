# Figma Frame Sync Design

## Goal

A single Figma prototype block should behave like a sequence of native presentation slides. Editors paste one prototype URL, while the public presentation's existing previous/next controls, keyboard navigation, and counter advance through the ordered Figma frames alongside any other presentation blocks.

## Editor Experience

The Figma block retains one required prototype URL. A server-wide `FIGMA_ACCESS_TOKEN` authenticates sync requests; editors never enter or see credentials.

Saving a presentation fetches the Figma file and follows the prototype's forward navigation connections from the shared starting frame. The block stores the resulting ordered frames, including node ID, name, dimensions, and sync timestamp. Re-saving refreshes the stored sequence.

The first release supports linear presentation flows. If a frame has multiple forward destinations, sync stops with an explicit branching-flow validation message rather than choosing a branch silently. Loops, missing start frames, inaccessible files, and empty flows also produce actionable messages.

## Data Model

The existing Figma block gains server-managed fields for:

- Ordered synced frames: node ID, name, width, and height.
- Last successful sync timestamp.
- Last sync status or error suitable for display in Payload.

These fields are read-only in the admin UI. The Figma access token remains an environment variable and is never written to Payload, logs, public projections, or browser markup.

## Sync Architecture

A focused Figma API client extracts the file key and starting node from the validated prototype URL and requests the file document with the server token. A separate pure graph-ordering function indexes frames and their prototype reactions, then walks forward from the starting node.

The graph walker rejects ambiguous branches and cycles. Keeping API transport separate from graph interpretation allows deterministic fixture-based tests without network calls.

The collection save hook runs sync when the prototype URL changes or when no successful frame sequence exists. If a later refresh fails and a previous successful sequence exists, that sequence remains stored and usable while the sync error is exposed to the editor. A first sync failure blocks publishing because no navigable public result exists.

## Public Rendering

Before slideshow rendering, each synced Figma block expands into one presentation slide per stored frame. All other blocks retain their current one-block-per-slide behaviour. The outer slideshow therefore computes a combined, accurate count across Figma frames and non-Figma blocks.

Each Figma frame uses a direct Embed Kit 2.0 URL on `embed.figma.com/proto/...`, with the frame's `node-id`, the configured starting node where relevant, `embed-host`, and `scaling=contain`. The direct-open fallback continues to point to the canonical Figma prototype URL.

The existing centered 16:9 fitting container remains. The iframe is recreated or updated as the outer slide changes, so the website controls are the single navigation system. The implementation does not depend on Figma's internal footer, sidebar, or counter.

## Error Handling

- Missing `FIGMA_ACCESS_TOKEN`: an explicit configuration error in Payload; no secret is exposed publicly.
- Invalid or non-prototype URL: existing URL validation error.
- Figma authentication, permission, rate-limit, or availability failure: retain the last successful sequence when available and show the refresh error.
- Missing starting node or no forward sequence: block first publication and identify the affected block.
- Multiple forward destinations: reject as an unsupported branched flow.
- Repeated node: reject as a prototype loop.

## Security

Only validated HTTPS Figma hosts and prototype paths are accepted. The API client sends the token only to Figma's official API host. Public projection allowlists only the frame metadata required for rendering; sync diagnostics and credentials remain server-side. Embed URL generation continues to use an explicit query-parameter allowlist.

## Verification

Automated coverage will include:

- Prototype URL parsing and Embed Kit 2.0 URL generation.
- Linear graph ordering from a shared starting frame.
- Branch, loop, missing-node, and empty-flow failures.
- Save-hook behaviour for successful sync, first-sync failure, and stale-data fallback.
- Public projection removal of private sync data.
- Expansion of Figma frames into the combined slideshow count and order.
- The EB Expo case: a single Payload Figma block with multiple connected frames renders as multiple outer slides with `scaling=contain`.

Production verification includes type checking, lint, security and presentation smoke checks, a full build, migration verification if the schema generates one, and a localhost check of the real EB Expo presentation.
