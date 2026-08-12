/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Must match the GitHub repo name for project-page Pages URLs
// (https://<user>.github.io/<repo>/) to resolve asset paths correctly.
// Update this if the repo is created under a different name.
const REPO_NAME = 'pistons-car-company'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The app is fully client-side (localStorage save, no backend calls at all), so the
      // default generateSW strategy - precache the whole build output, serve from cache, revalidate
      // in the background - covers 100% of it with no custom runtime-caching rules needed.
      // apple-touch-icon.png is only referenced from index.html's <link>, not manifest.icons, so
      // it needs to be listed explicitly to end up in the precache too.
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        // vite-plugin-pwa's default glob doesn't include font files, which would otherwise leave
        // the self-hosted Fraunces/Work Sans faces (tokens.css) uncached - offline would silently
        // fall back to system fonts instead of actually failing, easy to miss without this.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      manifest: {
        name: 'Pistons: Car Company Inc.',
        short_name: 'Pistons',
        description: 'A 2D car company tycoon game.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        // The actual fix for real orientation lock on Android - installed PWAs get this enforced
        // natively by Chrome. iOS has no orientation-lock API in any context, PWA or not, so the
        // in-app forced-landscape CSS (tokens.css) remains the permanent fallback there regardless.
        orientation: 'landscape',
        background_color: '#1c1a17', // --color-background
        theme_color: '#262320', // --color-panel-dark
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Every test in this pass exercises src/core/ (pure logic) - no component
    // rendering tests yet, so the default 'node' environment is enough and we
    // avoid pulling in jsdom as a dependency until that's actually needed.
    environment: 'node',
  },
})
