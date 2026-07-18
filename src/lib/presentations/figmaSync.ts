export type FigmaDocumentNode = {
  absoluteBoundingBox?: { height?: number; width?: number; x?: number; y?: number }
  children?: FigmaDocumentNode[]
  id: string
  name?: string
  reactions?: Array<{ action?: { destinationId?: string | null; type?: string } }>
  type?: string
}

export type SyncedFigmaFrame = {
  height: number
  name: string
  nodeId: string
  width: number
}

function normaliseNodeId(value: string): string {
  return value.replace('-', ':')
}

function indexNodes(node: FigmaDocumentNode, index: Map<string, FigmaDocumentNode>): void {
  index.set(normaliseNodeId(node.id), node)
  node.children?.forEach((child) => indexNodes(child, index))
}

function collectDestinations(node: FigmaDocumentNode, destinations: Set<string>): void {
  for (const reaction of node.reactions ?? []) {
    const destinationId = reaction.action?.destinationId
    if (destinationId) destinations.add(normaliseNodeId(destinationId))
  }
  node.children?.forEach((child) => collectDestinations(child, destinations))
}

export function orderFigmaPrototypeFrames(
  document: FigmaDocumentNode,
  startNodeId: string,
): SyncedFigmaFrame[] {
  const index = new Map<string, FigmaDocumentNode>()
  indexNodes(document, index)
  const firstId = normaliseNodeId(startNodeId)
  if (!index.has(firstId)) throw new Error('Figma prototype starting frame was not found.')

  const firstNode = index.get(firstId) as FigmaDocumentNode
  const firstDestinations = new Set<string>()
  collectDestinations(firstNode, firstDestinations)
  if (firstDestinations.size === 0) {
    const canvas = document.type === 'CANVAS'
      ? document
      : [...index.values()].find((node) => node.type === 'CANVAS' && node.children?.some((child) => normaliseNodeId(child.id) === firstId))
    const ordered = (canvas?.children ?? [])
      .filter((node) => node.type === 'FRAME')
      .sort((left, right) =>
        (left.absoluteBoundingBox?.y ?? 0) - (right.absoluteBoundingBox?.y ?? 0) ||
        (left.absoluteBoundingBox?.x ?? 0) - (right.absoluteBoundingBox?.x ?? 0))
    const startIndex = ordered.findIndex((node) => normaliseNodeId(node.id) === firstId)
    if (startIndex >= 0) return ordered.slice(startIndex).map((node, index) => ({
      height: Math.max(0, node.absoluteBoundingBox?.height ?? 0),
      name: node.name?.trim() || `Frame ${index + 1}`,
      nodeId: normaliseNodeId(node.id),
      width: Math.max(0, node.absoluteBoundingBox?.width ?? 0),
    }))
  }

  const frames: SyncedFigmaFrame[] = []
  const visited = new Set<string>()
  let currentId: string | undefined = firstId
  while (currentId) {
    if (visited.has(currentId)) throw new Error('Figma prototype contains a loop.')
    visited.add(currentId)
    const node = index.get(currentId)
    if (!node) throw new Error(`Figma prototype destination "${currentId}" was not found.`)
    frames.push({
      height: Math.max(0, node.absoluteBoundingBox?.height ?? 0),
      name: node.name?.trim() || `Frame ${frames.length + 1}`,
      nodeId: currentId,
      width: Math.max(0, node.absoluteBoundingBox?.width ?? 0),
    })
    const destinations = new Set<string>()
    collectDestinations(node, destinations)
    if (destinations.size > 1) throw new Error(`Figma prototype branches at "${node.name ?? currentId}".`)
    currentId = destinations.values().next().value
  }
  if (!frames.length) throw new Error('Figma prototype contains no frames.')
  return frames
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>

export async function fetchFigmaPrototypeFrames({
  fetchImpl = fetch,
  fileKey,
  pageId,
  startNodeId,
  token,
}: {
  fetchImpl?: FetchLike
  fileKey: string
  pageId?: string
  startNodeId: string
  token: string
}): Promise<SyncedFigmaFrame[]> {
  const endpoint = new URL(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}${pageId ? '/nodes' : ''}`)
  if (pageId) {
    endpoint.searchParams.set('ids', pageId)
    endpoint.searchParams.set('depth', '1')
  }
  const response = await fetchImpl(endpoint, {
    headers: { 'X-Figma-Token': token },
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Figma denied access to this prototype.')
    if (response.status === 429) throw new Error('Figma rate-limited the prototype sync. Try again shortly.')
    throw new Error('Figma could not sync this prototype.')
  }
  let result: { document?: FigmaDocumentNode; nodes?: Record<string, { document?: FigmaDocumentNode }> }
  try {
    result = await response.json() as typeof result
  } catch {
    throw new Error('Figma returned an invalid prototype response.')
  }
  const document = pageId ? result.nodes?.[pageId]?.document : result.document
  if (!document) throw new Error('Figma returned an invalid prototype response.')
  return orderFigmaPrototypeFrames(document, startNodeId)
}
