import data from './data.json'
export default {
  id: 'la',
  title: 'Pokémon Legends Arceus',
  path: '/la',
  icon: 'icons/legends-arceus.png',
  backgroundImage: null,
  accentFrom: '#cfdced',
  accentTo: '#74824e',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'la-caught-v1',
  syncId: 'la',
  groupSets: [],
}