import React, { Fragment } from 'react'

import { EntryHeroComponent } from './EntryHero/Component'
import { EntryCaseStudyComponent } from './EntryCaseStudy/Component'
import { EntryRichTextComponent } from './EntryRichText/Component'
import { EntryMediaComponent } from './EntryMedia/Component'
import { EntryResultsComponent } from './EntryResults/Component'
import { EntryQuoteComponent } from './EntryQuote/Component'
import { EntryImageGridComponent } from './EntryImageGrid/Component'
import { EntryVideoComponent } from './EntryVideo/Component'
import { EntrySpacerComponent } from './EntrySpacer/Component'
import { EntryDividerComponent } from './EntryDivider/Component'

const blockComponents: Record<string, React.FC<any>> = {
  entryHero: EntryHeroComponent,
  entryCaseStudy: EntryCaseStudyComponent,
  entryRichText: EntryRichTextComponent,
  entryMedia: EntryMediaComponent,
  entryResults: EntryResultsComponent,
  entryQuote: EntryQuoteComponent,
  entryImageGrid: EntryImageGridComponent,
  entryVideo: EntryVideoComponent,
  entrySpacer: EntrySpacerComponent,
  entryDivider: EntryDividerComponent,
}

interface Props {
  blocks: any[] | null | undefined
}

export const RenderEntryBlocks: React.FC<Props> = ({ blocks }) => {
  if (!blocks?.length) return null

  return (
    <Fragment>
      {blocks.map((block, i) => {
        const { blockType, ...rest } = block
        const Block = blockComponents[blockType]
        if (!Block) return null
        return <Block key={block.id ?? i} {...rest} />
      })}
    </Fragment>
  )
}
