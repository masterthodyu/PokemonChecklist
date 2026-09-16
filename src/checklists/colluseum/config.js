import data from './data.json'
import { CATEGORIES } from './categories.js'

// Pokémon Colosseum. data.json is the REAL, complete list now — built from
// Bulbapedia's "List of Shadow Pokémon" article, in that article's own row
// order (which is roughly story order, not dex order):
//   https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pokémon
//
// 54 entries = 51 Shadow Pokémon + Wes's two starters + the Mt. Battle Ho-Oh.
// Espeon, Umbreon and Ho-Oh are Colosseum-exclusive obtainables but are NOT
// Shadow Pokémon, so they're tagged 'starter'/'bonus' rather than 'shadow' —
// that keeps the Shadow count honest (and stops ItemCard giving them the
// purple Shadow glow they shouldn't have).
//
// Three of the 51 (Togepi, Mareep, Scizor) are Japanese-only e-Reader
// snags via the Card e Room. They're included because this checklist is
// "every Pokémon possible", but they're the ones to expect to never tick off
// on a Western cartridge — see the README's note about them.
//
// The folder/id spelling "colluseum" is a typo for "Colosseum", kept
// deliberately: `id`, `storageKey` and `syncId` are the literal keys your
// saved progress already lives under, locally and in Firebase. Renaming
// them would point the app at empty keys and your progress would look
// like it reset. Only the display `title` is spelled correctly.
export default {
  id: 'colluseum',
  title: 'Pokémon Colosseum',
  path: '/colluseum',
  // Umbreon's Colosseum menu sprite — Wes's signature Pokémon. A
  // stand-in, not a real game logo, but self-hosted now (see
  // public/icons/colluseum.png) rather than hotlinked. Swap in a proper
  // Colosseum logo in public/icons/ when you have one.
  icon: '/icons/colluseum.png',
  // Orre's desert sand into Shadow purple — Colosseum's own box art palette,
  // rather than the USUM sun/moon colors this was copy-pasted from.
  accentFrom: '#c8a25b',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'colluseum-caught-v1',
  syncId: 'colluseum',

  // One sidebar list, so the Shadow Pokémon count (the actual goal of the
  // game) reads separately from the three non-Shadow extras rather than
  // getting blended into one "54 total" number.
  groupSets: [
    {
      label: 'Category',
      groups: CATEGORIES,
      filter: () => true,
      matches: (item, g) => item.category === g.key,
      displayLabel: g => g.label,
    },
  ],
}