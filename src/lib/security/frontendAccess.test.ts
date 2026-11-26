import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Guardrail: the Payload Local API skips collection access rules unless a
 * call passes `overrideAccess: false`. Every read that feeds the private
 * Currents pages must enforce them, so a page that forgets the login check
 * still cannot return data. Machine writers (sync runs, OAuth provisioning)
 * live outside these folders and are deliberately not covered here.
 */
const ROOTS = ['src/app/(frontend)', 'src/features']
const READ_CALL = /payload\.(find|findByID|findGlobal|count)\(/g

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') ? [path] : []
  })
}

/** The argument text of the call starting at `start`, up to its closing paren. */
function callArguments(source: string, start: number): string {
  let depth = 0
  for (let i = source.indexOf('(', start); i < source.length; i++) {
    if (source[i] === '(') depth++
    if (source[i] === ')' && --depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

describe('frontend data reads', () => {
  const files = ROOTS.flatMap((root) => sourceFiles(root))

  it('finds the page and query files', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('enforce collection access rules (overrideAccess: false)', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(READ_CALL)) {
        const args = callArguments(source, match.index)
        const enforced = /overrideAccess:\s*false/.test(args) || /\.\.\.access\b/.test(args)
        if (!enforced) {
          const line = source.slice(0, match.index).split('\n').length
          offenders.push(`${relative(process.cwd(), file)}:${line}`)
        }
      }
    }
    expect(offenders, 'Local API reads without overrideAccess: false').toEqual([])
  })
})
