#!/usr/bin/env node
// Patches cac@6.7.14 which ships a package.json "exports.import" pointing to
// dist/index.mjs but omits that file from the published tarball.
// electron-vite's cli.mjs (ESM) triggers the "import" condition and fails on Node <20.
'use strict'
const { existsSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const target = resolve(__dirname, '../node_modules/cac/dist/index.mjs')

if (!existsSync(target)) {
  writeFileSync(
    target,
    `import { createRequire } from 'module'
const _req = createRequire(import.meta.url)
const _m = _req('./index.js')
export const CAC = _m.CAC
export const Command = _m.Command
export const cac = _m.cac
export default _m.default
`
  )
  console.log('[postinstall] Created missing cac/dist/index.mjs ESM wrapper.')
}
