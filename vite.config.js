import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ IMPORTANT: change 'pokemon-checklist' below to your actual GitHub repo name.
// GitHub Pages serves your site at https://<username>.github.io/<repo-name>/
// If this doesn't match your repo name exactly, you'll get a blank white page.
export default defineConfig({
  plugins: [react()],
  base: '/pokemon-checklist/',
})