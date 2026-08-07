/**
 * Curated open-data references for the market-context panel — datasets
 * aligned to the context's industry that answer what the four behavioural
 * lenses can't: market share, infrastructure coverage, macro adoption.
 *
 * These are REFERENCES ONLY. Nothing here is ingested, fetched or scored;
 * the panel says so. When a dataset is actually connected, its rows enter
 * as evidence records with full provenance like every other source. The
 * list is authored per industry (this one: premium automotive / EV,
 * Australia) — a different context shows an honest empty state, not a
 * mismatched list.
 */

export interface OpenDatasetReference {
  name: string
  publisher: string
  /** The audience/market question this dataset would answer. */
  answers: string
  cadence: string
  access: string
  url: string
  /** True for the dataset that closes the share-of-market gap. */
  closesShareOfMarket?: boolean
}

export interface OpenDatasetsFixture {
  /** Context category this list was curated for — guard before rendering. */
  category: string
  datasets: OpenDatasetReference[]
}

export const OPEN_DATASETS_FIXTURE: OpenDatasetsFixture = {
  category: 'Premium Automotive',
  datasets: [
    {
      name: 'VFACTS new-vehicle sales',
      publisher: 'Federal Chamber of Automotive Industries',
      answers:
        'Monthly new-vehicle sales by brand and segment — the actual share-of-market ' +
        'numbers the competitive stack-up deliberately leaves blank.',
      cadence: 'Monthly',
      access: 'Summary releases free; full data licensed',
      url: 'https://www.fcai.com.au',
      closesShareOfMarket: true,
    },
    {
      name: 'Road Vehicles Australia',
      publisher: 'BITRE (Bureau of Infrastructure and Transport Research Economics)',
      answers:
        'Registered fleet by make and fuel type — the installed base behind the ' +
        'category, and the denominator for EV penetration.',
      cadence: 'Annual',
      access: 'Free download',
      url: 'https://www.bitre.gov.au/publications/ongoing/road-vehicles-australia',
    },
    {
      name: 'State of Electric Vehicles',
      publisher: 'Electric Vehicle Council',
      answers:
        'EV adoption, model availability and charger counts nationally — the macro ' +
        'curve underneath every current in this analysis.',
      cadence: 'Twice yearly',
      access: 'Free report',
      url: 'https://electricvehiclecouncil.com.au',
    },
    {
      name: 'EV charging infrastructure datasets',
      publisher: 'data.gov.au',
      answers:
        'Public charger locations and density by region — would ground the charging ' +
        'anxiety and reliability currents in physical coverage.',
      cadence: 'Varies by dataset',
      access: 'Free, open licence',
      url: 'https://data.gov.au',
    },
    {
      name: 'Google Trends',
      publisher: 'Google',
      answers:
        'Public search-interest series for any phrase — an independent cross-check ' +
        'on the demand lens’s trend shapes.',
      cadence: 'Continuous',
      access: 'Free, exportable',
      url: 'https://trends.google.com',
    },
  ],
}
