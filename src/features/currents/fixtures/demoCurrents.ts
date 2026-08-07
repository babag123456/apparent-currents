import type { MarkerConfidence } from '../../../intelligence/markers/types.ts'

/**
 * FIXTURE DATA — an authored demonstration bulletin for the confirmed demo
 * context (Audi · Premium Automotive · Australia · EV Intenders · last 90
 * days). Every number and finding here is synthetic, written to production
 * fidelity so the Surface design can be judged honestly. Surfaces consuming
 * this must label it FIXTURE wherever a viewer could mistake it for live
 * evidence. Replaced by real marker-derived currents in the data phase.
 */

export type CurrentStatus = 'emerging' | 'accelerating' | 'established' | 'declining'
export type CurrentDirection = 'rising' | 'steady' | 'easing'

export interface FixtureMarker {
  statement: string
  metric: string
  source: 'semrush' | 'brandwatch' | 'ga4' | 'gwi'
  /** False when the source has no live connection (fixture-only lenses). */
  sourceConnected?: boolean
  sourceReport: string
  confidence: MarkerConfidence
  /** Per-marker honesty label when it differs from the bulletin's own
   * (e.g. synthetic corroboration attached to a live demand current). */
  provenanceLabel?: string
}

export interface FixtureCurrent {
  id: string
  title: string
  status: CurrentStatus
  summary: string
  magnitude: string
  momentum: string
  /** Compact momentum figure for the terminal panel, e.g. '+38%'. */
  momentumFigure: string
  direction: CurrentDirection
  confidence: MarkerConfidence
  /** 12 weekly demand-index points (relative, fixture-authored). */
  trend: number[]
  markers: FixtureMarker[]
}

export interface FixtureOpportunity {
  id: string
  title: string
  narrative: string
  convergesFrom: string[]
}

export interface FixtureBulletin {
  issued: string
  period: string
  lead: {
    statement: string
    dek: string
    basedOn: string[]
    confidence: MarkerConfidence
  }
  currents: FixtureCurrent[]
  opportunities: FixtureOpportunity[]
}

