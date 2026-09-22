import data from './data.json'
export default {
  id: 'oras',
  title: 'Pokémon Omega Ruby & Alpha Saphire',
  path: '/oras',
  icon: 'icons/oras.png',
  backgroundImage: 'backgrounds/orasbg.png',
  accentFrom: '#1251a2',
  accentTo: '#e60f0f',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'oras-caught-v1',
  syncId: 'oras',
  groupSets: [],
}