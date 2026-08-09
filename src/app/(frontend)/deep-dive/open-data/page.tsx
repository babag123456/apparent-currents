import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { Notice } from '../../../../features/currents/components/deep-dive/Notice.tsx'
import { SectionHead } from '../../../../features/currents/components/deep-dive/SectionHead.tsx'
import { OPEN_DATASETS_FIXTURE } from '../../../../features/currents/fixtures/openDatasets.ts'

export const metadata: Metadata = { title: 'Currents · Deep Dive · Market context' }
export const dynamic = 'force-dynamic'

/**
 * Market context — open data aligned to the industry. This panel is
 * curated references only: what each dataset would answer, where it lives,
 * and how often it moves. Nothing is ingested; when a dataset is actually
 * connected its rows enter as evidence records with provenance like every
 * other source, and this page starts showing evidence instead of pointers.
 */

export default async function OpenDataPage() {
  let context = null
  try {
    const payload = await getPayload({ config })
    context = (
      await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
    ).docs[0] ?? null
  } catch {
    // No database: the not-curated notice below is still honest.
  }

  const curatedForContext = Boolean(
    context && context.category && OPEN_DATASETS_FIXTURE.category === context.category,
  )

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          Market context
        </h1>
        <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70 outline outline-1 outline-charcoal/30">
          Open data
          <span className="normal-case tracking-normal">· references only</span>
        </span>
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
        What the behavioural lenses can’t answer on their own: market share,
        infrastructure coverage, macro adoption. Open datasets aligned to the
        industry close those gaps — curated here, ingested never (yet).
      </p>

      {!curatedForContext ? (
        <Notice tone="info" title="No curated dataset list for this industry yet">
          <p>
            Open-data references are curated per industry so every pointer is
            actually relevant. The current list covers{' '}
            <span className="font-medium">{OPEN_DATASETS_FIXTURE.category}</span>;
            {context?.category
              ? ` this context's category is "${context.category}".`
              : ' no analysis context (or category) is saved.'}{' '}
            Curating a list for a new industry is an authored, strategist-led step —
            never generated.
          </p>
        </Notice>
      ) : (
        <section aria-labelledby="open-datasets" className="mt-10 pb-4">
          <SectionHead
            id="open-datasets"
            title="Curated datasets"
            note={`${OPEN_DATASETS_FIXTURE.datasets.length} references · ${OPEN_DATASETS_FIXTURE.category}`}
          />
          <ul className="divide-y divide-charcoal/10">
            {OPEN_DATASETS_FIXTURE.datasets.map((dataset) => (
              <li key={dataset.name} className="py-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[16px] font-medium leading-snug text-charcoal">
                    {dataset.name}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
                    {dataset.publisher}
                  </span>
                  {dataset.closesShareOfMarket ? (
                    <span className="rounded-full border border-red/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-text">
                      Closes the share-of-market gap
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 max-w-[68ch] text-[14px] leading-relaxed text-charcoal/75">
                  {dataset.answers}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
                  <span>{dataset.cadence}</span>
                  <span>· {dataset.access}</span>
                  <span>
                    ·{' '}
                    <a
                      href={dataset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="normal-case tracking-normal text-red-text underline decoration-red/40 underline-offset-2 hover:decoration-red-text"
                    >
                      {dataset.url.replace('https://', '')}
                    </a>
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
            Curated references, authored for this industry ·{' '}
            <span className="text-red-text">
              nothing here is ingested — no metrics on this page are data
            </span>{' '}
            · a connected dataset would enter as evidence records with full provenance
          </p>
        </section>
      )}
    </div>
  )
}
