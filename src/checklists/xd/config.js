import data from './data.json'
export default {
  id: 'xd',
  title: 'Pokémon XD: Gale of Darkness',
  path: '/xd',
  // Shadow Lugia's own menu sprite — the game's box-art mascot. A
  // stand-in, self-hosted now (see public/icons/xd.png) rather than
  // hotlinked. Swap for a real logo in public/icons/ when you have one.
  icon: 'icons/xd.png',
  // Shadow Lugia's pale blue-white into Shadow purple.
  accentFrom: '#cfdced',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'xd-caught-v1',
  syncId: 'xd',
  groupSets: [],
}