import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  splitting: true,
  sourcemap: true,
  platform: 'browser',
  dts: true,
  external: ['react', '@test-lib'],
  clean: true,
  loader: { '.css': 'file' },
})
