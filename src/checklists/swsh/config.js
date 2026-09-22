import data from './data.json'
export default {
  id: 'swsh',
  title: 'Pokémon Sword & Shield',
  path: '/swsh',
  icon: 'icons/swsh.png',
  backgroundImage: 'backgrounds/swsh.jpg',
  accentFrom: '#d6932e',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'swsh-caught-v1',
  syncId: 'swsh',
  groupSets: [],
}