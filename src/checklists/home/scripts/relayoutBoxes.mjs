// The "clean slate" version of assignBoxes.mjs. Where that script only
// fills in id/boxId for entries that don't have one yet (safe to run
// after a small append, never touches existing layout), this one
// rebuilds the ENTIRE file's order and every boxId from scratch, sorted
// by dexId. That's what makes inserting something new easy: paste the
// raw new entry anywhere in data.json — literally anywhere, doesn't need
// to be near where it belongs — with no id and no boxId, then run this.
// It ends up in the right place, in the right box, automatically.
//
// Safe to run as often as you want, including after every single edit:
//   - `id` is NEVER changed for anything that already has one — same
//     guarantee, same logic, as assignBoxes.mjs. Progress is saved keyed
//     by id, not by box or array position, so nobody's already-checked
//     Pokémon can silently become unchecked or become a DIFFERENT
//     Pokémon just because the file got re-sorted.
//   - `boxId` and the file's own array order ARE fully rebuilt every
//     run — that's the point. Box placement is pure display, nothing
//     depends on it being stable, so it's free to recompute from
//     scratch every time instead of being hand-maintained.
//
// Sort is by dexId, then (for entries sharing a dexId — a species'
// alternate forms/genders/costumes) by whatever order they're already
// in relative to each other, since JS's sort is stable. So the first
// time you run this, arrange same-dexId entries in the file in whatever
// order you want them to read in-app — that relative order then just
// carries forward automatically on every future run.
//
// This is the "gen 10 just came out" workflow:
//   1. Append the new species as plain objects — {dexId, name, spriteUrl,
//      category} — anywhere in data.json, no id, no boxId, any order.
//   2. node src/checklists/home/scripts/relayoutBoxes.mjs
//   3. node src/checklists/home/scripts/assignNotes.mjs   (if you keep
//      that table updated with the new generation's game name)
//   4. npm test — Registry.test.jsx catches dupes/gaps/malformed data
//
// Run from your project root:
//   node src/checklists/home/scripts/relayoutBoxes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data.json')

// Any dexId in this list: the NEXT entry (in sorted order) after the
// last one with this dexId starts a fresh box, even if the current box
// isn't full. Useful for keeping a box from ending mid-species.
const FORCED_BREAKS_AFTER_DEXID = new Set([
  // e.g. 1025, // force a new box right after every Pecharunt entry
])

const BOX_SIZE = 30

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// --- Step 1: guarantee every entry has a unique id — identical logic
// to assignBoxes.mjs. Base forms (id === dexId) and anything with an
// existing, unclaimed id are left completely alone.
const claimedIds = new Set()
let nextId = Math.max(
  0,
  ...pokemon.map(p => p.dexId),
  ...pokemon.map(p => p.id ?? 0)
) + 1

let newlyAssignedCount = 0

for (const p of pokemon) {
  if (p.id === p.dexId) {
    claimedIds.add(p.id)
    continue
  }
  if (p.id != null && !claimedIds.has(p.id)) {
    claimedIds.add(p.id)
    continue
  }
  while (claimedIds.has(nextId)) nextId++
  p.id = nextId
  claimedIds.add(nextId)
  newlyAssignedCount++
}

// --- Step 2: sort the WHOLE list by dexId (stable — ties keep their
// current relative order), then rewrite every boxId from scratch ---
const sorted = [...pokemon].sort((a, b) => a.dexId - b.dexId)

let boxId = 1
let countInCurrentBox = 0
let previousDexId = null

for (const p of sorted) {
  const forceNewBox = previousDexId !== null
    && previousDexId !== p.dexId
    && FORCED_BREAKS_AFTER_DEXID.has(previousDexId)
  const boxIsFull = countInCurrentBox >= BOX_SIZE

  if ((forceNewBox || boxIsFull) && countInCurrentBox > 0) {
    boxId++
    countInCurrentBox = 0
  }

  p.boxId = boxId
  countInCurrentBox++
  previousDexId = p.dexId
}

// The file's own array order is rewritten to match too — this is what
// lets a future new entry be pasted in ANYWHERE (not necessarily near
// where it belongs) and still come out correctly placed next run.
fs.writeFileSync(DATA_PATH, JSON.stringify(sorted, null, 2) + '\n')

console.log(`Ids: ${newlyAssignedCount} newly assigned, ${claimedIds.size} unique total.`)
console.log(`Boxes: ${boxId} total across ${sorted.length} Pokémon.`)
