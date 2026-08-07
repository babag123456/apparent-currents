/**
 * Parser for Semrush Analytics API (v3) responses.
 *
 * Responses are semicolon-separated CSV with a header row of human-readable
 * column names. Errors and empty results arrive as a plain-text body of the
 * form "ERROR <code> :: <message>" — notably "ERROR 50 :: NOTHING FOUND",
 * which is an empty result, not a failure.
 */

export interface SemrushErrorBody {
  code: number
  message: string
}

const ERROR_BODY_PATTERN = /^ERROR\s+(\d+)\s*::\s*(.*)$/

/** Detect the "ERROR <code> :: <message>" body shape. */
export function parseErrorBody(body: string): SemrushErrorBody | null {
  const match = ERROR_BODY_PATTERN.exec(body.trim())
  if (!match) return null
  return { code: Number(match[1]), message: match[2].trim() }
}

/** Semrush's "no rows matched" response — an empty result, not a failure. */
export const NOTHING_FOUND_CODE = 50

/**
 * Parse a semicolon-separated CSV body into records keyed by header name.
 * Handles optional double-quote wrapping (export_escape=1).
 */
export function parseSemicolonCsv(body: string): Record<string, string>[] {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length < 2) return []

  const headers = splitLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitLine(line)
    const record: Record<string, string> = {}
    headers.forEach((header, i) => {
      record[header] = values[i] ?? ''
    })
    return record
  })
}

function splitLine(line: string): string[] {
  return line.split(';').map(unquote)
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"')
  }
  return trimmed
}
