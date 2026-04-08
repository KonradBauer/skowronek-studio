/**
 * Registers the tsconfig path aliases ESM hook.
 * Used via: NODE_OPTIONS="--import ./scripts/register-tsconfig-paths.mjs"
 */

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./tsconfig-paths-hooks.mjs', pathToFileURL('./scripts/'))
