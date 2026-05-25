const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function validatePublicHref(value?: string | null): true | string {
  if (!value) return true

  const trimmed = value.trim()

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) return 'Protocol-relative URLs are not allowed.'
    return true
  }

  try {
    const url = new URL(trimmed)
    if (ALLOWED_PROTOCOLS.has(url.protocol)) return true
    return 'URL must use http://, https://, or a root-relative path.'
  } catch {
    return 'URL must use http://, https://, or a root-relative path.'
  }
}

export function getSafePublicHref(value?: string | null): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (validatePublicHref(trimmed) !== true) return null

  return trimmed
}
