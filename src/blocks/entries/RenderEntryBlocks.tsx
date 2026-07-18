/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { EntryButtonComponent } from './EntryButton/Component'
import { EntryGoogleSlidesComponent } from './EntryGoogleSlides/Component'

type EntryBlock = {
  id?: string | number | null
  blockType?: string
} & Record<string, unknown>

const blockComponents: Record<string, React.ComponentType<any>> = {
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
  entryButton: EntryButtonComponent,
  entryGoogleSlides: EntryGoogleSlidesComponent,
}

interface Props {
  blocks: EntryBlock[] | null | undefined
}

export const RenderEntryBlocks: React.FC<Props> = ({ blocks }) => {
  if (!blocks?.length) return null

  return (
    <Fragment>
      {blocks.map((block, i) => {
        const { blockType, ...rest } = block
        const Block = blockType ? blockComponents[blockType] : null
        if (!Block) return null
        return <Block key={block.id ?? i} {...rest} />
      })}
    </Fragment>
  )
}
