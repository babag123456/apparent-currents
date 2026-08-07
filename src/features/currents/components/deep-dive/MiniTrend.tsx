import React from 'react'

/** Compact 12-point trend as red bars for evidence-table cells. Marked
 * aria-hidden — callers provide an sr-only text alternative beside it. */
export function MiniTrend({ trend }: { trend: number[] }) {
  const max = Math.max(...trend, 0.0001)
  const barWidth = 4
  const gap = 2
  const height = 18
  const width = trend.length * (barWidth + gap) - gap
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {trend.map((value, index) => {
        const barHeight = Math.max(1.5, (value / max) * height)
        return (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill="var(--color-red)"
            opacity={0.5 + 0.5 * (index / (trend.length - 1))}
          />
        )
      })}
    </svg>
  )
}

/** The sr-only alternative for a MiniTrend, phrased for screen readers. */
export function TrendAlt({ trend }: { trend: number[] }) {
  return (
    <span className="sr-only">
      {`from ${trend[0].toLocaleString('en-AU')} to ${trend[trend.length - 1].toLocaleString('en-AU')} over 12 months`}
    </span>
  )
}
