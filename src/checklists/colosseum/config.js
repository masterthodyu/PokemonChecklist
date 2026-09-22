import data from './data.json'
import { CATEGORIES } from './categories.js'
export default {
  id: 'colosseum',
  title: 'Pokémon Colosseum',
  path: '/colosseum',
  icon: 'icons/colosseum.png',
  backgroundImage: 'backgrounds/Colosseum.jpg',
  accentFrom: '#c8a25b',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'colosseum-caught-v1',
  syncId: 'colosseum',
  groupSets: [
    {
      label: 'Category',
      groups: CATEGORIES,
      filter: () => true,
      matches: (item, g) => item.category === g.key,
      displayLabel: g => g.label,
    },
  ],
}