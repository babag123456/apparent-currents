import React from 'react'

/** Designed product-state panel: info (charcoal hairline) or error (red
 * hairline). The title names the state; the body names the recovery. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: 'error' | 'info'
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`mt-8 rounded-2xl border p-6 ${tone === 'error' ? 'border-red/50' : 'border-charcoal/20'}`}
    >
      <h2 className="text-[17px] font-medium text-charcoal">{title}</h2>
      <div className="mt-2 max-w-[66ch] space-y-2 text-[14px] leading-relaxed text-charcoal/75">
        {children}
      </div>
    </div>
  )
}
