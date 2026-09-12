import data from './data.json'

// ⚠️ data.json here is a 3-entry PLACEHOLDER (just the starter line), not
// the real Alola regional dex. I didn't want to guess at the exact
// species order for the full ~400-entry soulsilver regional Pokédex from
// memory — getting the sequence wrong would put everything in the wrong
// box. Two ways to fill this in properly:
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
  syncId: 'soulsilver',
  groupSets: [],
}