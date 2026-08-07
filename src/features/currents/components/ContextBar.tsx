import { headers } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { refineContext } from '../../../app/(frontend)/context-actions.ts'
import { DEMO_CONTEXT } from '../fixtures/demoContext.ts'
import { ContextBarView } from './context/ContextBarView.tsx'

/**
 * Persistent analysis-context bar. Displays the saved Payload context —
 * the frame every finding hangs off — with an admin-gated refine
 * disclosure (the open audience box lives there). Falls back to the
 * authored fixture context, labelled as such, when no context is saved
 * or the database is unavailable.
 */
export async function ContextBar() {
  let context = null
  let user = null
  try {
    const payload = await getPayload({ config })
    context = (
      await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
    ).docs[0] ?? null
    user = (await payload.auth({ headers: await headers() })).user
  } catch {
    // No database (e.g. static build without env): fixture fallback below.
  }

  if (!context) {
    const entries: Array<[string, string]> = [
      ['Brand', DEMO_CONTEXT.brand],
      ['Category', DEMO_CONTEXT.category],
      ['Market', DEMO_CONTEXT.market],
      ['Audience', DEMO_CONTEXT.audience],
      ['Period', DEMO_CONTEXT.period],
      ['Competitors', DEMO_CONTEXT.competitors.join(' · ')],
    ]
    return (
      <div className="border-b border-red/25 bg-cream">
        <ContextBarView
          entries={entries}
          chip="Fixture — no saved context"
          action={refineContext}
        />
      </div>
    )
  }

  const competitors = (context.competitors ?? []).map((competitor) => competitor.name)
  const entries: Array<[string, string]> = [
    ['Brand', context.brand],
    ['Category', context.category ?? '—'],
    ['Market', context.market],
    ['Audience', context.audience ?? '—'],
    ['Period', context.period ?? '—'],
    ['Competitors', competitors.length ? competitors.join(' · ') : '—'],
  ]

  return (
    <div className="border-b border-red/25 bg-cream">
      <ContextBarView
        key={context.updatedAt}
        entries={entries}
        chip={context.isDemo ? 'Demo context' : null}
        refine={{
          contextId: context.id,
          defaults: {
            brand: context.brand,
            category: context.category ?? '',
            market: context.market,
            audience: context.audience ?? '',
            competitors: competitors.join(', '),
          },
          disabledReason: user ? undefined : 'Sign in to the admin to edit the context.',
        }}
        action={refineContext}
      />
    </div>
  )
}
