# Presentation Native Blocks and Slideshow Design

## Summary

Extend client Presentations so editors can compose them from the same Payload content blocks already used by Award Entries. Add Google Slides as one shared optional block. Render the same authored content either as a scrolling page or as a full-screen slideshow selected by the Payload editor.

## Goals

- Reuse the existing block configurations, components, styling, media relationships, and renderer.
- Allow a Presentation to contain native blocks only, Google Slides only, or any mixture.
- Let editors reorder Google Slides like every other block.
- Provide scrolling and full-screen slideshow display modes without duplicating authored content.
- Preserve all existing private links, access controls, anonymous analytics, and Slides-only presentations.
- Add block-level visibility and active-time analytics for Presentation pages.

## Non-goals

- A second set of presentation-specific copies of existing blocks.
- Importing or converting Google Slides or Figma frames into Payload blocks.
- Inspecting slide changes or media events inside Google's cross-origin iframe.
- Letting clients switch display mode; the Payload editor chooses the mode.
- Named-recipient analytics, passwords, or expiring links.

## Shared Block Library

Create one exported ordered block list containing:

- Hero
- Case Study
- Rich Text
- Media
- Results
- Quote
- Image Grid
- Video
- Button
- Spacer
- Divider
- Google Slides

Both Award Entries and Presentations consume this list. Existing block configs and React components remain the source of truth; no wrapper or duplicate block implementation is introduced.

`RenderEntryBlocks` becomes the shared renderer for both collections and learns the Google Slides block type. Its existing Award Entry behaviour remains unchanged.

## Google Slides Block

The new block contains:

- A required Google Slides sharing or published URL.
- An optional accessible title.
- Optional presentation controls supported by the canonical Google embed URL, limited to settings the application explicitly supports.

It uses the existing strict Google Slides parser. The server constructs canonical embed and open URLs; editors cannot provide iframe HTML or arbitrary iframe sources.

The component renders a responsive 16:9 iframe with full-screen support and a direct `Open presentation` fallback. In native slideshow mode, interaction inside the iframe must not trigger parent next/previous navigation.

The block is available in both Award Entries and Presentations.

## Presentation Content Model

Add these fields to Presentations:

- `theme`: light or dark, following the existing Award Entry theme model.
- `displayMode`: `scroll` or `slideshow`, defaulting to `scroll`.
- `layout`: the shared ordered Payload blocks list.

The existing top-level Slides URL, derived URLs, cover, introduction, and supporting links remain temporarily supported for backward compatibility.

Rendering precedence:

1. When `layout` contains blocks, render it as the primary presentation content.
2. When `layout` is empty and the legacy Slides URL exists, render the current fixed Slides presentation experience.
3. When neither exists, a published Presentation is invalid and returns not found or is blocked by authoring validation.

Existing tokens and analytics relationships do not change.

## Scrolling Mode

Scrolling mode is the default. It renders the shared blocks sequentially using the current light/dark theme provider, existing block spacing, typography, media treatment, and responsive rules.

The unbranded Presentation shell remains outside public navigation. Supporting links may remain after the block sequence during the compatibility period.

Each rendered block receives a stable authored block ID as a DOM data attribute for analytics. Block content, text, URLs, and client labels are never included in analytics events.

## Full-Screen Slideshow Mode

Slideshow mode renders one Payload block per viewport-sized slide. It reuses each block component rather than providing separate slide components.

Required controls:

- Previous and next buttons.
- Left and right keyboard arrows.
- Touch swipe navigation.
- Current slide and total slide count.
- Progress indicator.
- Browser Fullscreen API enter/exit button.
- Escape exits browser full screen; outside browser full screen it does not destroy authored state.
- Direct navigation to a slide through a URL hash or equivalent non-sensitive index.

Navigation does not fire when keyboard or pointer interaction originates inside an interactive child such as an iframe, video control, button, link, form element, or content-editable area.

