import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ IMPORTANT: change 'checklists' below to your actual GitHub repo name.
// GitHub Pages serves your site at https://<username>.github.io/<repo-name>/
// This must match the `basename` passed to <BrowserRouter> in App.jsx too —
// if the two ever disagree, links inside the app will 404 on the live site.
export default defineConfig({
  plugins: [react()],
  base: '/checklists/',
})
