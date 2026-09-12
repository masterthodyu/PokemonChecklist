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
  icon: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/46694fc5-76fc-4293-9b54-3038569ae18d/deeinkc-1a4a97e6-4a94-4d68-b64d-d3dd6b64ff2c.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi80NjY5NGZjNS03NmZjLTQyOTMtOWI1NC0zMDM4NTY5YWUxOGQvZGVlaW5rYy0xYTRhOTdlNi00YTk0LTRkNjgtYjY0ZC1kM2RkNmI2NGZmMmMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.sjgbfCwFcDBqZvtbo27zQN9XHHkoTHZMzeZxl___2P8',
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