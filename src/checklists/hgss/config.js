import data from './data.json'
export default {
  id: 'hgss',
  title: 'Pokémon Heart Gold & Soul Silver ',
  path: '/hgss',
  icon: 'icons/hgss.png',
  // Silver to gold — the two version names themselves.
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'hgss-caught-v1',
  syncId: 'hgss',
  groupSets: [],
}