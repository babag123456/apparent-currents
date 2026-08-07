/**
 * FIXTURE DATA — authored cross-site traffic estimates for the Audi demo
 * context. Every figure is synthetic, written to production fidelity so
 * the competitor site view can be judged honestly; the UI must stamp
 * anything rendered from this SYNTHETIC FIXTURE.
 *
 * Live path: cross-site traffic is Semrush Traffic Analytics territory
 * (a separately licensed API — verify endpoints and unit costs against
 * current docs before wiring it). Those figures are modelled estimates of
 * other people's sites; GA4 measures owned sessions directly. Different
 * instruments — shown side by side, never blended.
 *
 * The authored story stays coherent with the rest of the demo set: BMW
 * leads on volume, Volvo climbs on the EX30 cycle, and Audi is the only
 * domain easing — the badge current, visible in site traffic.
 */

export interface CompetitorTrafficRow {
  domain: string
  name: string
  isBrand: boolean
  /** Estimated visits per month. */
  visits: number
  /** 12-month relative visit series, oldest first, 0..1. */
  trend: number[]
  /** Average pages per visit. */
  pagesPerVisit: number
  /** Average visit duration in seconds. */
  avgVisitSeconds: number
  /** Bounce rate 0..1. */
  bounceRate: number
  /** One editorial line tying the domain to the demo story. */
  note: string
}

export interface CompetitorTrafficFixture {
  /** Context brand this fixture was authored for — guard before rendering. */
  brand: string
  rows: CompetitorTrafficRow[]
}

export const COMPETITOR_TRAFFIC_FIXTURE: CompetitorTrafficFixture = {
  brand: 'Audi',
  rows: [
    {
      domain: 'bmw.com.au',
      name: 'BMW',
      isBrand: false,
      visits: 890_000,
      trend: [0.78, 0.8, 0.79, 0.83, 0.82, 0.85, 0.88, 0.87, 0.91, 0.94, 0.97, 1.0],
      pagesPerVisit: 4.1,
      avgVisitSeconds: 220,
      bounceRate: 0.38,
      note: 'The volume leader, growing steadily on the back of the i4/i5 review cycle.',
    },
    {
      domain: 'mercedes-benz.com.au',
      name: 'Mercedes-Benz',
      isBrand: false,
      visits: 680_000,
      trend: [0.95, 0.97, 0.94, 0.98, 1.0, 0.96, 0.97, 0.95, 0.98, 0.96, 0.97, 0.98],
      pagesPerVisit: 3.8,
      avgVisitSeconds: 205,
      bounceRate: 0.41,
      note: 'Flat at high volume — holding, not building.',
    },
    {
      domain: 'audi.com.au',
      name: 'Audi',
      isBrand: true,
      visits: 610_000,
      trend: [1.0, 0.98, 0.99, 0.96, 0.94, 0.95, 0.92, 0.9, 0.89, 0.87, 0.85, 0.84],
      pagesPerVisit: 3.4,
      avgVisitSeconds: 185,
      bounceRate: 0.44,
      note: 'The only domain easing — the badge current showing up as site traffic.',
    },
    {
      domain: 'volvocars.com',
      name: 'Volvo',
      isBrand: false,
      visits: 540_000,
      trend: [0.55, 0.57, 0.6, 0.63, 0.62, 0.68, 0.72, 0.76, 0.82, 0.88, 0.95, 1.0],
      pagesPerVisit: 3.9,
      avgVisitSeconds: 210,
      bounceRate: 0.4,
      note: 'The fastest climber — the EX30 cycle converting PR attention into visits.',
    },
  ],
}
