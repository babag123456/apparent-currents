/**
 * Phrase classification: branded / competitor / generic.
 *
 * Classifies a search phrase against a context's brand and competitor set
 * by transparent name matching — no scoring, no inference. The rules are
 * deliberately simple and stated here so any classification can be
 * explained from the phrase alone:
 *
 * 1. Names and phrases are normalised the same way: lowercased, `-` and
 *    `&` become spaces, whitespace collapses.
 * 2. Each name produces match variants: the full normalised name, the
 *    name with spaces removed ("mercedes benz" → "mercedesbenz"), and the
 *    first word alone when it is 5+ characters ("mercedes"). The length
 *    floor keeps short common words (e.g. "land" from "Land Rover") from
 *    matching generically.
 * 3. Variants match on word boundaries only — "audi" never matches
 *    "saudi arabia".
 * 4. A phrase containing the context's own brand is 'branded' even when a
 *    competitor also appears ("audi vs bmw" is demand for the brand);
 *    otherwise a competitor match is 'competitor'; otherwise 'generic'.
 *
 * Classification is computed at read time from the stored phrase and the
 * current context — it is interpretation over evidence, never written
 * onto evidence records.
 */

export type PhraseClass = 'branded' | 'competitor' | 'generic'

const MIN_FIRST_WORD_LENGTH = 5

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[-&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Match variants for one brand/competitor name (see module rules). */
export function nameVariants(name: string): string[] {
  const normalized = normalize(name)
  if (!normalized) return []
  const variants = new Set<string>([normalized])
  const words = normalized.split(' ')
  if (words.length > 1) {
    variants.add(words.join(''))
    if (words[0].length >= MIN_FIRST_WORD_LENGTH) variants.add(words[0])
  }
  return [...variants]
}

function matchesName(normalizedPhrase: string, name: string): boolean {
  return nameVariants(name).some((variant) =>
    new RegExp(`\\b${escapeRegExp(variant)}\\b`).test(normalizedPhrase),
  )
}

export function classifyPhrase(
  phrase: string,
  context: { brand: string; competitors: string[] },
): PhraseClass {
  const normalizedPhrase = normalize(phrase)
  if (matchesName(normalizedPhrase, context.brand)) return 'branded'
  if (context.competitors.some((competitor) => matchesName(normalizedPhrase, competitor))) {
    return 'competitor'
  }
  return 'generic'
}

export interface ClassSplit {
  phraseClass: PhraseClass
  phraseCount: number
  /** Sum of monthly search volume across the class's phrases. */
  volume: number
  /** Volume share of the classified set, 0..1 (0 when the set has no volume). */
  volumeShare: number
}

/**
 * Split a set of demand phrases into the three classes with visible
 * components (counts + volume sums). Always returns all three classes, in
 * branded → competitor → generic order, so empty classes stay honest
 * rather than disappearing.
 */
export function splitByClass(
  records: Array<{ phrase: string; searchVolume?: number | null }>,
  context: { brand: string; competitors: string[] },
): ClassSplit[] {
  const totals: Record<PhraseClass, { phraseCount: number; volume: number }> = {
    branded: { phraseCount: 0, volume: 0 },
    competitor: { phraseCount: 0, volume: 0 },
    generic: { phraseCount: 0, volume: 0 },
  }
  for (const record of records) {
    const bucket = totals[classifyPhrase(record.phrase, context)]
    bucket.phraseCount += 1
    bucket.volume += record.searchVolume ?? 0
  }
  const totalVolume = totals.branded.volume + totals.competitor.volume + totals.generic.volume
  return (['branded', 'competitor', 'generic'] as const).map((phraseClass) => ({
    phraseClass,
    ...totals[phraseClass],
    volumeShare: totalVolume > 0 ? totals[phraseClass].volume / totalVolume : 0,
  }))
}
