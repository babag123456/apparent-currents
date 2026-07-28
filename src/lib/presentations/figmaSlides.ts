export type ExpandablePresentationBlock = { id: string; blockType: string } & Record<string, unknown>

type SafeFrame = { height: number; name: string; nodeId: string; width: number }

type SafeSlide = { objectId: string; title: string; imageUrl: string; width: number; height: number }

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

/**
 * Explodes each synced Google Slides deck into one native block per slide so the
 * slideshow renderer and the per-block analytics engine treat every slide as an
 * individually tracked unit — the same trick `expandFigmaSlides` uses for frames.
 */
export function expandGoogleSlideDecks(blocks: ExpandablePresentationBlock[]): ExpandablePresentationBlock[] {
  return blocks.flatMap((block) => {
    if (block.blockType !== 'entryGoogleSlidesDeck' || !Array.isArray(block.syncedSlides) || !block.syncedSlides.length) return [block]
    // Drop syncedSlides and the editable deck URL; expanded slides render the
    // re-hosted image only, keeping the source URL server-side.
    const { syncedSlides, slidesUrl, ...safeBlock } = block
    void slidesUrl
    return (syncedSlides as SafeSlide[]).map((slide) => ({
      ...safeBlock,
      id: `${block.id}--gslide--${encodeURIComponent(slide.objectId)}`,
      sourceBlockId: block.id,
      title: slide.title,
      googleSlideObjectId: slide.objectId,
      googleSlideImageUrl: slide.imageUrl,
      googleSlideWidth: slide.width,
      googleSlideHeight: slide.height,
    }))
  })
}
