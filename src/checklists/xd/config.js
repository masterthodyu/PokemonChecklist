import data from './data.json'
export default {
  id: 'xd',
  title: 'Pokémon XD: Gale of Darkness',
  path: '/xd',
  icon: 'icons/xd.png',
  backgroundImage: null,
  accentFrom: '#cfdced',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'xd-caught-v1',
  syncId: 'xd',
  groupSets: [],
}