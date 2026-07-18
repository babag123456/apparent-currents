import { parseFigmaPrototypeUrl } from './figma.ts'
import { fetchFigmaPrototypeFrames, type SyncedFigmaFrame } from './figmaSync.ts'

type FigmaBlock = Record<string, unknown> & {
  blockType?: string
  figmaSyncedAt?: string
  figmaSyncError?: string
  forceFigmaSync?: boolean
  id?: string
  prototypeUrl?: string
  syncedFrames?: SyncedFigmaFrame[]
}

type FetchFrames = typeof fetchFigmaPrototypeFrames

export async function syncFigmaBlocks({
  fetchFrames = fetchFigmaPrototypeFrames,
  layout,
  now = new Date(),
  previousLayout = [],
  token,
}: {
  fetchFrames?: FetchFrames
  layout: FigmaBlock[]
  now?: Date
  previousLayout?: FigmaBlock[]
  token: string
}): Promise<FigmaBlock[]> {
  const previousById = new Map(previousLayout.flatMap((block) => block.id ? [[block.id, block]] : []))
  return Promise.all(layout.map(async (block) => {
    if (block.blockType !== 'entryFigmaPrototype') return block
    const previous = block.id ? previousById.get(block.id) : undefined
    const existingFrames = block.syncedFrames?.length ? block.syncedFrames : previous?.syncedFrames
    const unchanged = Boolean(existingFrames?.length && previous?.prototypeUrl === block.prototypeUrl)
    if (unchanged && !block.forceFigmaSync) return { ...block, syncedFrames: existingFrames }
    if (!token) throw new Error('FIGMA_ACCESS_TOKEN is required to sync Figma prototypes.')
    const parsed = typeof block.prototypeUrl === 'string' ? parseFigmaPrototypeUrl(block.prototypeUrl) : null
    if (!parsed?.startNodeId) throw new Error('Figma prototype URL must include a starting node.')
    try {
      const syncedFrames = await fetchFrames({ fileKey: parsed.fileKey, pageId: parsed.pageId, startNodeId: parsed.startNodeId, token })
      return {
        ...block,
        syncedFrames,
        figmaSyncedAt: now.toISOString(),
        figmaSyncError: undefined,
        forceFigmaSync: undefined,
      }
    } catch (error) {
      if (!unchanged || !existingFrames?.length) throw error
      return {
        ...block,
        syncedFrames: existingFrames,
        figmaSyncedAt: previous?.figmaSyncedAt ?? block.figmaSyncedAt,
        figmaSyncError: error instanceof Error ? error.message : 'Figma could not sync this prototype.',
        forceFigmaSync: undefined,
      }
    }
  }))
}
