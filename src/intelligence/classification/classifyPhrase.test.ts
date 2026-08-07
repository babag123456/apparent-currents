import { describe, expect, it } from 'vitest'

import { classifyPhrase, nameVariants, splitByClass } from './classifyPhrase.ts'

const CONTEXT = { brand: 'Audi', competitors: ['BMW', 'Mercedes-Benz', 'Volvo'] }

describe('nameVariants', () => {
  it('normalises case, hyphens and spacing', () => {
    expect(nameVariants('Mercedes-Benz')).toEqual(
      expect.arrayContaining(['mercedes benz', 'mercedesbenz', 'mercedes']),
    )
  })

  it('keeps single-word names to one variant', () => {
    expect(nameVariants('BMW')).toEqual(['bmw'])
  })

  it('drops short first words to avoid generic matches', () => {
    // "land" alone would classify "land for sale" as branded.
    expect(nameVariants('Land Rover')).not.toContain('land')
    expect(nameVariants('Land Rover')).toEqual(
      expect.arrayContaining(['land rover', 'landrover']),
    )
  })
})

describe('classifyPhrase', () => {
  it('classifies phrases containing the brand as branded', () => {
    expect(classifyPhrase('audi e-tron review', CONTEXT)).toBe('branded')
    expect(classifyPhrase('Audi PHEV', CONTEXT)).toBe('branded')
  })

  it('classifies competitor names as competitor', () => {
    expect(classifyPhrase('bmw i4 range', CONTEXT)).toBe('competitor')
    expect(classifyPhrase('mercedes eqe price', CONTEXT)).toBe('competitor')
    expect(classifyPhrase('mercedes-benz eqa', CONTEXT)).toBe('competitor')
  })

  it('classifies unbranded phrases as generic', () => {
    expect(classifyPhrase('home ev charger installation cost', CONTEXT)).toBe('generic')
    expect(classifyPhrase('ev range australia', CONTEXT)).toBe('generic')
  })

  it('brand wins when brand and competitor co-occur', () => {
    expect(classifyPhrase('audi vs bmw electric suv', CONTEXT)).toBe('branded')
  })

  it('matches on word boundaries only', () => {
    expect(classifyPhrase('saudi arabia ev market', CONTEXT)).toBe('generic')
    expect(classifyPhrase('volvox algae', CONTEXT)).toBe('generic')
  })
})

describe('splitByClass', () => {
  it('sums counts and volume per class with shares of the set', () => {
    const split = splitByClass(
      [
        { phrase: 'audi e-tron', searchVolume: 6000 },
        { phrase: 'bmw i4', searchVolume: 3000 },
        { phrase: 'ev range australia', searchVolume: 1000 },
        { phrase: 'best electric car', searchVolume: null },
      ],
      CONTEXT,
    )
    expect(split).toEqual([
      { phraseClass: 'branded', phraseCount: 1, volume: 6000, volumeShare: 0.6 },
      { phraseClass: 'competitor', phraseCount: 1, volume: 3000, volumeShare: 0.3 },
      { phraseClass: 'generic', phraseCount: 2, volume: 1000, volumeShare: 0.1 },
    ])
  })

  it('returns all three classes even when empty, with zero shares on an empty set', () => {
    const split = splitByClass([], CONTEXT)
    expect(split.map((entry) => entry.phraseClass)).toEqual(['branded', 'competitor', 'generic'])
    expect(split.every((entry) => entry.volumeShare === 0)).toBe(true)
  })
})
