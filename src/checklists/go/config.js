import data from './data.json'
export default {
  id: 'go',
  title: 'Pokémon GO',
  path: '/go',
  icon: 'icons/go.png',
  backgroundImage: 'backgrounds/gobg.png',
  accentFrom: '#2f80c4',
  accentTo: '#7ed6df',
  data, // array of { id, dexId, name, spriteUrl, category }
  // boxSize intentionally left out — boxless checklist, see note above.
  storageKey: 'go-caught-v1',
  syncId: 'go',
  groupSets: [],
}