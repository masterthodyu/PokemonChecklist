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
// This checklist and its folder were originally spelled "colluseum" (typo
// for "Colosseum") — fixed now, folder included, while this checklist is
// still new enough that nobody has real saved progress sitting under the
// old `colluseum-caught-v1` / `colluseum` keys yet. (This is the opposite
// situation from Home's `pokemon`/`pokemon-caught-v1` keys, which stay
// misspelled on purpose — see that config's own comment — specifically
// because real progress already lives under those.) If you'd already
// checked things off here before this fix, that progress would be sitting
// under the old localStorage key `colluseum-caught-v1` (and old Firebase
// path `checklists/colluseum/...`) — let me know and I can add a one-time
// migration instead of just this rename.
export default {
  id: 'colosseum',
  title: 'Pokémon Colosseum',
  path: '/colosseum',
  // Umbreon's Colosseum menu sprite — Wes's signature Pokémon. A
  // stand-in, not a real game logo, but self-hosted now (see
  // public/icons/colosseum.png) rather than hotlinked. Swap in a proper
  // Colosseum logo in public/icons/ when you have one.
  icon: 'icons/colosseum.png',
  // Orre's desert sand into Shadow purple — Colosseum's own box art palette,
  // rather than the USUM sun/moon colors this was copy-pasted from.
  accentFrom: '#c8a25b',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'colosseum-caught-v1',
  syncId: 'colosseum',

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