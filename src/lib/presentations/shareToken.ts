import { randomBytes } from 'node:crypto'

const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/

export function createPresentationShareToken(): string {
  return randomBytes(24).toString('base64url')
}

export function isValidPresentationShareToken(value: string): boolean {
  return SHARE_TOKEN_PATTERN.test(value)
}
