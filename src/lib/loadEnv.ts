import * as nextEnv from '@next/env'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectDir = path.resolve(dirname, '../..')

let envLoaded = false

type LoadEnvConfigFn = (dir: string) => unknown

// `@next/env` is CJS. Depending on the loader (Next bundler, tsx + Node 24
// strict ESM, etc.), `loadEnvConfig` is exposed either as a named ESM export
// or hidden behind a CJS `default` interop wrapper. Resolve it defensively.
function resolveLoadEnvConfig(): LoadEnvConfigFn | undefined {
  const mod = nextEnv as unknown as {
    default?: { loadEnvConfig?: LoadEnvConfigFn }
    loadEnvConfig?: LoadEnvConfigFn
  }
  return mod.loadEnvConfig ?? mod.default?.loadEnvConfig
}

export function loadAwardKitEnv() {
  if (envLoaded) return
  envLoaded = true

  // On Vercel and most CI runners, env vars are already injected into
  // process.env. If `@next/env` can't be resolved (e.g. CJS interop quirk
  // under Node strict ESM), fall through silently — there's nothing to load.
  const loadEnvConfig = resolveLoadEnvConfig()
  if (typeof loadEnvConfig === 'function') {
    loadEnvConfig(projectDir)
  }
}
