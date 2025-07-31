import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: '/dialectica',
  server: {
    host: '0.0.0.0',
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),

    // Add a plugin to copy index.html to 404.html after build
    {
      name: 'copy-index-to-404',
      closeBundle: () => {
        const dist = path.resolve(__dirname, 'dist')
        const indexPath = path.join(dist, 'index.html')
        const notFoundPath = path.join(dist, '404.html')
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath)
          console.log('Copied index.html to 404.html for GitHub Pages SPA fallback')
        }
      },
    },
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
