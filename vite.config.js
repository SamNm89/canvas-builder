import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Relative base for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
