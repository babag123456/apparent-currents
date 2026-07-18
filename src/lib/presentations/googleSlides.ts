const GOOGLE_SLIDES_HOSTNAME = 'docs.google.com'
const PRESENTATION_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/

export type GoogleSlidesUrls = {
  embedUrl: string
  openUrl: string
}

export function parseGoogleSlidesUrl(value: string): GoogleSlidesUrls | null {
  let url: URL

  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:' || url.hostname !== GOOGLE_SLIDES_HOSTNAME) {
    return null
  }

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'presentation' || segments[1] !== 'd') {
    return null
  }

  const published = segments[2] === 'e'
  const presentationId = published ? segments[3] : segments[2]

  if (!presentationId || !PRESENTATION_ID_PATTERN.test(presentationId)) {
    return null
  }

  const basePath = published
    ? `/presentation/d/e/${presentationId}`
    : `/presentation/d/${presentationId}`

  return {
    embedUrl: `https://${GOOGLE_SLIDES_HOSTNAME}${basePath}/embed`,
    openUrl: `https://${GOOGLE_SLIDES_HOSTNAME}${basePath}/${published ? 'pub' : 'present'}`,
  }
}

export function validateGoogleSlidesUrl(value?: string | null): true | string {
  if (!value?.trim()) {
    return 'Google Slides URL is required.'
  }

  return parseGoogleSlidesUrl(value)
    ? true
    : 'Enter a valid https://docs.google.com/presentation sharing or published URL.'
}
