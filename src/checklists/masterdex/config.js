import data from './data.json'
import homeConfig from '../home/config.js'

// Pokémon that don't fit "did you catch this species" — specific shinies,
// event/location-locked forms, matched pairs. A bonus tier on top of the
// real dex, not part of it (see `bonus` below).
//
// data.json is still just the 5-entry starter template from when this was
// set up — flip `placeholder` off once the real list replaces it. Every
// spriteUrl in it is a local placeholder path with no file behind it yet.

// Highest boxId in Home's own data, read live rather than typed in by
// hand — so this always matches Home's real last box as it grows.
const homeLastBoxId = Math.max(...homeConfig.data.map(item => item.boxId), 0)

export default {
  id: 'masterdex',
  title: 'Master Dex',
  path: '/masterdex',
  icon: null,
  accentFrom: '#c9a227',
  accentTo: '#4b3869',
  data, // array of { id, dexId, name, spriteUrl, boxId }
  boxSize: 30,
  storageKey: 'masterdex-caught-v1',
  syncId: 'masterdex',
  groupSets: [],
  placeholder: true,
  bonus: true, // excluded from the hub's overall completion total, permanently

  // Shifts displayed box numbers to continue right after Home's (see
  // ChecklistPage.jsx) — boxId in data.json still starts at 1 like any
  // other checklist, this only changes what's shown.
  boxNumberOffset: homeLastBoxId,
}