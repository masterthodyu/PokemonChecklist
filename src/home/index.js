import pokemonConfig from './pokemon/config.js'

// Add each new checklist's config here once it exists — this list drives
// both the routes in App.jsx and the summary cards on HubPage.jsx.
// To add a checklist: copy the pokemon/ folder's shape (config.js +
// data.json + optional scripts/), then add its config import + entry here.
export const CHECKLISTS = [
  pokemonConfig,
  // nextChecklistConfig,
]
