# Presentation Slide Analytics Dashboard Design

## Goal

Give authenticated Payload administrators a useful, privacy-conscious view of how each client presentation performs, including slide-level engagement and anonymous session journeys.

## Scope

The first version lives inside each Presentation's existing Payload edit screen. It does not add a portfolio-wide dashboard or a client-shareable analytics report.

The dashboard provides:

- summary cards for anonymous viewers, visits, average active time, completion rate, and most-viewed slide;
- a slide performance table showing slide position, block type, viewers, percentage reached, average active time, and subsequent drop-off;
- expandable anonymous session rows showing date and time, coarse device category, visit count, total active time, display mode, slides reached, and ordered slide journey.

In slideshow mode, each native Payload content block is a slide. In scrolling mode, the same records are labelled content blocks. A Google Slides embed is one measurable block because events inside Google's iframe are not observable.

## Approach

Calculate dashboard results from Presentation Visit records when the administrator opens the Presentation. This reuses the existing analytics model, avoids a second analytics service, and avoids summary data becoming inconsistent. Cached summaries can be introduced later without changing the dashboard contract.

## Tracking Model

The current anonymous browser session ID remains the visitor identifier. Existing block metrics continue to store block ID, block type, display mode, viewed state, bounded active seconds, and slideshow navigation count.

Add a bounded journey array to each visit. A journey entry contains only:

- block ID;
- block type;
- display mode;
- server-recorded timestamp.

Repeated consecutive entries for the same block are collapsed. A visit stores at most 500 journey entries. Once the limit is reached, new journey entries are ignored while aggregate block time continues updating. Journey events are accepted only when their block ID and type match a block on the active, published Presentation.

No analytics record stores authored content, presentation or asset URLs, client labels, names, emails, raw IP addresses, or precise locations.

## Calculations

- **Anonymous viewers:** count of distinct Presentation Visit records.
- **Total visits:** sum of visit counts.
- **Average active time:** total active seconds divided by anonymous viewers.
- **Slide viewers:** visit records whose matching block metric has `viewed: true`.
- **Percentage reached:** slide viewers divided by anonymous viewers.
- **Average slide time:** slide active seconds divided by slide viewers.
- **Completion rate:** anonymous viewers who viewed the final current block divided by anonymous viewers.
- **Drop-off after a slide:** viewers of that slide minus viewers of the next slide, expressed as a count and percentage of viewers of the current slide. The final slide has no subsequent drop-off value.
- **Most-viewed slide:** current block with the highest viewer count; ties use the earliest block position.

Existing blocks are aligned by stable block ID and block type, never by position alone. Metrics for deleted or changed blocks appear in a clearly labelled Legacy activity section and never transfer to another block.

## Components and Data Flow

The public Presentation tracker sends validated block-view/journey events to the existing same-origin presentation events endpoint. The endpoint verifies the private token and published-block membership before merging bounded metrics.

The authenticated Payload component fetches the current Presentation and its visit records using Payload's protected REST endpoints. A pure summary module accepts current ordered blocks plus visit records and returns overview cards, slide rows, legacy activity, and anonymous session journeys. The React dashboard only renders that result.

The existing compact engagement summary is replaced by the richer dashboard. Loading, empty, and failed-request states remain contained within the analytics panel and do not interfere with editing or publishing the Presentation.

## Interface

The dashboard uses existing Payload admin colours, spacing, and typography. Summary cards appear first, followed by the slide performance table and a collapsed Anonymous sessions section. Session IDs are not displayed in full; rows use labels such as `Anonymous viewer 7` scoped to the current dashboard response.

Tables scroll horizontally on narrow admin screens. All expandable rows are keyboard operable, values have text labels rather than colour-only meaning, and empty data explains that metrics will appear after the private presentation is viewed.

## Error Handling and Limits

- Invalid or unknown block events are rejected without creating a visit.
- Analytics network failures remain non-blocking for client presentation viewing.
- Dashboard request failures show a retryable message without clearing or mutating analytics.
- Malformed historic values are treated as zero or omitted by the pure summariser.
- Dashboard queries use pagination rather than silently truncating at 100 visits.
- Journey and numeric counters are bounded to prevent uncontrolled record growth.

## Verification

Automated tests cover event validation, published-block membership, journey collapsing and limits, aggregation calculations, completion and drop-off, block reordering/deletion, legacy activity, malformed data, empty results, and admin-only collection access.

Final verification includes presentation and security smoke tests, TypeScript, lint, Payload type generation, a delta migration, and a production build. Manual checks cover desktop and narrow admin layouts, expanding sessions by keyboard, slideshow and scrolling journeys, and the empty/error states.

## Deferred

- cross-presentation portfolio analytics;
- date-range filters and CSV export;
- shareable analytics reports;
- named or identified viewers;
- events occurring inside third-party Google Slides iframes;
- external analytics or warehouse integration.
