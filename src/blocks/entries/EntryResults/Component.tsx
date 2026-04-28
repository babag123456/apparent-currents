import React from 'react'

interface ResultItem {
  value: string
  label: string
  id?: string | null
}

interface Props {
  intro?: string | null
  results: ResultItem[]
}

export const EntryResultsComponent: React.FC<Props> = ({ intro, results }) => {
  if (!results?.length) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        {intro && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--entry-muted)' }}>
            {intro}
          </p>
        )}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          {results.map((r, i) => (
            <div key={r.id ?? i}>
              <p className="font-sans text-4xl md:text-5xl font-[500] tracking-tight" style={{ color: 'var(--entry-text)' }}>
                {r.value}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--entry-muted)' }}>
                {r.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
