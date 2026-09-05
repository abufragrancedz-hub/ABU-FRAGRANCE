import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    modulePreload: false,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase-core';
            if (id.includes('jspdf') || id.includes('xlsx')) return 'heavy-assets';
            return 'vendor';
          }
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
    drop: ['console', 'debugger'],
  }
})