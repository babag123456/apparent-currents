import assert from 'node:assert/strict'

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
  createPresentationShareToken,
  isValidPresentationShareToken,
} from '../src/lib/presentations/shareToken.ts'
import { PresentationVisits } from '../src/payload/collections/PresentationVisits.ts'
import { Presentations } from '../src/payload/collections/Presentations.ts'
import { sharedEntryBlocks } from '../src/blocks/entries/sharedBlocks.ts'
import { mergeBlockMetrics, mergeLinkClicks, toPublicPresentation } from '../src/lib/presentations/repository.ts'
import { summarizePresentationVisits } from '../src/lib/presentations/summary.ts'
import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../src/lib/presentations/slideshow.ts'

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
  'entryImageGrid', 'entryVideo', 'entryButton', 'entrySpacer', 'entryDivider', 'entryGoogleSlides',
])

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
