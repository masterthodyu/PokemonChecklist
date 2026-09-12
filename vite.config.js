import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ IMPORTANT: '/PokemonChecklist/' below must match your actual GitHub
// repo name. GitHub Pages serves your site at
// https://<username>.github.io/<repo-name>/ — App.jsx reads this same
// value automatically (via import.meta.env.BASE_URL), so you never need
// to update it in two places.
//
// This only applies the subpath when actually building for deployment.
// During `npm run dev` it stays at the plain root ('/'), since forcing
// the dev server under a subpath is what was causing the 404 — most
// setups (including GitHub Codespaces' forwarded preview URL) open the
// dev server at its root, not at /PokemonChecklist/.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/PokemonChecklist/' : '/',
  server: {
    // Vite only listens on localhost by default, which Codespaces' port
    // forwarding can't reach — this makes it listen on all interfaces
    // inside the container so the forwarded .app.github.dev URL works.
    host: true,
  },
}))