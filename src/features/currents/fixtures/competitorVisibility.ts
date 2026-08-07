import type { DomainKeywordRow } from '../../../intelligence/share/shareOfSearch.ts'

/**
 * FIXTURE DATA — authored competitor search-visibility rows for the Audi
 * demo context. Every position and volume is synthetic, written to
 * production fidelity so the competitive stack-up can be judged honestly;
 * the UI must stamp anything computed from this SYNTHETIC FIXTURE.
 *
 * Shape matches what a live Semrush domain_organic import produces
 * (domain · phrase · volume · position), so wiring the live path later
 * replaces this module without touching the computation or the UI. The
 * authored story: Audi owns its badge terms but trails the set on generic
 * demand and is absent from the charging cluster — the gap the So What
 * opportunities point at.
 */

export interface CompetitorVisibilityFixture {
  /** Context brand this fixture was authored for — guard before rendering. */
  brand: string
  /** Compared domains, brand first, with their display names. */
  domains: Array<{ domain: string; name: string; isBrand: boolean }>
  rows: DomainKeywordRow[]
}

const VOLUMES: Record<string, number> = {
  'best electric car australia': 9900,
  'electric suv australia': 8100,
  'bmw i4': 8100,
  'audi e-tron': 6600,
  'ev range australia': 5400,
  'volvo ex30': 5400,
  'luxury ev': 4400,
  'mercedes eqe': 4400,
  'ev public charging australia': 3600,
  'phev vs ev': 2900,
  'home ev charger installation cost': 1900,
  'ev charger rebate nsw': 880,
}

/** domain → phrase → authored organic position. Absent = not ranked. */
const POSITIONS: Record<string, Record<string, number>> = {
  'audi.com.au': {
    'audi e-tron': 1,
    'luxury ev': 6,
    'electric suv australia': 9,
    'ev range australia': 12,
    'best electric car australia': 14,
  },
  'bmw.com.au': {
    'bmw i4': 1,
    'luxury ev': 3,
    'electric suv australia': 4,
    'ev range australia': 7,
    'best electric car australia': 8,
    'home ev charger installation cost': 9,
    'phev vs ev': 11,
  },
  'mercedes-benz.com.au': {
    'mercedes eqe': 1,
    'luxury ev': 5,
    'electric suv australia': 7,
    'best electric car australia': 11,
    'ev range australia': 15,
  },
  'volvocars.com': {
    'volvo ex30': 1,
    'electric suv australia': 5,
    'best electric car australia': 6,
    'phev vs ev': 6,
    'ev range australia': 9,
    'ev public charging australia': 13,
  },
}

export const COMPETITOR_VISIBILITY_FIXTURE: CompetitorVisibilityFixture = {
  brand: 'Audi',
  domains: [
    { domain: 'audi.com.au', name: 'Audi', isBrand: true },
    { domain: 'bmw.com.au', name: 'BMW', isBrand: false },
    { domain: 'mercedes-benz.com.au', name: 'Mercedes-Benz', isBrand: false },
    { domain: 'volvocars.com', name: 'Volvo', isBrand: false },
  ],
  rows: Object.entries(POSITIONS).flatMap(([domain, phrases]) =>
    Object.entries(phrases).map(([phrase, position]) => ({
      domain,
      phrase,
      searchVolume: VOLUMES[phrase],
      position,
    })),
  ),
}
