import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('md-'),
        },
      },
    }),
    compression({ algorithm: 'gzip' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@material/web') || id.includes('node_modules/@material/material-color-utilities') || id.includes('node_modules/lit')) {
            return 'material-vendor';
          }
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/pinia') || id.includes('node_modules/vue-router') || id.includes('node_modules/vue-i18n')) {
            return 'vue-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor';
          }
          if (id.includes('node_modules/@fortawesome') || id.includes('node_modules/@iconify')) {
            return 'icons-vendor';
          }
          if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) {
            return 'markdown-vendor';
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
