import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false, // Hide source maps in production
    minify: 'esbuild', // Minify code
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/ecotrack': {
        target: 'https://anderson-ecommerce.ecotrack.dz',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ecotrack/, '/api')
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'], // Remove console logs and debugger statements in production
  }
})
