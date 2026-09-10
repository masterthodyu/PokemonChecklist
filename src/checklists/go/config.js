import data from './data.json'

// Pokémon GO doesn't have a PC box system like the mainline games — you
// just have one big collection. Leaving boxSize out entirely (instead of
// setting a number) tells the engine to skip box navigation completely
// and show everything as one flat, searchable list instead.
export default {
  id: 'go',
  title: 'Pokémon GO',
  path: '/go',
  icon: '/icons/pokemon-go.png',
  data, // array of { id, dexId, name, spriteUrl, category }
  // boxSize intentionally left out — boxless checklist, see note above.
  storageKey: 'go-caught-v1',
  jsonBinId: import.meta.env.VITE_GO_BIN_ID,

  // Starting point only — this currently covers Gen 1 (Kanto), which has
  // definitely been in the game since launch. Later generations have been
  // added to GO in waves over time and not every species from every gen
  // has necessarily made it in, so rather than guess, this is left for
  // you to extend deliberately as you confirm what's actually available.
  // Add more entries to data.json the same way (id, dexId, name,
  // spriteUrl, category) — no boxId needed since this checklist is boxless.
  groupSets: [],
}