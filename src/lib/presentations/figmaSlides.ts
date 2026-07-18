export type ExpandablePresentationBlock = { id: string; blockType: string } & Record<string, unknown>

type SafeFrame = { height: number; name: string; nodeId: string; width: number }

export function expandFigmaSlides(blocks: ExpandablePresentationBlock[]): ExpandablePresentationBlock[] {
  return blocks.flatMap((block) => {
    if (block.blockType !== 'entryFigmaPrototype' || !Array.isArray(block.syncedFrames)) return [block]
    const { syncedFrames, ...safeBlock } = block
    return (syncedFrames as SafeFrame[]).map((frame) => ({
      ...safeBlock,
      id: `${block.id}--figma--${encodeURIComponent(frame.nodeId)}`,
      sourceBlockId: block.id,
      title: frame.name,
      figmaFrameNodeId: frame.nodeId,
    }))
  })
}
