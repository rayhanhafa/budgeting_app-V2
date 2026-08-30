import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // manual reload when update is available
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Budgeting App',
        short_name: 'Budgeting',
        description: 'Track your personal budget and expenses easily',
        theme_color: '#1e293b', // slate-800 for top bar
        background_color: '#f8fafc', // slate-50
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Exclude /api/ from the navigation fallback (so it doesn't return index.html for API calls)
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Explicitly NetworkOnly for all API calls
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly'
          },
          {
            // Cache external fonts or other runtime static assets with CacheFirst
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'runtime-static-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
})
