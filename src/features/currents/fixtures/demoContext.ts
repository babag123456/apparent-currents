/**
 * FIXTURE DATA — the confirmed demo analysis context (not live data).
 * Surfaces consuming this must label it as demo/fixture in the UI.
 * Replaced by saved Contexts (Payload) when the storage layer lands.
 */

export interface AnalysisContext {
  brand: string
  category: string
  market: string
  audience: string
  period: string
  competitors: string[]
}

export const DEMO_CONTEXT: AnalysisContext = {
  brand: 'Audi',
  category: 'Premium Automotive',
  market: 'Australia',
  audience: 'EV Intenders',
  period: 'Last 90 days',
  competitors: ['BMW', 'Mercedes-Benz', 'Volvo'],
}
