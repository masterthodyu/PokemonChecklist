import data from './data.json'
import homeConfig from '../home/config.js'

// The "Master Dex" — Pokémon inspired by BirdKeeperToby-style extreme
// completionism that don't fit anywhere else in this project: specific
// shinies, specific event/location-locked forms, matched pairs. Less
// "did you catch this species" and more "did you pull off this exact
// thing." A bonus tier on top of the real dex, not part of it — see the
// `bonus` flag below.
//
// data.json right now is just a 5-entry starter template built from the
// examples given when this checklist was set up (shiny Haxorus, Red
// Gyarados, a matching Spinda pair, Origin Dialga/Palkia) — not the real
// curated list yet. Flip `placeholder` to false once that's in.
//
// Every spriteUrl in data.json right now is a LOCAL PLACEHOLDER PATH
// ("sprites/masterdex/...") that doesn't point at a real file yet —
// nothing was guessed at on purpose, after a previous checklist shipped
// a typo'd hotlink (silvally-steel.pngl) that slipped through. Either
// drop real images at those exact paths, or replace the spriteUrl values
// with real hotlinks and run scripts/download-sprites.mjs.

// Master Dex's boxes pick up exactly where Home's leave off — this reads
// Home's own data.json and takes its highest boxId, live, rather than a
// number typed in here by hand. That means it's automatically correct
// forever: whenever Home grows, this grows with it on the next build, so
// there's no fixed number to remember to bump, and no way for the two to
// ever collide. See boxNumberOffset below for how this actually gets used.
const homeLastBoxId = Math.max(...homeConfig.data.map(item => item.boxId), 0)

export default {
  id: 'masterdex',
  title: 'Master Dex',
  path: '/masterdex',
  // No icon set yet — the hub shows a plain placeholder box until one's
  // added, same as any checklist without one.
  icon: null,
  // Prestige gold into deep purple, to read as a step up from the
  // standard red-to-yellow bar.
  accentFrom: '#c9a227',
  accentTo: '#4b3869',
  data, // array of { id, dexId, name, spriteUrl, boxId }
  boxSize: 30,
  storageKey: 'masterdex-caught-v1',
  syncId: 'masterdex',
  groupSets: [],

  // Still just the 5-entry starter template above — see the file header.
  // Flip this off once the real list replaces it.
  placeholder: true,

  // Deliberately excluded from the hub's "overall completion" total (see
  // HubPage.jsx) — permanently, not just while `placeholder` above is
  // true. This is a bonus tier on top of the real dex, so it shouldn't
  // drag the main percentage around even once fully built out.
  bonus: true,

  // Purely cosmetic (see ChecklistPage.jsx) — makes this checklist's
  // boxes read as "Box 71, 72, 73…" (whatever comes right after Home's
  // own last box) instead of starting back at 1, so opening Master Dex
  // naturally picks up exactly where Home leaves off. The underlying
  // boxId values in data.json still start at 1, same as every other
  // checklist — this only changes what gets displayed.
  //
  // Computed live above from Home's actual data, not typed in as a fixed
  // number — so this always equals Home's real last box, whatever that
  // grows to be, with nothing to remember to update by hand.
  boxNumberOffset: homeLastBoxId,
}