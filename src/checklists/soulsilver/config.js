import data from './data.json'
export default {
  id: 'soulsilver',
  title: 'Pokémon Soul Silver & Heart Gold',
  path: '/soulsilver',
  icon: 'https://i0.wp.com/jklaczpokemon.com/wp-content/uploads/2018/07/heartgold-soulsilver-symbol.png?fit=500%2C500&ssl=1&w=640',
  // Silver to gold — the two version names themselves.
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'soulsilver-caught-v1',
  syncId: 'soulsilver',
  groupSets: [],
}