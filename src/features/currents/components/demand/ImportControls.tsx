'use client'

import React, { useState, useTransition } from 'react'

import type { ImportActionResult } from '../../../../app/(frontend)/deep-dive/demand/actions.ts'

/**
 * The metered import control: a red pill action with the unit estimate
 * stated up front, disabled with a worded reason whenever a run isn't
 * allowed. The outcome message renders inline — errors name the problem
 * and the recovery.
 */
export function ImportControls({
  contextId,
  estimatedUnits,
  disabledReason,
  hasImportedBefore,
  action,
}: {
  contextId: number
  estimatedUnits: number
  /** When set, the control is disabled and this reason is shown. */
  disabledReason?: string
  hasImportedBefore: boolean
  action: (contextId: number) => Promise<ImportActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportActionResult | null>(null)

  const disabled = pending || Boolean(disabledReason)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            startTransition(async () => {
              setResult(null)
              setResult(await action(contextId))
            })
          }
          className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium leading-none transition-colors ${
            disabled
              ? 'cursor-not-allowed border-charcoal/25 text-charcoal/40'
              : 'border-red-text bg-red-text text-cream hover:bg-red'
          }`}
        >
          {pending
            ? 'Importing…'
            : hasImportedBefore
              ? 'Refresh demand evidence'
              : 'Import demand evidence'}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
          ≈ {estimatedUnits.toLocaleString('en-AU')} API units · explicit refresh, never polled
        </span>
      </div>
      {disabledReason ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
          {disabledReason}
        </p>
      ) : null}
      {result ? (
        <p
          role="status"
          className={`mt-2 max-w-[70ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] ${
            result.ok ? 'text-charcoal/70' : 'text-red-text'
          }`}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  )
}
