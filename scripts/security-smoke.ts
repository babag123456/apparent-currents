import assert from 'node:assert/strict'

import { isGoogleEmailAllowed } from '../src/lib/security/googleAllowlist.ts'
import { createSecureOAuthState } from '../src/lib/security/oauth.ts'
import { getSafePublicHref, validatePublicHref } from '../src/lib/security/url.ts'
import { getDirectUploadThingContext } from '../src/lib/uploadthing.ts'
import { parseGoogleSlidesUrl } from '../src/lib/presentations/googleSlides.ts'
import { isValidPresentationShareToken } from '../src/lib/presentations/shareToken.ts'
import { Presentations } from '../src/payload/collections/Presentations.ts'
import { PresentationVisits } from '../src/payload/collections/PresentationVisits.ts'
import { parsePresentationEvent } from '../src/lib/presentations/analytics.ts'

function assertAcceptedHref(value: string) {
  assert.equal(validatePublicHref(value), true, `${value} should validate`)
  assert.equal(getSafePublicHref(value), value.trim(), `${value} should remain usable`)
}

function assertRejectedHref(value: string) {
  assert.notEqual(validatePublicHref(value), true, `${value} should be rejected`)
  assert.equal(getSafePublicHref(value), null, `${value} should not render`)
}

function assertUploadContextAccepted(url: string) {
  const result = getDirectUploadThingContext({
    clientUploadContext: {
      key: 'file-key',
      size: 1024,
      url,
    },
  })

  assert.equal(result?.url, url, `${url} should be accepted`)
}

function assertUploadContextRejected(url: string) {
  const result = getDirectUploadThingContext({
    clientUploadContext: {
      key: 'file-key',
      size: 1024,
      url,
    },
  })

  assert.equal(result, null, `${url} should be rejected`)
}

assertAcceptedHref('https://example.com')
assertAcceptedHref('http://example.com/path')
assertAcceptedHref('/case-study')

assertRejectedHref('javascript:alert(1)')
assertRejectedHref('data:text/html,<script>alert(1)</script>')
assertRejectedHref('vbscript:msgbox(1)')
assertRejectedHref('//evil.example/path')
assertRejectedHref('not a url')

assertUploadContextRejected('http://utfs.io/file')
assertUploadContextRejected('https://127.0.0.1/admin')
assertUploadContextRejected('https://metadata.google.internal/')
assertUploadContextRejected('not a url')
assertUploadContextAccepted('https://utfs.io/f/example')
assertUploadContextAccepted('https://abc.ufs.sh/f/example')

const state = createSecureOAuthState()
assert.match(state, /^[0-9a-f]{64}$/)

assert.equal(
  isGoogleEmailAllowed({
    allowedDomain: 'company.com',
    allowedEmails: [],
    email: 'user@company.com',
  }),
  true,
)
assert.equal(
  isGoogleEmailAllowed({
    allowedDomain: 'company.com',
    allowedEmails: [],
    email: 'user@company.com.attacker.com',
  }),
  false,
)
assert.equal(
  isGoogleEmailAllowed({
    allowedEmails: ['Admin@Company.com'],
    email: 'admin@company.com',
  }),
  true,
)

assert.equal(isValidPresentationShareToken('guessable'), false)
assert.equal(
  parseGoogleSlidesUrl('https://evil.example/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_123456/edit'),
  null,
)
assert.equal(await Presentations.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await Presentations.access?.read?.({ req: { user: { id: 1 } } } as never), true)
assert.equal(await PresentationVisits.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.read?.({ req: { user: { id: 1 } } } as never), true)
assert.equal(await PresentationVisits.access?.create?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.update?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.delete?.({ req: { user: null } } as never), false)
const analyticsSessionId = crypto.randomUUID()
for (const extra of [
  { viewedAt: '2026-07-18T00:00:00.000Z' },
  { authoredText: 'private content' },
  { url: 'https://example.com/private' },
  { clientLabel: 'Secret client' },
]) {
  assert.equal(parsePresentationEvent({ type: 'blockHeartbeat', sessionId: analyticsSessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15, ...extra }), null)
}

console.log('Security smoke checks passed.')
