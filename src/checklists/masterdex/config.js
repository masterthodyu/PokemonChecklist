import data from './data.json'
import homeConfig from '../home/config.js'

// Pokémon that don't fit "did you catch this species" — specific shinies,
// event/location-locked forms, matched pairs. A bonus tier on top of the
// real dex, not part of it (see `bonus` below).
//
// Growing by hand, entry by entry — after adding a new one (with or
// without an id/boxId of its own), run:
//   node src/checklists/masterdex/scripts/assignBoxes.mjs
// It only assigns an id/boxId to what's actually new or colliding;
// nothing already correct gets touched or renumbered.

// Highest boxId in Home's own data, read live rather than typed in by
// hand — so this always matches Home's real last box as it grows.
const homeLastBoxId = Math.max(...homeConfig.data.map(item => item.boxId), 0)

export default {
  id: 'masterdex',
  title: 'Master Dex',
  path: '/masterdex',
  icon: 'icons/master.png',
  accentFrom: '#c9a227',
  accentTo: '#4b3869',
  data, // array of { id, dexId, name, spriteUrl, boxId }
  boxSize: 30,
  storageKey: 'masterdex-caught-v1',
  syncId: 'masterdex',
  groupSets: [],
  bonus: true, // excluded from the hub's overall completion total, permanently

  // Multiple entries here legitimately share a plain name — "Pikachu"
  // from Pokémon Battle Revolution and "Pikachu" from an Alola surf event
  // are two different, specific catches, not the same entry twice, but
  // spelling that difference out in the name itself for every single one
  // ("Pikachu (Pokémon Battle Revolution)", "Pikachu (Alola, Surfing
  // Event)"...) gets unreadable fast across a list built on this many
  // one-off distinctions. The `note` field (see ItemCard.jsx's hover
  // tooltip) carries that distinction instead, so the name can stay
  // short. Registry.test.jsx's normal duplicate-name check skips any
  // checklist with this set — ids still have to be unique regardless,
  // that check is never skipped for anyone.
  allowDuplicateNames: true,

  // Shifts displayed box numbers to continue right after Home's (see
  // ChecklistPage.jsx) — boxId in data.json still starts at 1 like any
  // other checklist, this only changes what's shown.
  boxNumberOffset: homeLastBoxId,
}