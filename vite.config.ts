import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: './',
    server: {
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://127.0.0.1:8787',
          changeOrigin: false,
        },
      },
    },
  }
})
