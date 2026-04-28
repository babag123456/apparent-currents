import React from 'react'

interface Props {
  quote: string
  author?: string | null
  role?: string | null
}

export const EntryQuoteComponent: React.FC<Props> = ({ quote, author, role }) => {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <blockquote className="border-l-2 border-red pl-8">
          <p className="font-sans text-2xl md:text-3xl font-[300] leading-relaxed italic" style={{ color: 'var(--entry-text)' }}>
            &ldquo;{quote}&rdquo;
          </p>
          {(author || role) && (
            <footer className="mt-6">
              {author && (
                <p className="font-sans text-sm font-[500]" style={{ color: 'var(--entry-text)' }}>{author}</p>
              )}
              {role && (
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] mt-1" style={{ color: 'var(--entry-muted)' }}>{role}</p>
              )}
            </footer>
          )}
        </blockquote>
      </div>
    </section>
  )
}
