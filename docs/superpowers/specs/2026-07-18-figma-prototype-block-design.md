# Figma Prototype Block Design

## Goal

Add Figma prototypes as a safe, optional shared Payload content block. Editors can place a prototype anywhere in an Award Entry or Presentation, and the same authored block works in both scrolling and full-screen presentation modes.

This feature embeds interactive prototypes. It does not import Figma files, connect a Figma account, call the Figma API, or reproduce Figma designs as native site components.

## Authoring model

Add a shared block named **Figma Prototype** with three fields:

- **Prototype URL** — required HTTPS URL from an approved Figma host.
- **Accessible title** — optional; defaults to “Figma prototype”.
- **Interface style** — `minimal` or `full`, defaulting to `minimal`.

The block joins `sharedEntryBlocks`, making it available to Award Entries and Presentations without duplicating configuration or rendering code.

Editors paste only the Figma share/prototype URL. Raw iframe HTML is never accepted or stored.

## URL safety and projection

A dedicated parser accepts supported HTTPS Figma prototype/file URLs on the exact approved hosts used by Figma sharing. It rejects:

- HTTP URLs.
- Lookalike or subdomain-confusion hosts.
- Non-Figma destinations.
- URLs without a supported file or prototype path and identifier.
- Credentials or other malformed URL forms.

The parser constructs both the embed URL and the direct-open URL internally. It preserves only Figma's safe prototype-navigation and scaling parameters: `node-id`, `starting-point-node-id`, `page-id`, `scaling`, and `content-scaling`. Arbitrary browser-supplied parameters are not reflected into the iframe.

The public Presentation projection allowlists only the block ID, block type, prototype URL, accessible title, and interface style. It re-validates the stored URL before rendering. Invalid legacy or manipulated blocks are omitted from public output.

## Rendering

The renderer follows the existing Google Slides block structure:

- Responsive frame that fits within both the available width and viewport height.
- A 16:9 default aspect ratio with clean centred letterboxing instead of cropping or distortion.
- Fullscreen permission.
- Strict referrer policy.
- Accessible iframe title.
- A visible **Open prototype in Figma ↗** fallback link.

`minimal` is the polished client-facing default. `full` exposes the supported Figma controls for inspection and navigation. If Figma refuses or cannot load the embed because of sharing permissions, the surrounding page remains usable and the direct-open fallback remains available.

The block uses the existing presentation wrapper, slideshow navigation safeguards, theme system, and responsive spacing. Interactions inside the cross-origin Figma iframe must not trigger parent slideshow navigation.

In scrolling mode, the frame uses the content width but is capped to the viewport height. In slideshow mode, it expands into the slide's available height after control-safe spacing. The same component and CSS classes serve both modes; the CMS does not gain another fit setting.

## Analytics and privacy

Existing block analytics record that the Figma block was reached, its approximate active time, display mode, and parent-page navigation events. No new analytics schema is required.

The application does not claim to observe screens, hotspots, clicks, or navigation inside Figma’s cross-origin iframe. Figma sharing permissions continue to govern who can open the prototype.

## Failure behaviour

- Payload rejects invalid URLs with an actionable validation message.
- Public projection drops invalid Figma blocks rather than exposing untrusted URLs.
- The component renders nothing if called directly with invalid data.
- Valid but private or unavailable prototypes retain the direct-open fallback link.
- Existing blocks and legacy Google Slides presentations remain unchanged.

## Testing

Test-first coverage will verify:

- Accepted Figma share/prototype URL shapes and exact-host enforcement.
- Rejection of HTTP, lookalike hosts, malformed paths, unsafe credentials, and unsupported URLs.
- Deterministic embed and open URL generation for both interface styles.
- Preservation of the safe Figma scaling parameters and removal of unrelated query parameters.
- Shared width/height constraints and slideshow-specific viewport fitting without cropping.
- Shared block registration and default interface style.
- Public projection allowlisting and invalid-block removal.
- Renderer safety attributes, fallback copy, and presentation compatibility.
- Existing presentation and security smoke suites, TypeScript, lint, generated Payload types, and production build.

Because the new block is stored inside the existing JSON `layout` field, it should not require a database schema migration. Payload types and the admin import map will still be regenerated and reviewed.

## Out of scope

- Figma API authentication or account connection.
- Metadata or thumbnail fetching.
- Importing frames as native Payload blocks.
- Editing Figma content from Payload.
- Analytics inside the iframe.
- Password or expiry controls for Presentation links.
