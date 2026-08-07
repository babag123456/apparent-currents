import React from 'react'

import { LensRail, type Lens } from '../../../features/currents/components/LensRail.tsx'

/**
 * Deep Dive — “Explore what’s driving it.”
 * Evidence is organised by behavioural lens first, source second. Only
 * Demand (Semrush) is implemented; the other lenses are shown honestly as
 * not connected rather than faked.
 */

const LENSES: Lens[] = [
  {
    slug: 'demand',
    label: 'Demand',
    question: 'What people are actively looking for',
    source: 'Semrush',
    available: true,
  },
  {
    slug: 'conversation',
    label: 'Conversation',
    question: 'What people are talking about',
    source: 'Brandwatch',
    available: false,
  },
  {
    slug: 'behaviour',
    label: 'Behaviour',
    question: 'What people do on owned properties',
    source: 'GA4',
    available: false,
  },
  {
    slug: 'people',
    label: 'People',
    question: 'Who the audience is and what they care about',
    source: 'GWI',
    available: false,
  },
]

export default function DeepDiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8 lg:flex-row lg:gap-14">
      <LensRail lenses={LENSES} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
