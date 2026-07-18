const FIGMA_HOSTS = new Set(['figma.com', 'www.figma.com'])
const FIGMA_PATH_TYPES = new Set(['proto', 'design', 'file'])
const FILE_KEY_PATTERN = /^[A-Za-z0-9]{10,}$/
const ALLOWED_QUERY_KEYS = [
  'node-id',
  'starting-point-node-id',
  'page-id',
  'scaling',
  'content-scaling',
] as const

export type FigmaInterfaceStyle = 'minimal' | 'full'

export type FigmaPrototypeUrls = {
  embedUrl: string
  openUrl: string
}

export function parseFigmaPrototypeUrl(
  value: string,
  interfaceStyle: FigmaInterfaceStyle = 'minimal',
): FigmaPrototypeUrls | null {
  let source: URL

  try {
    source = new URL(value.trim())
  } catch {
    return null
  }

  if (source.protocol !== 'https:' || source.username || source.password || !FIGMA_HOSTS.has(source.hostname)) {
    return null
  }

  const segments = source.pathname.split('/').filter(Boolean)
  const [pathType, fileKey] = segments
  if (!FIGMA_PATH_TYPES.has(pathType) || !FILE_KEY_PATTERN.test(fileKey ?? '')) return null

  const open = new URL('https://www.figma.com')
  open.pathname = `/${segments.join('/')}`
  for (const key of ALLOWED_QUERY_KEYS) {
    const parameter = source.searchParams.get(key)
    if (parameter) open.searchParams.set(key, parameter)
  }
  open.searchParams.set('scaling', 'contain')

  const embed = new URL('https://www.figma.com/embed')
  embed.searchParams.set('embed_host', 'share')
  embed.searchParams.set('url', open.toString())
  if (interfaceStyle !== 'full') embed.searchParams.set('hide-ui', '1')

  return { embedUrl: embed.toString(), openUrl: open.toString() }
}

export function validateFigmaPrototypeUrl(value?: string | null): true | string {
  if (!value?.trim()) return 'Figma prototype URL is required.'
  return parseFigmaPrototypeUrl(value)
    ? true
    : 'Enter a valid HTTPS Figma prototype or file sharing URL.'
}
