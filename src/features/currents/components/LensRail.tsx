'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

/**
 * Deep Dive lens navigation in the red terminal grammar: evidence lenses
 * by audience question, the active lens marked in red. Every lens is
 * navigable — pages without a live source explain themselves — but
 * unconnected sources stay labelled "not connected" here, never faked.
 */

export interface Lens {
  slug: string
  label: string
  question: string
  source: string
  connected: boolean
}

export function LensRail({ lenses }: { lenses: Lens[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Evidence lenses" className="shrink-0 lg:w-56">
      <p className="hidden border-b border-red pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-red-text lg:block">
        Evidence lenses
      </p>
      <ul className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-0">
        {lenses.map((lens) => {
          const href = `/deep-dive/${lens.slug}`
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={lens.slug} className="shrink-0 lg:border-b lg:border-charcoal/10">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="group block py-3"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-red' : 'bg-charcoal/25 group-hover:bg-charcoal/50'}`}
                  />
                  <span
                    className={`text-[15px] font-medium ${active ? 'text-red-text' : 'text-charcoal group-hover:text-red-text'}`}
                  >
                    {lens.label}
                  </span>
                </span>
                <span className="mt-0.5 block pl-3.5 text-[11px] leading-snug text-charcoal/70">
                  {lens.question}
                </span>
                {!lens.connected ? (
                  <span className="mt-1 block pl-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
                    {lens.source} · not connected
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
