import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  classifyDevice,
  mergeVisitMetrics,
  parsePresentationEvent,
} from '../src/lib/presentations/analytics.ts'
import {
  extractGoogleSlidesId,
  parseGoogleSlidesUrl,
  validateGoogleSlidesUrl,
} from '../src/lib/presentations/googleSlides.ts'
import { deriveSlideTitle, orderGoogleSlides } from '../src/lib/presentations/googleSlidesSync.ts'
import {
  createPresentationShareToken,
  isValidPresentationShareToken,
} from '../src/lib/presentations/shareToken.ts'
import { PresentationVisits } from '../src/payload/collections/PresentationVisits.ts'
import { Presentations } from '../src/payload/collections/Presentations.ts'
import { sharedEntryBlocks } from '../src/blocks/entries/sharedBlocks.ts'
import { isValidGoogleSlideTarget, isValidPresentationBlockTarget, mergeBlockJourney, mergeBlockMetrics, mergeLinkClicks, toPublicPresentation } from '../src/lib/presentations/repository.ts'
import { summarizePresentationVisits } from '../src/lib/presentations/summary.ts'
import { summarizePresentationDashboard } from '../src/lib/presentations/dashboard.ts'
import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../src/lib/presentations/slideshow.ts'

// Run hermetically: with no service-account creds, the presentation hook takes
// the "not configured" path instead of making a live Slides API call.
delete process.env.GOOGLE_SLIDES_CLIENT_EMAIL
delete process.env.GOOGLE_SLIDES_PRIVATE_KEY
delete process.env.GOOGLE_SLIDES_CREDENTIALS_JSON

const deckId = '1AbCdEfGhIjKlMnOpQrStUvWxYz_123456'
const publishedId = '2PACX-1vQwertyUiopAsdfGhjkLzxcVbnm123456'

assert.equal(nextSlide(0, 3), 1)
assert.equal(nextSlide(2, 3), 2)
assert.equal(previousSlide(2, 3), 1)
assert.equal(previousSlide(0, 3), 0)
assert.equal(isInteractiveNavigationTarget({ closest: () => ({}) } as unknown as EventTarget), true)
assert.equal(isInteractiveNavigationTarget({ closest: () => null } as unknown as EventTarget), false)

assert.deepEqual(sharedEntryBlocks.map((block) => block.slug), [
  'entryHero', 'entryCaseStudy', 'entryRichText', 'entryMedia', 'entryResults', 'entryQuote',
  'entryImageGrid', 'entryVideo', 'entryButton', 'entrySpacer', 'entryDivider',
  'entryGoogleSlidesDeck',
])

