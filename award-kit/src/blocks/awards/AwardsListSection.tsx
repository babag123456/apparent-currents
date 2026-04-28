import React from 'react'

export interface AwardListItem {
  id?: string
  title: string
  awardBody: string
  category?: string | null
  year: number
  result: 'won' | 'finalist' | 'shortlisted' | string
}

interface AwardsListSectionProps {
  awards: AwardListItem[]
  heading?: string | null
}

const RESULT_LABELS: Record<string, string> = {
  won: 'Won',
  finalist: 'Finalist',
  shortlisted: 'Shortlisted',
}

export function AwardsListSection({
  awards,
  heading = 'Awards & Recognition',
}: AwardsListSectionProps) {
  if (!awards.length) return null

  return (
    <section className="bg-cream py-20 px-6">
      <div className="container">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="section-label">{heading}</h2>
          <span className="font-mono text-[0.6875rem] text-charcoal/35">
            {awards.length} recognition{awards.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ul className="divide-y divide-grey">
          {awards.map((award, index) => (
            <li key={award.id ?? `${award.title}-${index}`} className="grid grid-cols-12 gap-4 py-6 items-baseline">
              <span className="col-span-1 font-mono text-sm text-charcoal/30">{award.year}</span>
              <span className="col-span-5 font-[300] text-charcoal md:col-span-4">{award.title}</span>
              <span className="col-span-4 text-sm font-[300] text-charcoal/60 md:col-span-5">
                {award.awardBody}
                {award.category ? ` — ${award.category}` : ''}
              </span>
              <span
                className={[
                  'col-span-2 text-right font-mono text-xs font-[500] uppercase tracking-widest',
                  award.result === 'won' ? 'text-red' : 'text-charcoal/40',
                ].join(' ')}
              >
                {RESULT_LABELS[award.result] ?? award.result}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
