import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://sandbox.open-metadata.org',
        changeOrigin: true,
        secure: true,
        // /api/v1/... → https://sandbox.open-metadata.org/api/v1/...
      }
    }
  }
})
