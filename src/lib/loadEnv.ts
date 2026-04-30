import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectDir = path.resolve(dirname, '../..')

let envLoaded = false

type LoadEnvConfigFn = (dir: string) => unknown

// `@next/env` is published as CommonJS. Loading it through ESM (named or
// namespace import) causes one of two failures under Node 24 strict ESM:
//   - named imports throw "does not provide an export named 'loadEnvConfig'"
//   - namespace imports introduce top-level await into the importer's graph,
//     which in turn breaks `require()`-based loaders like the Payload CLI
//     ("ERR_REQUIRE_ASYNC_MODULE").
// Use `createRequire` to load it synchronously as CJS, which avoids both.
function resolveLoadEnvConfig(): LoadEnvConfigFn | undefined {
  try {
    const require = createRequire(import.meta.url)
    const mod = require('@next/env') as {
      default?: { loadEnvConfig?: LoadEnvConfigFn }
      loadEnvConfig?: LoadEnvConfigFn
    }
    return mod.loadEnvConfig ?? mod.default?.loadEnvConfig
  } catch {
    return undefined
  }
}

export function loadAwardKitEnv() {
  if (envLoaded) return
  envLoaded = true

  // On Vercel and most CI runners, env vars are already injected into
  // process.env. If `@next/env` can't be resolved, fall through silently.
  const loadEnvConfig = resolveLoadEnvConfig()
  if (typeof loadEnvConfig === 'function') {
    loadEnvConfig(projectDir)
  }
}
