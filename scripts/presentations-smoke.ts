import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  classifyDevice,
  mergeVisitMetrics,
  parsePresentationEvent,
} from '../src/lib/presentations/analytics.ts'
import {
  parseGoogleSlidesUrl,
  validateGoogleSlidesUrl,
} from '../src/lib/presentations/googleSlides.ts'
import {
  parseFigmaPrototypeUrl,
  validateFigmaPrototypeUrl,
} from '../src/lib/presentations/figma.ts'
import {
  createPresentationShareToken,
  isValidPresentationShareToken,
} from '../src/lib/presentations/shareToken.ts'
import { PresentationVisits } from '../src/payload/collections/PresentationVisits.ts'
import { Presentations } from '../src/payload/collections/Presentations.ts'
import { sharedEntryBlocks } from '../src/blocks/entries/sharedBlocks.ts'
import { mergeBlockJourney, mergeBlockMetrics, mergeLinkClicks, toPublicPresentation } from '../src/lib/presentations/repository.ts'
import { summarizePresentationVisits } from '../src/lib/presentations/summary.ts'
import { summarizePresentationDashboard } from '../src/lib/presentations/dashboard.ts'
import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../src/lib/presentations/slideshow.ts'

const deckId = '1AbCdEfGhIjKlMnOpQrStUvWxYz_123456'
const publishedId = '2PACX-1vQwertyUiopAsdfGhjkLzxcVbnm123456'
const figmaKey = 'AbCdEfGhIjKlMnOpQrStUv'

assert.equal(nextSlide(0, 3), 1)
assert.equal(nextSlide(2, 3), 2)
assert.equal(previousSlide(2, 3), 1)
assert.equal(previousSlide(0, 3), 0)
assert.equal(isInteractiveNavigationTarget({ closest: () => ({}) } as unknown as EventTarget), true)
assert.equal(isInteractiveNavigationTarget({ closest: () => null } as unknown as EventTarget), false)

assert.deepEqual(sharedEntryBlocks.map((block) => block.slug), [
  'entryHero', 'entryCaseStudy', 'entryRichText', 'entryMedia', 'entryResults', 'entryQuote',
  'entryImageGrid', 'entryVideo', 'entryButton', 'entrySpacer', 'entryDivider', 'entryGoogleSlides',
  'entryFigmaPrototype',
])

const figmaBlock = sharedEntryBlocks.find((block) => block.slug === 'entryFigmaPrototype')
assert.ok(figmaBlock)
const figmaFields = figmaBlock.fields.filter((field) => 'name' in field) as Array<{
  defaultValue?: unknown
  name: string
  options?: Array<{ value: unknown }>
  required?: boolean
}>
assert.equal(figmaFields.find((field) => field.name === 'prototypeUrl')?.required, true)
assert.equal(figmaFields.find((field) => field.name === 'interfaceStyle')?.defaultValue, 'minimal')
assert.deepEqual(
  figmaFields.find((field) => field.name === 'interfaceStyle')?.options?.map((option) => option.value),
  ['minimal', 'full'],
)
const figmaComponentSource = readFileSync(
  new URL('../src/blocks/entries/EntryFigmaPrototype/Component.tsx', import.meta.url),
  'utf8',
)
assert.match(figmaComponentSource, /allowFullScreen/)
assert.match(figmaComponentSource, /strict-origin-when-cross-origin/)
assert.match(figmaComponentSource, /Open prototype in Figma/)

for (const value of [
  `https://docs.google.com/presentation/d/${deckId}/edit#slide=id.p`,
  `https://docs.google.com/presentation/d/${deckId}/present`,
  `https://docs.google.com/presentation/d/e/${publishedId}/pub?start=false`,
]) {
  assert.equal(validateGoogleSlidesUrl(value), true, `${value} should validate`)
}

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

for (const value of [
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`,
  `https://www.figma.com/design/${figmaKey}/Client-Prototype?node-id=1-2`,
  `https://figma.com/file/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4`,
]) {
  assert.equal(validateFigmaPrototypeUrl(value), true, `${value} should validate`)
}

const minimalFigma = parseFigmaPrototypeUrl(
  `https://figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&utm_source=unsafe`,
)
assert.equal(minimalFigma?.openUrl, `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`)
assert.equal(minimalFigma?.embedUrl, `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(minimalFigma.openUrl)}&hide-ui=1`)

const fullFigma = parseFigmaPrototypeUrl(
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4`,
  'full',
)
assert.equal(fullFigma?.openUrl, `https://www.figma.com/proto/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4`)
assert.equal(fullFigma?.embedUrl, `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(fullFigma.openUrl)}`)

for (const value of [
  `http://www.figma.com/proto/${figmaKey}/Test`,
  `https://figma.example/proto/${figmaKey}/Test`,
  `https://evil.figma.com/proto/${figmaKey}/Test`,
  `https://user:pass@www.figma.com/proto/${figmaKey}/Test`,
  'https://www.figma.com/community/file/123',
  'javascript:alert(1)',
]) {
  assert.equal(parseFigmaPrototypeUrl(value), null)
  assert.notEqual(validateFigmaPrototypeUrl(value), true)
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
    { id: 'slides-1', blockType: 'entryGoogleSlides', title: 'Research', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`, arbitrary: true },
    { id: 'bad-slides', blockType: 'entryGoogleSlides', slidesUrl: 'https://evil.example/deck' },
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
    { id: 'slides-1', blockType: 'entryGoogleSlides', title: 'Research', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit` },
  ],
  supportingLinks: [],
})
assert.equal(toPublicPresentation({ title: 'Empty', layout: [] }), null)

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