export const DEMO_BULLETIN: FixtureBulletin = {
  issued: '07 Aug 2026 · 09:00 AEST',
  period: 'May – Aug 2026 · last 90 days',
  lead: {
    statement: 'EV intent isn’t cooling. It’s moving from the badge to the driveway.',
    dek:
      'Across the premium set, search demand is shifting from model names to ' +
      'ownership practicalities — charging, installation, rebates — growing at ' +
      'roughly three times the rate of badge demand. Consideration is being ' +
      'decided later, and closer to home.',
    basedOn: ['C1', 'C4'],
    confidence: 'strong',
  },
  currents: [
    {
      id: 'C1',
      title: 'Charging moves into the driveway',
      status: 'accelerating',
      summary:
        'Demand around home charging — hardware, installation, rebates — is the ' +
        'fastest-growing intent cluster in the category.',
      magnitude: '22.4k searches/mo · 14-phrase cluster',
      momentum: '+38% vs prior period',
      momentumFigure: '+38%',
      direction: 'rising',
      confidence: 'strong',
      trend: [58, 60, 61, 63, 62, 66, 70, 73, 78, 84, 91, 100],
      markers: [
        {
          statement: 'Installation-cost demand stepped up sharply.',
          metric: '“home ev charger installation cost” 1,300 → 1,900 searches/mo (+46%)',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'strong',
        },
        {
          statement: 'Rebate queries entered the demand set for the first time.',
          metric: '“ev charger rebate nsw” new at 880 searches/mo',
          source: 'semrush',
          sourceReport: 'phrase_related · AU',
          confidence: 'moderate',
        },
        {
          statement: 'The cluster itself is widening, not just deepening.',
          metric: '5 new phrases joined the charging cluster quarter-on-quarter',
          source: 'semrush',
          sourceReport: 'phrase_related · AU',
          confidence: 'moderate',
        },
      ],
    },
    {
      id: 'C2',
      title: 'The plug-in hedge',
      status: 'emerging',
      summary:
        'Plug-in hybrid intent is re-forming among EV intenders — a hedge against ' +
        'charging uncertainty, not a retreat from electric.',
      magnitude: '6.1k searches/mo · 9-phrase cluster',
      momentum: '+61% from a low base',
      momentumFigure: '+61%',
      direction: 'rising',
      confidence: 'moderate',
      trend: [30, 28, 32, 34, 33, 38, 44, 47, 55, 66, 81, 100],
      markers: [
        {
          statement: 'Comparison phrasing is driving the growth.',
          metric: '“phev vs ev” +74% vs prior period',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'moderate',
        },
        {
          statement: 'Brand-level hedge demand doubled, from a small base.',
          metric: '“audi phev” 320 → 640 searches/mo',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'weak',
        },
      ],
    },
    {
      id: 'C3',
      title: 'Range is table stakes now',
      status: 'established',
      summary:
        'Range questions remain the category’s largest single cluster, but they have ' +
        'stopped growing — a settled anxiety, priced into consideration.',
      magnitude: '31k searches/mo · 11-phrase cluster',
      momentum: '+2% · flat',
      momentumFigure: '+2%',
      direction: 'steady',
      confidence: 'strong',
      trend: [96, 94, 98, 97, 100, 96, 95, 98, 97, 99, 96, 98],
      markers: [
        {
          statement: 'The anchor phrase has plateaued at high volume.',
          metric: '“ev range australia” flat at 5,400 searches/mo across the period',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'strong',
        },
        {
          statement: 'No new phrases entered the range cluster this period.',
          metric: 'Cluster membership unchanged quarter-on-quarter',
          source: 'semrush',
          sourceReport: 'phrase_related · AU',
          confidence: 'moderate',
        },
      ],
    },
    {
      id: 'C4',
      title: 'The badge premium thins',
      status: 'declining',
      summary:
        'Model-name and prestige demand across the German set is easing in step — ' +
        'consideration is being reframed around capability, not marque.',
      magnitude: '48k searches/mo · model-name set',
      momentum: '−12% vs prior period',
      momentumFigure: '\u221212%',
      direction: 'easing',
      confidence: 'moderate',
      trend: [100, 98, 99, 95, 93, 94, 90, 89, 87, 88, 86, 88],
      markers: [
        {
          statement: 'The decline is category-wide, not Audi-specific.',
          metric: '“audi e-tron” −9%; BMW i4 and Mercedes EQ model demand easing in step',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'moderate',
        },
        {
          statement: 'Prestige modifiers are easing faster than model names.',
          metric: '“luxury ev” −15% vs prior period',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'moderate',
        },
      ],
    },
    {
      id: 'C5',
      title: 'Challengers enter the frame',
      status: 'emerging',
      summary:
        'Cross-shopping between the premium set and new entrants is starting to ' +
        'appear in comparison demand. Small, but forming a repeatable pattern.',
      magnitude: '3.2k searches/mo · comparison cluster',
      momentum: '+44% from a low base',
      momentumFigure: '+44%',
      direction: 'rising',
      confidence: 'weak',
      trend: [22, 20, 25, 24, 28, 31, 30, 36, 41, 47, 55, 64],
      markers: [
        {
          statement: 'New comparison phrases pair the German set with challengers.',
          metric: 'Premium-vs-challenger comparisons appear across all three marques',
          source: 'semrush',
          sourceReport: 'phrase_related · AU',
          confidence: 'weak',
        },
        {
          statement: 'Too early to size with confidence — flagged for Deep Dive.',
          metric: 'Cluster below the volume floor for trend derivation',
          source: 'semrush',
          sourceReport: 'phrase_these · AU',
          confidence: 'weak',
        },
      ],
    },
  ],
  opportunities: [
    {
      id: 'OP1',
      title: 'Own the driveway decision',
      narrative:
        'As badge demand thins and charging demand accelerates, the practical ' +
        'moment — can I charge this at home, and what will it cost me — is where ' +
        'premium consideration is actually decided. The brand that owns the ' +
        'driveway answer owns the shortlist.',
      convergesFrom: ['C1', 'C4'],
    },
    {
      id: 'OP2',
      title: 'Meet the hedge with a bridge',
      narrative:
        'Intenders drifting toward plug-ins aren’t lost to electric — they are ' +
        'managing settled range and charging anxieties. A confident bridge story ' +
        'keeps the hedge inside the franchise instead of ceding it.',
      convergesFrom: ['C2', 'C3'],
    },
  ],
}
