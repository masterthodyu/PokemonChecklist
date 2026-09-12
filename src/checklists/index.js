import pokemonConfig from './pokemon/config.js'
import goConfig from './go/config.js'
import usumConfig from './usum/config.js'
import soulsilverConfig from './soulsilver/config.js'

// Add each new checklist's config here once it exists — this list drives
// both the routes in App.jsx and the summary cards on HubPage.jsx.
// To add a checklist: copy the pokemon/ folder's shape (config.js +
// data.json + optional scripts/), then add its config import + entry here.
export const CHECKLISTS = [
  pokemonConfig,
  goConfig,
  usumConfig,
  soulsilverConfig,
]