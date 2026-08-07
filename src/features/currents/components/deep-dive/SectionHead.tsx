import React from 'react'

/** Deep Dive section heading on the red hairline baseline rule, with the
 * mono annotation right-aligned on the same baseline. */
export function SectionHead({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-red pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <h2 id={id} className="text-[20px] font-medium tracking-[-0.01em] text-charcoal">
        {title}
      </h2>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
        {note}
      </span>
    </div>
  )
}
