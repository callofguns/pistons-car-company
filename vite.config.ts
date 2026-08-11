/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Must match the GitHub repo name for project-page Pages URLs
// (https://<user>.github.io/<repo>/) to resolve asset paths correctly.
// Update this if the repo is created under a different name.
const REPO_NAME = 'pistons-car-company'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${REPO_NAME}/` : '/',
  plugins: [react()],
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
