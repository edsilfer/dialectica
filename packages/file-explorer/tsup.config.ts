import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  splitting: true,
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  external: ['react', '@dialectica-org/commons'],
  loader: { '.css': 'file' },
})
