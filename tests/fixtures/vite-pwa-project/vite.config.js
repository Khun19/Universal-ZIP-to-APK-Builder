import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'M4 Vite PWA Fixture',
        short_name: 'M4 PWA',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});
