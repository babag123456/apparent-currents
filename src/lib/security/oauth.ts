import { randomBytes } from 'crypto'

export function createSecureOAuthState() {
  return randomBytes(32).toString('hex')
}
