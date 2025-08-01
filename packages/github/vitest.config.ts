import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        'vitest.setup.ts',
        'src/components/ui/icons/',
        'src/test/',
        'src/test/__fixtures__/',
        '**/types.ts',
        '**/index.ts',
        'src/utils/test/',
        'src/utils/test/__fixtures__/',
        'src/utils/parsers/diff-parser.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@edsilfer/commons': resolve(__dirname, '../commons/src'),
      '@edsilfer/diff-viewer': resolve(__dirname, '../diff-viewer/src'),
      '@edsilfer/test-lib': resolve(__dirname, '../test-lib/src'),
    },
  },
})
