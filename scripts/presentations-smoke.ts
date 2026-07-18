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

const deckId = '1AbCdEfGhIjKlMnOpQrStUvWxYz_123456'
const publishedId = '2PACX-1vQwertyUiopAsdfGhjkLzxcVbnm123456'

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
