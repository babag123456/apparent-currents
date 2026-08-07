import assert from 'node:assert/strict'

import { isGoogleEmailAllowed } from '../src/lib/security/googleAllowlist.ts'
import { createSecureOAuthState } from '../src/lib/security/oauth.ts'
import {
  areApexWWWOriginSiblings,
  getApexWWWCookieDomain,
} from '../src/lib/security/origin.ts'
import { getSafePublicHref, validatePublicHref } from '../src/lib/security/url.ts'

function assertAcceptedHref(value: string) {
  assert.equal(validatePublicHref(value), true, `${value} should validate`)
  assert.equal(getSafePublicHref(value), value.trim(), `${value} should remain usable`)
}

function assertRejectedHref(value: string) {
  assert.notEqual(validatePublicHref(value), true, `${value} should be rejected`)
  assert.equal(getSafePublicHref(value), null, `${value} should not render`)
}

assertAcceptedHref('https://example.com')
assertAcceptedHref('http://example.com/path')
assertAcceptedHref('/case-study')

assertRejectedHref('javascript:alert(1)')
assertRejectedHref('data:text/html,<script>alert(1)</script>')
assertRejectedHref('vbscript:msgbox(1)')
assertRejectedHref('//evil.example/path')
assertRejectedHref('not a url')

assert.equal(
  areApexWWWOriginSiblings('https://www.example.com', 'https://example.com'),
  true,
)
assert.equal(
  areApexWWWOriginSiblings('http://www.example.com', 'https://example.com'),
  false,
)
assert.equal(
  areApexWWWOriginSiblings('https://login.example.com', 'https://example.com'),
  false,
)
assert.equal(
  getApexWWWCookieDomain('https://www.example.com', 'https://example.com'),
  'example.com',
)
assert.equal(
  getApexWWWCookieDomain('https://login.example.com', 'https://example.com'),
  null,
)

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

console.log('Security smoke checks passed.')
