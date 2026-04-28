import Link from 'next/link'

import { RotatingWordmark } from './RotatingWordmark'

export default function HomePage() {
  return (
    <main className="homepage-shell">
      <div className="homepage-orb homepage-orb-left" />
      <div className="homepage-orb homepage-orb-right" />
      <div className="homepage-grid" />
      <Link
        className="fixed right-6 top-6 z-20 inline-flex min-w-28 items-center justify-center border border-charcoal/15 bg-[rgba(248,244,241,0.82)] px-4 py-3 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-charcoal backdrop-blur-md transition hover:-translate-y-px hover:border-charcoal hover:bg-charcoal hover:text-cream max-sm:right-4 max-sm:top-4 max-sm:min-w-0"
        href="/admin"
      >
        admin
      </Link>

      <section className="homepage-stage">
        <div className="homepage-lockup">
          <h1 className="homepage-wordmark">
            <span className="homepage-wordmark-static">thisisour.</span>
            <RotatingWordmark />
          </h1>
        </div>
      </section>
    </main>
  )
}
