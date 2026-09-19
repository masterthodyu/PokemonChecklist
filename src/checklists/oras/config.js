import data from './data.json'
export default {
  id: 'oras',
  title: 'Pokémon Omega Ruby & Alpha Saphire',
  path: '/oras',
  icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRND_zkzWXbQ83xdT3RbCBJhaSeR7y42IAYFYXY-fzzjvJM8jxmK12CqQOe&s=10',
  accentFrom: '#1251a2',
  accentTo: '#e60f0f',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'oras-caught-v1',
  syncId: 'oras',
  groupSets: [],
}