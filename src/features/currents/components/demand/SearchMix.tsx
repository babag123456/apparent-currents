import React from 'react'

import type { ClassSplit } from '../../../../intelligence/classification/classifyPhrase.ts'

const CLASS_LABELS: Record<ClassSplit['phraseClass'], string> = {
  branded: 'Branded',
  competitor: 'Competitor',
  generic: 'Non-branded',
}

const CLASS_NOTES: Record<ClassSplit['phraseClass'], string> = {
  branded: 'phrases naming the brand',
  competitor: 'phrases naming a competitor',
  generic: 'category demand naming no one',
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}

/**
 * The branded / competitor / non-branded split of the imported demand set,
 * with its components (phrase counts, volume sums) visible beside every
 * share. Classification happens at read time by name matching — the split
 * changes with the context's brand and competitor set, never with the
 * stored evidence.
 */
export function SearchMix({ split, brand }: { split: ClassSplit[]; brand: string }) {
  return (
    <div>
      <ul>
        {split.map((entry) => (
          <li
            key={entry.phraseClass}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b border-charcoal/10 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)_11rem_5.5rem]"
          >
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.1em] ${
                entry.phraseClass === 'branded' ? 'text-red-text' : 'text-charcoal/75'
              }`}
            >
              {CLASS_LABELS[entry.phraseClass]}
            </span>
            <span className="text-[13.5px] leading-snug text-charcoal/70">
              {CLASS_NOTES[entry.phraseClass]}
              {entry.phraseClass === 'branded' ? ` — ${brand}` : ''}
            </span>
            <span className="font-mono text-[12px] text-charcoal/80">
              {entry.phraseCount} phrase{entry.phraseCount === 1 ? '' : 's'} ·{' '}
              {entry.volume.toLocaleString('en-AU')}/mo
            </span>
            <span className="text-right font-mono text-[13px] font-medium text-charcoal">
              {pct(entry.volumeShare)}
              <span className="sr-only"> of the set’s search volume</span>
            </span>
            <span
              aria-hidden="true"
              className="col-span-2 h-[3px] w-full rounded-full bg-charcoal/10 sm:col-span-4"
            >
              <span
                className={`block h-full rounded-full ${entry.phraseClass === 'branded' ? 'bg-red' : 'bg-charcoal/45'}`}
                style={{ width: `${Math.max(entry.volumeShare * 100, entry.volume > 0 ? 1 : 0)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
