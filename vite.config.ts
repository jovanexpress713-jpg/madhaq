import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(!isCapacitorBuild
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'madhaq_logo.png'],
              manifest: {
                id: '/',
                name: 'مذاق MADHAQ - نظام إدارة وتوزيع الحلويات',
                short_name: 'مذاق',
                description: 'نظام معمل حلويات مذاق لإدارة الموزعين والمبيعات، الموردين والمشتريات، المواد الخام والإنتاج، التحصيلات وكشف الخميس المحاسبي أوفلاين.',
                theme_color: '#b45309',
                background_color: '#1c1917',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                dir: 'rtl',
                lang: 'ar',
                icons: [
                  { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                  { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                  { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
                  {
                    urlPattern: ({ request }) => request.destination === 'image' && request.url.startsWith('https://'),
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'madhaq-food-photos',
                      expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
                      cacheableResponse: { statuses: [0, 200] },
                    },
                  },
                ],
              },
              devOptions: { enabled: true, type: 'module' },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