Slides preserve responsive layouts. Content that exceeds one viewport may scroll internally rather than being clipped. Reduced-motion preferences disable non-essential transitions.

## Public Projection and Rendering

The server-side public projection adds only:

- Theme.
- Display mode.
- Sanitised block data required by the shared renderer.
- Stable block IDs and block type labels needed for rendering and analytics.

It continues to exclude client labels, database metadata, raw author URLs, visit data, and internal media-provider fields. Google Slides URLs are reconstructed from the validated authored URL at render time.

The private `/present/[shareToken]` route selects the scrolling or slideshow renderer from the projected `displayMode`.

## Block Analytics

Extend Presentation visit records with bounded per-block metrics:

- Block ID.
- Block type.
- Whether it entered the viewport.
- Approximate active seconds while it was the primary visible block.
- Navigation count in slideshow mode.

Analytics events also include the active display mode. They do not include block content or URLs.

Scrolling mode uses Intersection Observer to select the primary visible block. Slideshow mode uses the active slide index. Active time is counted only while the document is visible and recent user activity rules are satisfied, matching the existing page tracker.

Heartbeat increments remain bounded and are merged into the existing anonymous Presentation Visit record. Unknown block IDs, block types not present in the published Presentation, excessive increments, and malformed mode values are rejected.

Google Slides block visibility is recorded, but internal Google iframe activity remains unobservable.

## Admin Reporting

The existing anonymous engagement summary adds:

- Display-mode totals.
- Blocks viewed.
- Approximate active time by block.
- Slideshow navigation counts.

Block labels use safe admin-facing position/type labels such as `3 · Video`; analytics records do not copy authored titles or body content.

## Backward Compatibility

- Existing legacy Slides-only Presentations continue to render unchanged.
- Existing private tokens remain valid.
- Existing visit records remain readable with empty block metrics.
- Existing Award Entry documents render with their current blocks and theme.
- Adding Google Slides to the shared list does not modify existing Award Entry data.
- Editors can migrate a legacy Presentation by adding blocks; no forced content migration occurs.

## Error Handling

- Invalid Google Slides block URLs are rejected during authoring.
- Unknown block types are skipped safely and logged server-side.
- Empty published layouts fall back to the legacy Slides URL when available.
- Analytics failures never block Presentation rendering or navigation.
- Fullscreen API rejection leaves slideshow mode usable within the browser viewport.
- A missing media relationship renders the existing block fallback rather than crashing the entire Presentation.

## Accessibility

- Navigation controls have accessible names and visible focus states.
- Keyboard navigation excludes interactive descendants.
- Slide changes announce the new position through a polite live region.
- Iframes require meaningful titles.
- Full-screen mode never traps keyboard focus.
- Colour, typography, and focus treatment continue to use the established design system.
- Reduced-motion preferences are respected.

## Testing and Verification

Automated coverage will verify:

- Shared block-list parity between Award Entries and Presentations.
- Google Slides block validation and canonical URL construction.
- Public block projection excludes private/internal fields.
- Legacy Slides-only fallback.
- Scroll/slideshow mode selection and default.
- Keyboard navigation exclusions for interactive descendants.
- Swipe threshold and boundary behaviour.
- Fullscreen success and rejection handling.
- Block analytics validation, merging, bounds, and published-block membership.
- Existing private-link, collection-access, security-smoke, and Award Entry rendering behaviour.

Completion verification includes presentation/security smoke tests, lint, TypeScript, production build, migration review, and focused desktop/mobile browser checks for both modes.

## Delivery Boundaries

This is one implementation cycle with four isolated units:

1. Shared block list and Google Slides block.
2. Presentation content model and public projection.
3. Scrolling and slideshow renderers.
4. Block analytics, admin reporting, migration, and verification.

Future work may add client-selectable mode, saved slide position, password/expiry controls, Figma blocks, or native charts without changing the authored block model.
