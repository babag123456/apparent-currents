import { loadEnvConfig } from '@next/env'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectDir = path.resolve(dirname, '../..')

let envLoaded = false

export function loadAwardKitEnv() {
  if (envLoaded) return

  loadEnvConfig(projectDir)
  envLoaded = true
}
