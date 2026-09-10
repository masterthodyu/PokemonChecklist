import data from './data.json'

// ⚠️ data.json here is a 3-entry PLACEHOLDER (just the starter line), not
// the real Alola regional dex. I didn't want to guess at the exact
// species order for the full ~400-entry USUM regional Pokédex from
// memory — getting the sequence wrong would put everything in the wrong
// box. Two ways to fill this in properly:
//   1. Ask Claude to look it up carefully (a real, focused research pass)
//   2. Build data.json the same way you built the Home checklist's data
// Once real data.json is in place, this config file itself likely needs
// no changes at all — same shape as pokemon/config.js.
export default {
  id: 'usum',
  title: 'Pokémon Ultra Sun & Ultra Moon',
  path: '/usum',
  icon: '/icons/usum.png',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'usum-caught-v1',
  jsonBinId: import.meta.env.VITE_USUM_BIN_ID,
  groupSets: [],
}