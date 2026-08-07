'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const TABS = [
  { href: '/surface', label: 'Surface', subhead: 'What matters now.' },
  { href: '/deep-dive', label: 'Deep Dive', subhead: 'Explore what’s driving it.' },
] as const

export function NavTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="flex items-stretch gap-5 sm:gap-8">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`group flex flex-col justify-center gap-0.5 border-b-2 pb-3 pt-4 transition-colors ${
              active
                ? 'border-red text-charcoal'
                : 'border-transparent text-charcoal/55 hover:text-charcoal'
            }`}
          >
            <span className="text-[15px] font-medium leading-none">{tab.label}</span>
            <span
              className={`hidden text-[11px] leading-tight sm:block ${
                active ? 'text-charcoal/60' : 'text-charcoal/40 group-hover:text-charcoal/55'
              }`}
            >
              {tab.subhead}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
