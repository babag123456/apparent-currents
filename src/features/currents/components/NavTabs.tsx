'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const TABS = [
  { href: '/surface', label: 'Surface' },
  { href: '/deep-dive', label: 'Deep Dive' },
] as const

/**
 * Primary navigation as Apparent-site pill controls: red outline pills,
 * the active surface filled red.
 */
export function NavTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium leading-none transition-colors sm:px-4 sm:text-[13.5px] ${
              active
                ? 'border-red-text bg-red-text text-cream'
                : 'border-red/70 text-red-text hover:bg-red/10'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
