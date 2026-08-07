'use client'

import React, { useActionState, useId, useState } from 'react'

import type { RefineContextResult } from '../../../../app/(frontend)/context-actions.ts'

/**
 * Client half of the context bar: the entry strip (horizontal scroll on
 * mobile, wrapping from sm up) and the refine disclosure — brand ·
 * category/industry · market/locale · competitors, plus the open audience
 * box in the strategist's own words. Saving is admin-gated; signed out,
 * the form stays readable but Save is disabled with the reason worded.
 * After a successful save the server component remounts this view (key =
 * updatedAt), closing the panel — the bar itself showing the new frame is
 * the confirmation.
 */

export interface RefineDefaults {
  brand: string
  category: string
  market: string
  audience: string
  competitors: string
}

const FIELD_CLASSES =
  'w-full border-b border-charcoal/25 bg-transparent pb-1.5 text-[13.5px] text-charcoal placeholder:text-charcoal/45 focus:border-red-text focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-text/70'

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-red-text"
    >
      {children}
    </label>
  )
}

export function ContextBarView({
  entries,
  chip,
  refine,
  action,
}: {
  entries: Array<[string, string]>
  /** Honesty chip after the entries, e.g. 'Demo context'. */
  chip: string | null
  /** Absent when there is no saved context to edit. */
  refine?: {
    contextId: number
    defaults: RefineDefaults
    /** When set, saving is disabled and this reason is shown. */
    disabledReason?: string
  }
  action: (prev: RefineContextResult | null, formData: FormData) => Promise<RefineContextResult>
}) {
  const [open, setOpen] = useState(false)
  const [result, formAction, pending] = useActionState(action, null)
  const panelId = useId()
  const ids = {
    brand: useId(),
    category: useId(),
    market: useId(),
    competitors: useId(),
    audience: useId(),
  }

  const saveDisabled = pending || Boolean(refine?.disabledReason)

  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div className="flex items-baseline gap-x-7 gap-y-1 overflow-x-auto py-2.5 sm:flex-wrap">
        <dl className="contents">
          {entries.map(([label, value]) => (
            <div key={label} className="flex shrink-0 items-baseline gap-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-text">
                {label}
              </dt>
              <dd
                className={`text-[13px] font-medium text-charcoal ${
                  label === 'Audience' ? 'max-w-[48ch] sm:whitespace-normal' : 'whitespace-nowrap'
                }`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <span className="ml-auto flex shrink-0 items-baseline gap-2">
          {chip ? (
            <span className="rounded-full border border-red/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-text">
              {chip}
            </span>
          ) : null}
          {refine ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
              className="rounded-full border border-red-text px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-text transition-colors hover:bg-red-text hover:text-cream"
            >
              {open ? 'Close' : 'Refine context'}
            </button>
          ) : null}
        </span>
      </div>

      {refine && open ? (
        <div id={panelId} className="border-t border-red/25 pb-5 pt-4">
          <form action={formAction}>
            <input type="hidden" name="contextId" value={refine.contextId} />
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor={ids.brand}>Brand</Label>
                <input
                  id={ids.brand}
                  name="brand"
                  required
                  maxLength={200}
                  defaultValue={refine.defaults.brand}
                  className={FIELD_CLASSES}
                />
              </div>
              <div>
                <Label htmlFor={ids.category}>Category / industry</Label>
                <input
                  id={ids.category}
                  name="category"
                  maxLength={200}
                  defaultValue={refine.defaults.category}
                  className={FIELD_CLASSES}
                />
              </div>
              <div>
                <Label htmlFor={ids.market}>Market / locale</Label>
                <input
                  id={ids.market}
                  name="market"
                  required
                  maxLength={200}
                  defaultValue={refine.defaults.market}
                  className={FIELD_CLASSES}
                />
              </div>
              <div>
                <Label htmlFor={ids.competitors}>Competitors — comma-separated</Label>
                <input
                  id={ids.competitors}
                  name="competitors"
                  maxLength={400}
                  defaultValue={refine.defaults.competitors}
                  placeholder="e.g. BMW, Mercedes-Benz, Volvo"
                  className={FIELD_CLASSES}
                />
              </div>
            </div>
            <div className="mt-5">
              <Label htmlFor={ids.audience}>Audience — refine in your own words</Label>
              <textarea
                id={ids.audience}
                name="audience"
                rows={2}
                maxLength={500}
                defaultValue={refine.defaults.audience}
                placeholder="e.g. interested in 25–34 y/o metro buyers weighing their first EV"
                className={`${FIELD_CLASSES} resize-y leading-relaxed`}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saveDisabled}
                className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium leading-none transition-colors ${
                  saveDisabled
                    ? 'cursor-not-allowed border-charcoal/25 text-charcoal/40'
                    : 'border-red-text bg-red-text text-cream hover:bg-red'
                }`}
              >
                {pending ? 'Saving…' : 'Save context'}
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
                Reframes every lens · evidence stays untouched
              </span>
            </div>
            {refine.disabledReason ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
                {refine.disabledReason}
              </p>
            ) : null}
            {result && !result.ok ? (
              <p
                role="status"
                className="mt-2 max-w-[70ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-red-text"
              >
                {result.message}
              </p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  )
}