// The live-embed player uses Google's iframe (so video/GIFs play) with our own
// nav, and reports the active slide for per-slide analytics.
const embedPlayerSource = readFileSync(
  new URL('../src/components/presentations/GoogleSlidesEmbedPlayer.tsx', import.meta.url),
  'utf8',
)
assert.match(embedPlayerSource, /<iframe/)
assert.match(embedPlayerSource, /#slide=id\./)
assert.match(embedPlayerSource, /rm.*minimal/)
assert.match(embedPlayerSource, /requestFullscreen/)
assert.match(embedPlayerSource, /presentation:slide-navigation/)
for (const className of ['google-slides-player', 'google-slides-player__frame', 'google-slides-player__controls']) {
  assert.match(embedPlayerSource, new RegExp(className))
}

// The in-page module picks a presentation (relationship), not a URL.
const deckBlock = sharedEntryBlocks.find((block) => block.slug === 'entryGoogleSlidesDeck')
assert.ok(deckBlock)
const deckFields = deckBlock.fields.filter((field) => 'name' in field) as Array<{ name: string; required?: boolean; type?: string }>
const deckPresentationField = deckFields.find((field) => field.name === 'presentation')
assert.equal(deckPresentationField?.type, 'relationship')
assert.equal(deckPresentationField?.required, true)
assert.ok(!deckFields.some((f) => f.name === 'slidesUrl'), 'module should no longer take a URL')
for (const field of ['prehead', 'headline', 'intro']) {
  assert.ok(deckFields.some((f) => f.name === field), `deck should expose ${field}`)
}

for (const value of [
  `https://docs.google.com/presentation/d/${deckId}/edit#slide=id.p`,
  `https://docs.google.com/presentation/d/${deckId}/present`,
  `https://docs.google.com/presentation/d/e/${publishedId}/pub?start=false`,
]) {
  assert.equal(validateGoogleSlidesUrl(value), true, `${value} should validate`)
}
assert.equal(validateGoogleSlidesUrl(undefined), true, 'legacy Slides URL should be optional')

assert.deepEqual(parseGoogleSlidesUrl(`https://docs.google.com/presentation/d/${deckId}/edit`), {
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
})
assert.deepEqual(parseGoogleSlidesUrl(`https://docs.google.com/presentation/d/e/${publishedId}/pub`), {
  embedUrl: `https://docs.google.com/presentation/d/e/${publishedId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/e/${publishedId}/pub`,
})

for (const value of [
  'javascript:alert(1)',
  `https://evil.example/presentation/d/${deckId}/edit`,
  'https://docs.google.com/presentation/d/x/edit',
  `http://docs.google.com/presentation/d/${deckId}/edit`,
]) {
  assert.notEqual(validateGoogleSlidesUrl(value), true, `${value} should be rejected`)
  assert.equal(parseGoogleSlidesUrl(value), null)
}

const tokens = new Set(Array.from({ length: 100 }, createPresentationShareToken))
assert.equal(tokens.size, 100)
for (const token of tokens) {
  assert.equal(isValidPresentationShareToken(token), true)
  assert.match(token, /^[A-Za-z0-9_-]{32}$/)
}
assert.equal(isValidPresentationShareToken('too-short'), false)

const sessionId = crypto.randomUUID()
assert.deepEqual(parsePresentationEvent({ type: 'open', sessionId }), {
  type: 'open',
  sessionId,
})
assert.deepEqual(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 15 }), {
  type: 'heartbeat',
  sessionId,
  activeSeconds: 15,
})
assert.deepEqual(parsePresentationEvent({ type: 'linkClick', sessionId, linkId: 'prototype-link' }), {
  type: 'linkClick',
  sessionId,
  linkId: 'prototype-link',
})
assert.deepEqual(parsePresentationEvent({ type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15 }), {
  type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15,
})
assert.equal(parsePresentationEvent({ type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 31 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId: 'bad', activeSeconds: 15 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 31 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 0 }), null)
assert.equal(parsePresentationEvent({ type: 'linkClick', sessionId, linkId: '../unsafe' }), null)
assert.equal(parsePresentationEvent({ type: 'unknown', sessionId }), null)

assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'mobile')
assert.equal(classifyDevice('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), 'tablet')
assert.equal(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'desktop')
assert.equal(classifyDevice(''), 'unknown')

assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 20, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'heartbeat', activeSeconds: 10 },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 30, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)
assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 20, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'open' },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 20, visitCount: 2, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)
assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 31_535_995, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'heartbeat', activeSeconds: 10 },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 31_536_000, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)

console.log('Presentation smoke checks passed.')

assert.equal(Presentations.slug, 'presentations')
assert.equal(PresentationVisits.slug, 'presentation-visits')
assert.equal(await Presentations.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await Presentations.access?.read?.({ req: { user: { id: 1 } } } as never), true)
assert.equal(await PresentationVisits.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.create?.({ req: { user: null } } as never), false)

const presentationFields = Presentations.fields.filter((field) => 'name' in field)
type InspectedField = { blocks?: Array<{ slug: string }>; defaultValue?: unknown }
const presentationField = (name: string): InspectedField | undefined =>
  presentationFields.find((field) => 'name' in field && field.name === name) as InspectedField | undefined
const engagementField = presentationField('engagementSummary')
assert.equal((engagementField as { admin?: { components?: { Field?: string } } })?.admin?.components?.Field,
  '@/components/payload/PresentationAnalyticsDashboard#PresentationAnalyticsDashboard')
