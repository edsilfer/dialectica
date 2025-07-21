import { defineConfig } from 'vitest/config'

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
})
