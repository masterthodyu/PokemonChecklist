import data from './data.json'
import { GENERATIONS } from './generations.js'
import { CATEGORIES } from './categories.js'

// This is the only Pokémon-specific file the shared engine (src/engine/)
// reads from. Everything in engine/ is generic and works off whatever
// config gets handed to it — to add a new checklist, copy this folder's
// shape (config.js + data.json + optional scripts/) and register the new
// config in src/checklists/index.js.
export default {
  id: 'pokemon',
  title: 'Pokémon Caught Checklist',
  path: '/pokemon',
  icon: 'https://play-lh.googleusercontent.com/gKOiChbx6pKJ8PDmdpsSfLuULbljOFGVf67B8ley5Ym6eYK4KfIrnl1x3Jg2Kei-6sSegsxpz-k5gycvFAUw',
  // The Pokéball's own red/yellow — also the engine's default accent, so
  // this is here for clarity rather than necessity.
  accentFrom: '#ee1515',
  accentTo: '#ffcb05',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'pokemon-caught-v1',
  // Set VITE_POKEMON_BIN_ID in .env.local / GitHub Actions secrets to turn
  // on cloud sync for this checklist specifically. Leaving it unset just
  // means this checklist saves locally only — nothing else breaks.
  jsonBinId: import.meta.env.VITE_POKEMON_BIN_ID,

  // Each entry here becomes one progress-bar list in the left sidebar.
  // `filter` narrows the full data set down to what's eligible for this
  // group set at all; `matches` decides which specific group an item
  // belongs to; `displayLabel` formats the row's heading text.
  groupSets: [
    {
      label: 'Generation',
      groups: GENERATIONS,
      filter: item => item.id === item.dexId, // only base-form Pokémon count
      matches: (item, g) => item.dexId >= g.start && item.dexId <= g.end,
      displayLabel: g => `Gen ${g.gen} · ${g.label}`,
    },
    {
      label: 'Category',
      groups: CATEGORIES,
      filter: () => true,
      matches: (item, g) => item.category === g.key,
      displayLabel: g => g.label,
    },
  ],
}