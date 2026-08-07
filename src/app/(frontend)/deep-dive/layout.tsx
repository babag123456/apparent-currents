import Link from 'next/link'
import React from 'react'

/**
 * Deep Dive — “Explore what’s driving it.”
 * Evidence is organised by behavioural lens first, source second. Only
 * Demand (Semrush) is implemented; the other lenses are shown honestly as
 * not connected rather than faked.
 */

const LENSES = [
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
] as const

export default function DeepDiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8 lg:flex-row lg:gap-14">
      <nav aria-label="Evidence lenses" className="shrink-0 lg:w-56">
        <ul className="flex gap-5 overflow-x-auto lg:flex-col lg:gap-0.5">
          {LENSES.map((lens) =>
            lens.available ? (
              <li key={lens.slug} className="shrink-0">
                <Link
                  href={`/deep-dive/${lens.slug}`}
                  className="group block border-l-0 py-2 lg:border-l lg:border-charcoal/12 lg:pl-4 lg:hover:border-charcoal"
                >
                  <span className="block text-[15px] font-medium text-charcoal">{lens.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-charcoal/50">
                    {lens.question}
                  </span>
                </Link>
              </li>
            ) : (
              <li key={lens.slug} className="shrink-0 py-2 lg:border-l lg:border-charcoal/8 lg:pl-4">
                <span className="block text-[15px] font-medium text-charcoal/35">{lens.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-charcoal/30">
                  {lens.question}
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/35">
                  {lens.source} · not connected
                </span>
              </li>
            ),
          )}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
