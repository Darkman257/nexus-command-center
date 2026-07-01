import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { novaBackendPlugin } from './nova-backend.ts'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    novaBackendPlugin(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false
    })
  ],
  server: {
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, '../..')
      ]
    }
  }
})


