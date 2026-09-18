import data from './data.json'
export default {
  id: 'usum',
  title: 'Pokémon Ultra Sun & Ultra Moon',
  path: '/usum',
  icon: 'icons/usum.png',
  // Sun-gold to moon-indigo — the actual duality the two versions are
  // named for.
  accentFrom: '#f5a623',
  accentTo: '#3b5bdb',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'usum-caught-v1',
  syncId: 'usum',
  groupSets: [],
}