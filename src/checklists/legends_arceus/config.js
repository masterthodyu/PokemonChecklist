import data from './data.json'
export default {
  id: 'la',
  title: 'Pokémon Legends Arceus',
  path: '/la',
  icon: 'https://cdn2.steamgriddb.com/icon_thumb/6b36917c087c21e48531ea1309ac0147.png',
  accentFrom: '#cfdced',
  accentTo: '#74824e',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'la-caught-v1',
  syncId: 'la',
  groupSets: [],
}