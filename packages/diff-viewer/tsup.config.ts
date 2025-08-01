import path from 'path'
import { defineConfig } from 'tsup'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,

  // externals that must stay `require('…')`
  external: ['react', 'react-dom'],

  // packages we want to BUNDLE (inline) ↓
  noExternal: ['@commons', '@file-explorer'],

  loader: { '.css': 'copy' },

  esbuildOptions(options) {
    options.alias ??= {}
    options.alias['@commons'] = path.resolve(__dirname, '../commons/src')
    options.alias['@file-explorer'] = path.resolve(__dirname, '../file-explorer/src')
    options.alias['@edsilfer/test-lib'] = path.resolve(__dirname, '../test-lib/src')
  },
})
