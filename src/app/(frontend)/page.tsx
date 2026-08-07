import Link from 'next/link'
import React from 'react'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream text-charcoal">
      <p className="font-mono text-sm uppercase tracking-[0.3em]">Currents</p>
      <p className="max-w-sm text-center text-sm text-charcoal/70">
        Foundation build. Product surfaces arrive in a later phase.
      </p>
      <Link
        href="/admin"
        className="font-mono text-xs uppercase tracking-widest underline underline-offset-4 hover:text-red"
      >
        Admin
      </Link>
    </main>
  )
}
