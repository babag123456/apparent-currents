import React from 'react'

interface ResultItem {
  value: string
  label: string
  id?: string | null
}

interface Props {
  prehead?: string | null
  headline?: string | null
  intro?: string | null
  columns?: '2' | '3' | null
  results: ResultItem[]
}

export const EntryResultsComponent: React.FC<Props> = ({ prehead, headline, intro, columns = '3', results }) => {
  if (!results?.length) return null

  const columnClass = columns === '2' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'
  return (
    <section>
      <div className="mx-auto max-w-4xl px-6">
        {(prehead || headline || intro) && (
          <div className="mb-10">
            {prehead && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red mb-3">
                {prehead}
              </p>
            )}
            {headline && (
              <h2 className="font-sans text-3xl md:text-5xl font-[500] leading-[1.1] tracking-tight" style={{ color: 'var(--entry-text)' }}>
                {headline}
              </h2>
            )}
            {intro && (
              <p className="mt-5 text-base sm:text-lg md:text-xl font-[300] leading-relaxed whitespace-pre-line" style={{ color: 'var(--entry-muted)' }}>
                {intro}
              </p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 gap-8 ${columnClass} md:gap-12`}>
          {results.map((r, i) => (
            <div key={r.id ?? i}>
              <p className="font-sans text-4xl md:text-5xl font-[500] tracking-tight" style={{ color: 'var(--entry-text)' }}>
                {r.value}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed break-words" style={{ color: 'var(--entry-muted)' }}>
                {r.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
