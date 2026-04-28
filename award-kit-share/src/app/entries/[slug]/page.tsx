import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import type { Metadata } from 'next/types'

import { RenderEntryBlocks } from '../../../blocks/entries/RenderEntryBlocks'
import { EntryThemeProvider } from '../EntryThemeProvider'
import { EntryThemeToggle } from '../EntryThemeToggle'

export const revalidate = 3600

const getEntry = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'award-entries',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    pagination: false,
  })
  return result.docs[0] ?? null
})

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'award-entries',
    limit: 200,
    pagination: false,
  })
  return result.docs.map((doc) => ({ slug: doc.slug }))
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await getEntry(slug)
  if (!entry) return notFound()

  const theme = (entry as any).theme ?? 'light'

  return (
    <EntryThemeProvider initialTheme={theme}>
      <EntryThemeToggle />
      <main>
        <RenderEntryBlocks blocks={(entry as any).layout} />
      </main>
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
  if (!entry) return { title: 'Entry' }
  return {
    title: entry.title,
    description: `${(entry as any).awardBody ?? ''} ${(entry as any).category ?? ''}`.trim() || undefined,
  }
}
