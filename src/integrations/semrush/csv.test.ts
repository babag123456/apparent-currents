import { describe, expect, it } from 'vitest'

import { NOTHING_FOUND_CODE, parseErrorBody, parseSemicolonCsv } from './csv.ts'

describe('parseErrorBody', () => {
  it('parses the documented error shape', () => {
    expect(parseErrorBody('ERROR 120 :: WRONG KEY - ID PAIR')).toEqual({
      code: 120,
      message: 'WRONG KEY - ID PAIR',
    })
  })

  it('parses NOTHING FOUND with surrounding whitespace', () => {
    expect(parseErrorBody('\nERROR 50 :: NOTHING FOUND\n')).toEqual({
      code: NOTHING_FOUND_CODE,
      message: 'NOTHING FOUND',
    })
  })

  it('returns null for CSV bodies', () => {
    expect(parseErrorBody('Keyword;Search Volume\nseo;110000')).toBeNull()
  })
})

describe('parseSemicolonCsv', () => {
  it('parses a keyword overview response with trend commas intact', () => {
    const body = [
      'Keyword;Search Volume;CPC;Competition;Number of Results;Trends',
      'ev charging;12100;1.53;0.45;98000000;0.62,0.66,0.71,0.71,0.77,0.81,0.81,0.85,0.92,0.92,1.00,1.00',
    ].join('\n')

    const rows = parseSemicolonCsv(body)
    expect(rows).toHaveLength(1)
    expect(rows[0]['Keyword']).toBe('ev charging')
    expect(rows[0]['Search Volume']).toBe('12100')
    expect(rows[0]['Trends']).toBe(
      '0.62,0.66,0.71,0.71,0.77,0.81,0.81,0.85,0.92,0.92,1.00,1.00',
    )
  })

  it('unquotes export_escape=1 values including doubled quotes', () => {
    const rows = parseSemicolonCsv('Keyword;CPC\n"say ""hello""";"1.20"')
    expect(rows[0]['Keyword']).toBe('say "hello"')
    expect(rows[0]['CPC']).toBe('1.20')
  })

  it('returns [] for a header-only body', () => {
    expect(parseSemicolonCsv('Keyword;Search Volume\n')).toEqual([])
  })

  it('returns [] for an empty body', () => {
    expect(parseSemicolonCsv('')).toEqual([])
  })

  it('fills missing trailing columns with empty strings', () => {
    const rows = parseSemicolonCsv('Keyword;Search Volume;CPC\nseo;110000')
    expect(rows[0]['CPC']).toBe('')
  })
})
