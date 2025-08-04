import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = (rel: string) => path.resolve(__dirname, rel)

export default defineConfig(() => {
  /** true  → alias diff-viewer to local source
   *  false → resolve diff-viewer from node_modules (= published build) */
  const useLocalDiff = !!process.env.LOCAL_DIFF

  return {
    base: '/dialectica',
    server: { host: '0.0.0.0' },

    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: { plugins: ['@emotion/babel-plugin'] },
      }),

      // copy index.html → 404.html after build
      {
        name: 'copy-index-to-404',
        closeBundle() {
          const dist = path.resolve(__dirname, 'dist')
          const idx = path.join(dist, 'index.html')
          if (fs.existsSync(idx)) {
            fs.copyFileSync(idx, path.join(dist, '404.html'))
            console.log('Copied index.html → 404.html')
          }
        },
      },
    ],

    resolve: {
      alias: {
        // always-local packages
        '@github': pkg('../../packages/github/src'),
        // conditional alias
        ...(useLocalDiff ? { '@dialectica-org/commons': pkg('../../packages/commons/src') } : {}),
        ...(useLocalDiff ? { '@dialectica-org/diff-viewer': pkg('../../packages/diff-viewer/src') } : {}),
      },
    },
  }
})
