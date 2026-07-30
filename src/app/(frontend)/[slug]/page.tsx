import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import { RenderEntryBlocks } from '../../../blocks/entries/RenderEntryBlocks'
import { getPresentationEmbed } from '../../../lib/presentations/repository'
import { BackToTopButton } from '../../../components/BackToTopButton'
import { EntryThemeProvider } from '../../../components/entry-theme/EntryThemeProvider'
import { EntryThemeToggle } from '../../../components/entry-theme/EntryThemeToggle'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

type EntryDoc = {
  title: string
  awardBody?: string | null
  category?: string | null
  theme?: 'light' | 'dark' | null
  layout?: Array<Record<string, unknown>> | null
}

const getEntry = cache(async (slug: string): Promise<EntryDoc | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'award-entries',
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
        { archived: { not_equals: true } },
      ],
    },
    depth: 2,
    limit: 1,
    pagination: false,
  })

  const entry = (result.docs[0] as unknown as EntryDoc | undefined) ?? null
  if (entry?.layout) {
    // Resolve each Google Slide Embed module's presentation to its live embed
    // here (server-side, overrideAccess) so the block component stays sync.
    await Promise.all(
      entry.layout.map(async (block) => {
        if (block?.blockType === 'entryGoogleSlidesDeck' && block.presentation) {
          block.presentationEmbed = await getPresentationEmbed(block.presentation)
        }
      }),
    )
  }
  return entry
})

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await getEntry(slug)

  if (!entry) return notFound()

  return (
    <EntryThemeProvider initialTheme={entry.theme ?? 'light'}>
      <EntryThemeToggle />
      <main>
        <RenderEntryBlocks blocks={entry.layout ?? undefined} />
      </main>
      <BackToTopButton />
    </EntryThemeProvider>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = await getEntry(slug)

  if (!entry) return { title: 'Not Found' }

  return {
    title: entry.title,
    description: `${entry.awardBody ?? ''} ${entry.category ?? ''}`.trim() || undefined,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-image-preview': 'none',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}
