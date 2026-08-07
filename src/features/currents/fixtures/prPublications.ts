/**
 * FIXTURE DATA — authored PR & publications presence for the Audi demo
 * context. Every count is synthetic, written to production fidelity so the
 * publications view can be judged honestly; the UI must stamp anything
 * rendered from this SYNTHETIC FIXTURE.
 *
 * Live path: this is Brandwatch media-monitoring territory (publication
 * mentions with brand tagging). When that adapter exists, records enter
 * as conversation-lens evidence with provenance and this module retires.
 * The authored story matches the rest of the demo set: BMW leads the
 * review cycle, charging-reliability critique has a home in the motoring
 * press, challenger value coverage is rising in the EV trade, and the
 * prestige story is easing on the business desks.
 */

export interface PublicationPresence {
  name: string
  /** What the audience reads it for. */
  readFor: string
  /** Category (premium EV) items per month across the publication. */
  categoryItems: number
  /** Items mentioning each tracked brand, authored. */
  brandItems: Array<{ brand: string; items: number }>
  /** One editorial line tying the publication to the demo story. */
  note: string
}

export interface PrPublicationsFixture {
  /** Context brand this fixture was authored for — guard before rendering. */
  brand: string
  publications: PublicationPresence[]
}

export const PR_PUBLICATIONS_FIXTURE: PrPublicationsFixture = {
  brand: 'Audi',
  publications: [
    {
      name: 'The Driven',
      readFor: 'EV-specialist news and ownership economics',
      categoryItems: 52,
      brandItems: [
        { brand: 'Volvo', items: 8 },
        { brand: 'BMW', items: 7 },
        { brand: 'Mercedes-Benz', items: 5 },
        { brand: 'Audi', items: 3 },
      ],
      note: 'Challenger value coverage is the fastest-growing thread — the same signal as the comparison cluster in demand.',
    },
    {
      name: 'Drive',
      readFor: 'Mainstream buying guides and launch reviews',
      categoryItems: 46,
      brandItems: [
        { brand: 'BMW', items: 11 },
        { brand: 'Mercedes-Benz', items: 8 },
        { brand: 'Volvo', items: 6 },
        { brand: 'Audi', items: 4 },
      ],
      note: 'The premium-EV review cycle is led by BMW; Audi appears mostly in comparison round-ups.',
    },
    {
      name: 'CarExpert',
      readFor: 'Launch reviews and charging-network critiques',
      categoryItems: 38,
      brandItems: [
        { brand: 'BMW', items: 9 },
        { brand: 'Mercedes-Benz', items: 7 },
        { brand: 'Audi', items: 5 },
        { brand: 'Volvo', items: 5 },
      ],
      note: 'Public-charging reliability critique lives here — the press face of the conversation lens’s angriest theme.',
    },
    {
      name: 'Chasing Cars',
      readFor: 'Video-led reviews for younger intenders',
      categoryItems: 27,
      brandItems: [
        { brand: 'Volvo', items: 7 },
        { brand: 'BMW', items: 6 },
        { brand: 'Mercedes-Benz', items: 4 },
        { brand: 'Audi', items: 3 },
      ],
      note: 'Volvo’s EX30 cycle owns the younger end of the audience this quarter.',
    },
    {
      name: 'Australian Financial Review',
      readFor: 'Business framing of the luxury market',
      categoryItems: 12,
      brandItems: [
        { brand: 'Mercedes-Benz', items: 5 },
        { brand: 'BMW', items: 4 },
        { brand: 'Audi', items: 2 },
        { brand: 'Volvo', items: 1 },
      ],
      note: 'Prestige-positioning stories are thinning — the badge current, told from the business desk.',
    },
  ],
}
