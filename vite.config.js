import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This must match your actual GitHub repo name — GitHub Pages serves
// your site at https://<username>.github.io/<repo-name>/. App.jsx reads
// this same value automatically via import.meta.env.BASE_URL, so you
// only ever need to change it here, in this one place.
export default defineConfig({
  plugins: [react()],
  base: '/PokemonChecklist/',
})