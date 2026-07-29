import React from 'react'

import { RenderEntryBlocks } from '../../blocks/entries/RenderEntryBlocks'

export type PresentationBlock = { id: string; blockType: string } & Record<string, unknown>

export function PresentationBlocks({ blocks }: { blocks: PresentationBlock[] }) {
  return blocks.map((block) => (
    <section
      className="presentation-block"
      data-presentation-block-id={block.id}
      data-presentation-block-type={block.blockType}
      key={block.id}
    >
      <RenderEntryBlocks blocks={[block]} />
    </section>
  ))
}
