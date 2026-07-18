import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import { PresentationView } from '../../../../components/presentations/PresentationView'
import { getPublicPresentation } from '../../../../lib/presentations/repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const getPresentation = cache(getPublicPresentation)

export default async function PresentationPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params
  const presentation = await getPresentation(shareToken)
  if (!presentation) return notFound()
  return <PresentationView presentation={presentation} />
}

export async function generateMetadata({ params }: { params: Promise<{ shareToken: string }> }): Promise<Metadata> {
  const { shareToken } = await params
  const presentation = await getPresentation(shareToken)
  if (!presentation) return { title: 'Not Found' }
  return {
    title: presentation.title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true, 'max-image-preview': 'none', 'max-snippet': -1, 'max-video-preview': -1 },
    },
  }
}
