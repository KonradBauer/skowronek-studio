/**
 * ESM loader hook — resolves TypeScript tsconfig path aliases.
 * Required because tsx 4.x does NOT resolve path aliases in Node.js hook mode
 * (only in CLI runner mode). This hook runs before tsx in the hook chain.
 *
 * Registered via: NODE_OPTIONS="--import ./scripts/register-tsconfig-paths.mjs"
 */

import { readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()

let paths = {}
let baseUrl = '.'
try {
  const tsconfig = JSON.parse(readFileSync(pathResolve(root, 'tsconfig.json'), 'utf-8'))
  paths = tsconfig.compilerOptions?.paths ?? {}
  baseUrl = tsconfig.compilerOptions?.baseUrl ?? '.'
} catch {
  // no tsconfig found — skip
}

export async function resolve(specifier, context, nextResolve) {
  for (const [alias, targets] of Object.entries(paths)) {
    const isWildcard = alias.endsWith('/*')
    const prefix = isWildcard ? alias.slice(0, -2) : alias

    const matches = isWildcard
      ? specifier.startsWith(prefix + '/')
      : specifier === prefix

    if (!matches) continue

    const rest = isWildcard ? specifier.slice(prefix.length) : ''

    for (const target of targets) {
      const targetBase = target.endsWith('/*') ? target.slice(0, -2) : target
      const resolved = pathResolve(root, baseUrl, targetBase + rest)

      for (const candidate of [
        resolved + '.ts',
        resolved + '.tsx',
        pathResolve(resolved, 'index.ts'),
        resolved,
      ]) {
        try {
          return await nextResolve(pathToFileURL(candidate).href, context)
        } catch {
          // try next candidate
        }
      }
    }
  }

  return nextResolve(specifier, context)
}
