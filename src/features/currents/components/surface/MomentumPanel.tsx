import React from 'react'

import type { FixtureCurrent } from '../../fixtures/demoCurrents.ts'

/**
 * The momentum panel: a rounded stone terminal carrying each current's
 * 12-week demand index as red bars with its momentum figure in red
 * numerics — the red-data register of the Apparent site, softened onto
 * stone (charcoal read as too heavy). Red is reserved for the bars and
 * the large figures; small text stays charcoal. The currents table below
 * is the accessible evidence alternative.
 */

function TrendBars({ trend, currentId }: { trend: number[]; currentId: string }) {
  const max = Math.max(...trend)
  const barWidth = 7
  const gap = 4
  const height = 34
  const width = trend.length * (barWidth + gap) - gap

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      className="shrink-0"
    >
      {trend.map((value, index) => {
        const barHeight = Math.max(2, (value / max) * height)
        return (
          <rect
            key={`${currentId}-${index}`}
            className="momentum-bar"
            style={{ '--bar-index': index } as React.CSSProperties}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill="var(--color-red)"
            opacity={0.55 + 0.45 * (index / (trend.length - 1))}
          />
        )
      })}
    </svg>
  )
}

export function MomentumPanel({ currents }: { currents: FixtureCurrent[] }) {
  return (
    <div className="rounded-2xl bg-stone px-5 py-5 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/70">
          Momentum · demand index
        </h2>
        <span className="rounded-full border border-red/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-red-text">
          Fixture
        </span>
      </div>

      <ul className="mt-4 divide-y divide-charcoal/10">
        {currents.map((current) => (
          <li
            key={current.id}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 py-3"
          >
            <span className="font-mono text-[11px] text-charcoal/70">{current.id}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium leading-tight text-charcoal">
                {current.title}
              </span>
              <span className="mt-1 block">
                <TrendBars trend={current.trend} currentId={current.id} />
              </span>
            </span>
            <span className="text-right">
              <span className="block font-mono text-[24px] font-medium leading-none text-red-text">
                {current.momentumFigure}
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-charcoal/70">
                {current.direction}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
        Relative search-demand index per current · 12 weeks · authored fixture, not
        live evidence
      </p>
    </div>
  )
}
