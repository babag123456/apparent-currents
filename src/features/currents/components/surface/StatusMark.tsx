import React from 'react'

import type { CurrentStatus } from '../../fixtures/demoCurrents.ts'

/**
 * Current status as an Apparent-site pill chip. The word always carries the
 * meaning; colour reinforces it (never colour-only): accelerating is the
 * loudest (filled red), emerging is forming (outline red), established is
 * settled (outline charcoal), declining recedes (outline plum).
 */

const STATUS_LABEL: Record<CurrentStatus, string> = {
  emerging: 'Emerging',
  accelerating: 'Accelerating',
  established: 'Established',
  declining: 'Declining',
}

const STATUS_PILL_CLASS: Record<CurrentStatus, string> = {
  accelerating: 'border-red-text bg-red-text text-cream',
  emerging: 'border-red/70 text-red-text',
  established: 'border-charcoal/50 text-charcoal/80',
  declining: 'border-plum/60 text-plum',
}

export function StatusMark({ status }: { status: CurrentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${STATUS_PILL_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