const dashboardSource = readFileSync(new URL('../src/components/payload/PresentationAnalyticsDashboard.tsx', import.meta.url), 'utf8')
assert.match(dashboardSource, /hasNextPage/)
assert.match(dashboardSource, /page \+= 1/)
assert.equal(presentationField('theme')?.defaultValue, 'light')
assert.equal(presentationField('displayMode')?.defaultValue, 'scroll')
assert.deepEqual(
  presentationField('layout')?.blocks?.map((block) => block.slug) ?? [],
  sharedEntryBlocks.map((block) => block.slug),
)

const presentationHook = Presentations.hooks?.beforeValidate?.[0]
assert.equal(typeof presentationHook, 'function')
if (typeof presentationHook === 'function') {
  const hooked = await presentationHook({
    data: { slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit` },
    operation: 'create',
  } as never)
  assert.equal(isValidPresentationShareToken(String(hooked?.shareToken)), true)
  assert.equal(hooked?.embedUrl, `https://docs.google.com/presentation/d/${deckId}/embed`)
  assert.equal(hooked?.openUrl, `https://docs.google.com/presentation/d/${deckId}/present`)
}

assert.deepEqual(toPublicPresentation({
  id: 42,
  title: 'Client deck',
  clientLabel: 'Secret client',
  slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`,
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
  introduction: 'A short introduction.',
  coverImage: { url: 'https://example.com/cover.jpg', alt: 'Cover' },
  supportingLinks: [
    { id: 'prototype', label: 'Prototype', href: 'https://example.com/prototype' },
    { id: 'unsafe', label: 'Unsafe', href: 'javascript:alert(1)' },
  ],
  createdAt: 'private',
  updatedAt: 'private',
}), {
  title: 'Client deck',
  theme: 'light',
  displayMode: 'scroll',
  layout: [],
  slides: [],
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
  introduction: 'A short introduction.',
  coverImage: { url: 'https://example.com/cover.jpg', alt: 'Cover' },
  supportingLinks: [{ id: 'prototype', label: 'Prototype', href: 'https://example.com/prototype' }],
})
assert.equal(toPublicPresentation({
  title: 'Unsafe deck',
  embedUrl: 'https://evil.example/embed',
  openUrl: 'https://evil.example/open',
}), null)

assert.deepEqual(toPublicPresentation({
  title: 'Native presentation',
  theme: 'dark',
  displayMode: 'slideshow',
  layout: [
    { id: 'hero-1', blockType: 'entryHero', headline: 'Hello', prehead: 'Welcome', private: 'remove me' },
    { id: 'unknown', blockType: 'unknownBlock', headline: 'Nope' },
  ],
  clientLabel: 'Private',
  createdAt: 'private',
}), {
  title: 'Native presentation',
  theme: 'dark',
  displayMode: 'slideshow',
  layout: [
    { id: 'hero-1', blockType: 'entryHero', headline: 'Hello', prehead: 'Welcome' },
  ],
  slides: [],
  supportingLinks: [],
})
assert.equal(toPublicPresentation({ title: 'Empty', layout: [] }), null)

// ── Google Slides deck sync ──────────────────────────────────────────────
assert.deepEqual(extractGoogleSlidesId(`https://docs.google.com/presentation/d/${deckId}/edit`), { presentationId: deckId, published: false })
assert.deepEqual(extractGoogleSlidesId(`https://docs.google.com/presentation/d/e/${publishedId}/pub`), { presentationId: publishedId, published: true })
assert.equal(extractGoogleSlidesId('https://evil.example/presentation/d/x/edit'), null)

assert.equal(deriveSlideTitle({ pageElements: [{ shape: { text: { textElements: [{ textRun: { content: '  Quarterly \n review  ' } }] } } }] }, 0), 'Quarterly review')
assert.equal(deriveSlideTitle({ pageElements: [] }, 4), 'Slide 5')
assert.deepEqual(orderGoogleSlides({ slides: [{ objectId: 'p1', pageElements: [{ shape: { text: { textElements: [{ textRun: { content: 'Intro' } }] } } }] }, { objectId: 'p2' }] }), [
  { objectId: 'p1', title: 'Intro' },
  { objectId: 'p2', title: 'Slide 2' },
])
assert.throws(() => orderGoogleSlides({ slides: [] }), /no slides/)

// A deck presentation exposes its synced slide list to the public view.
const publicDeck = toPublicPresentation({
  title: 'Deck presentation', theme: 'light', displayMode: 'slideshow',
  slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`,
  slides: [{ objectId: 'p1', title: 'Intro' }, { objectId: 'p2', title: 'Details' }],
})
assert.deepEqual(publicDeck?.slides, [{ objectId: 'p1', title: 'Intro' }, { objectId: 'p2', title: 'Details' }])
assert.equal(publicDeck?.embedUrl, `https://docs.google.com/presentation/d/${deckId}/embed`)
// Slides are ignored without a valid deck URL.
assert.deepEqual(
  toPublicPresentation({ title: 'No url', layout: [{ id: 'h', blockType: 'entryHero' }], slides: [{ objectId: 'p1', title: 'Intro' }] })?.slides,
  [],
)

// Per-slide analytics target validates a slide objectId against the deck's list.
const analyticsSlides = [{ objectId: 'p1' }, { objectId: 'p2' }]
assert.equal(isValidGoogleSlideTarget(analyticsSlides, 'p1'), true)
assert.equal(isValidGoogleSlideTarget(analyticsSlides, 'p9'), false)
assert.equal(isValidGoogleSlideTarget(undefined, 'p1'), false)
// Layout block targets still validate by id + type.
assert.equal(isValidPresentationBlockTarget([{ id: 'hero-1', blockType: 'entryHero' }], 'hero-1', 'entryHero'), true)
assert.equal(isValidPresentationBlockTarget([{ id: 'hero-1', blockType: 'entryHero' }], 'hero-1', 'entryQuote'), false)

assert.deepEqual(mergeLinkClicks([], 'prototype'), [{ linkId: 'prototype', count: 1 }])
assert.deepEqual(mergeLinkClicks([{ linkId: 'prototype', count: 2 }], 'prototype'), [{ linkId: 'prototype', count: 3 }])
assert.deepEqual(mergeLinkClicks([{ linkId: 'download', count: 1 }], 'prototype'), [
  { linkId: 'download', count: 1 },
  { linkId: 'prototype', count: 1 },
])
assert.deepEqual(mergeBlockMetrics([], { type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15 }), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewed: true, activeSeconds: 15, navigationCount: 0 },
])
const viewedAt = new Date('2026-07-18T03:00:00.000Z')
const heroEvent = { type: 'blockHeartbeat' as const, sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll' as const, activeSeconds: 15 }
assert.deepEqual(mergeBlockJourney([], heroEvent, viewedAt), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: viewedAt.toISOString() },
])
assert.equal(mergeBlockJourney(mergeBlockJourney([], heroEvent, viewedAt), heroEvent, viewedAt).length, 1)
const resultsEvent = { ...heroEvent, blockId: 'results-1', blockType: 'entryResults' }
const journey = mergeBlockJourney(mergeBlockJourney([], heroEvent, viewedAt), resultsEvent, viewedAt)
assert.equal(mergeBlockJourney(journey, heroEvent, viewedAt).length, 3)
assert.deepEqual(mergeBlockJourney([{ unsafe: true }] as never, heroEvent, viewedAt), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: viewedAt.toISOString() },
])
const fullJourney = Array.from({ length: 500 }, (_, index) => ({
  blockId: `block-${index}`, blockType: 'entryHero', displayMode: 'scroll' as const, viewedAt: viewedAt.toISOString(),
}))
assert.equal(mergeBlockJourney(fullJourney, heroEvent, viewedAt).length, 500)

assert.deepEqual(summarizePresentationVisits([]), {
  sessions: 0, totalVisits: 0, returningSessions: 0, totalActiveSeconds: 0,
  averageActiveSeconds: 0, lastSeenAt: null, linkClicks: {},
  blockMetrics: {},
})
assert.deepEqual(summarizePresentationVisits([
  { visitCount: 2, activeSeconds: 30, lastSeenAt: '2026-07-18T00:01:00.000Z', linkClicks: [{ linkId: 'prototype', count: 2 }] },
  { visitCount: 1, activeSeconds: 10, lastSeenAt: '2026-07-18T00:02:00.000Z', linkClicks: [{ linkId: 'prototype', count: 1 }] },
]), {
  sessions: 2, totalVisits: 3, returningSessions: 1, totalActiveSeconds: 40,
  averageActiveSeconds: 20, lastSeenAt: '2026-07-18T00:02:00.000Z', linkClicks: { prototype: 3 },
  blockMetrics: {},
})

const dashboard = summarizePresentationDashboard([
  { id: 'hero-1', blockType: 'entryHero' },
  { id: 'results-1', blockType: 'entryResults' },
  { id: 'quote-1', blockType: 'entryQuote' },
], [
  {
    anonymousSessionId: 'session-a', visitCount: 2, activeSeconds: 60, lastSeenAt: '2026-07-18T03:00:00.000Z', deviceCategory: 'desktop',
    blockMetrics: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'slideshow', viewed: true, activeSeconds: 20, navigationCount: 1 },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'slideshow', viewed: true, activeSeconds: 30, navigationCount: 1 },
      { blockId: 'quote-1', blockType: 'entryQuote', displayMode: 'slideshow', viewed: true, activeSeconds: 10, navigationCount: 0 },
    ],
    blockJourney: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'slideshow', viewedAt: '2026-07-18T02:58:00.000Z' },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'slideshow', viewedAt: '2026-07-18T02:59:00.000Z' },
      { blockId: 'quote-1', blockType: 'entryQuote', displayMode: 'slideshow', viewedAt: '2026-07-18T03:00:00.000Z' },
    ],
  },
  {
    anonymousSessionId: 'session-b', visitCount: 1, activeSeconds: 30, lastSeenAt: '2026-07-18T02:00:00.000Z', deviceCategory: 'mobile',
    blockMetrics: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewed: true, activeSeconds: 20, navigationCount: 0 },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'scroll', viewed: true, activeSeconds: 10, navigationCount: 0 },
      { blockId: 'deleted-1', blockType: 'entryMedia', displayMode: 'scroll', viewed: true, activeSeconds: 5, navigationCount: 0 },
    ],
    blockJourney: [{ blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: '2026-07-18T02:00:00.000Z' }],
  },
  { anonymousSessionId: 'session-c', visitCount: 1, activeSeconds: 0, lastSeenAt: 'invalid', deviceCategory: 'unknown', blockMetrics: [] },
])
assert.deepEqual(dashboard.overview, {
  viewers: 3, totalVisits: 4, averageActiveSeconds: 30, completionRate: 33, mostViewedSlide: 1,
})
assert.deepEqual(dashboard.slides.map((slide) => ({ viewers: slide.viewers, reachedPercent: slide.reachedPercent, averageActiveSeconds: slide.averageActiveSeconds, dropOffCount: slide.dropOffCount })), [
  { viewers: 2, reachedPercent: 67, averageActiveSeconds: 20, dropOffCount: 0 },
  { viewers: 2, reachedPercent: 67, averageActiveSeconds: 20, dropOffCount: 1 },
  { viewers: 1, reachedPercent: 33, averageActiveSeconds: 10, dropOffCount: null },
])
assert.equal(dashboard.sessions[0].label, 'Anonymous viewer 1')
assert.deepEqual(dashboard.sessions[0].journey.map((entry) => entry.position), [1, 2, 3])
assert.equal(dashboard.legacyActivity[0].blockId, 'deleted-1')
assert.deepEqual(summarizePresentationDashboard([{ id: 'hero-1', blockType: 'entryHero' }], []).overview, {
  viewers: 0, totalVisits: 0, averageActiveSeconds: 0, completionRate: 0, mostViewedSlide: null,
})
