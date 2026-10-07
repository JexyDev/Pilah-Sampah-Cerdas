import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/index.css',
      ],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/downloads': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'zustand',
      'axios',
      'lucide-react',
      'react-hot-toast',
      'react-error-boundary',
      'leaflet',
      'react-leaflet',
      'recharts',
      'xlsx',
      'jszip',
      '@iconify/react',
      '@turf/turf',
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
