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
  external: ['react', 'react-dom', '@edsilfer/file-explorer', '@edsilfer/commons'],

  loader: { '.css': 'copy' },

  esbuildOptions(options) {
    options.alias ??= {}
    options.alias['@edsilfer/commons'] = path.resolve(__dirname, '../commons/src')
    options.alias['@edsilfer/file-explorer'] = path.resolve(__dirname, '../file-explorer/src')
    options.alias['@edsilfer/test-lib'] = path.resolve(__dirname, '../test-lib/src')
  },
})
