import data from './data.json'

// ⚠️ data.json here is a 1-entry PLACEHOLDER (just a single event Pichu),
// not the real Johto/National regional dex. Getting the species order
// wrong would put everything in the wrong box, so rather than guess at
// the full ~250+ entry list from memory, this is left for you to fill in
// properly. Two ways to do that:
//   1. Ask Claude to look it up carefully (a real, focused research pass)
//   2. Build data.json the same way you built the Home checklist's data
// Once real data.json is in place, this config file itself likely needs
// no changes at all — same shape as pokemon/config.js.
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
  jsonBinId: import.meta.env.VITE_SOULSILVER_BIN_ID,
  groupSets: [],
}