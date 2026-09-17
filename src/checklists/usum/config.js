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
  // Sun-gold to moon-indigo — the actual duality the two versions are
  // named for.
  accentFrom: '#f5a623',
  accentTo: '#3b5bdb',
  // Explicit, not guessed from entry count — this is what tells
  // HubPage.jsx to show "still being built" instead of a percentage
  // that doesn't mean anything yet.
  placeholder: true,
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'usum-caught-v1',
  syncId: 'usum',
  groupSets: [],
}