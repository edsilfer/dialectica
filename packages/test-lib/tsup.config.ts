import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'esnext',
  dts: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  external: ['react', 'vitest'],
})
