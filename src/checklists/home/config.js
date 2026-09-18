import data from './data.json'
import { GENERATIONS } from './generations.js'
import { CATEGORIES } from './categories.js'
export default {
  id: 'home',
  title: 'Pokémon Home',
  path: '/home',
  icon: 'icons/home.png',
  accentFrom: '#ee1515',
  accentTo: '#ffcb05',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'pokemon-caught-v1',
  syncId: 'pokemon',

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