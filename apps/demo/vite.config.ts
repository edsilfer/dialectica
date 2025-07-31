import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: '/dialectica',
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],

  resolve: {
    alias: {
      '@diff-viewer': path.resolve(__dirname, '../../packages/diff-viewer/src'),
      '@github': path.resolve(__dirname, '../../packages/github/src'),
      '@commons': path.resolve(__dirname, '../../packages/commons/src'),
      '@file-explorer': path.resolve(__dirname, '../../packages/file-explorer/src'),
    },
  },
})
