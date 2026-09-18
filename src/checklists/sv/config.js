import data from './data.json'
export default {
  id: 'sv',
  title: 'Pokémon Scarlett & Violet',
  path: '/sv',
  icon: 'https://www.dittobase.com/images/game-icons/sv-icon.webp',
  accentFrom: '#d6932e',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'sv-caught-v1',
  syncId: 'sv',
  groupSets: [],
}