//  1. Makes sure every non-base Pokémon (anything where id !== dexId —
//     genders, forms, regional variants, Gigantamax, etc.) has a unique
//     id. Existing ids are NEVER renumbered — only an entry with no id
//     yet (a brand new one you just added), or one whose id happens to
//     collide with something else's, gets assigned a fresh one. That's
//     what makes it safe to insert a new Pokémon anywhere in this file —
//     in the middle, not just at the very end — and rerun this script:
//     only the new entry gets an id, nothing else shifts. Progress is
//     stored keyed by id, not by file position, so nobody's already-
//     checked Pokémon can silently look unchecked afterward. Base-form
//     ids (id === dexId) are never touched either way.
//  2. Assigns a boxId to any entry that doesn't have one yet, 30 per box.
//     Entries that ALREADY have a boxId (including ones you set by hand,
//     like grouping a whole category into its own box) are left alone —
//     this script will never move or renumber a box you've already set.
//
// Run from your project root:
//   node src/checklists/home/scripts/assignBoxes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data.json')

// Any id in this list: the NEXT entry after it starts a fresh box,
// even if the current box isn't full yet. Only matters for entries that
// don't already have a boxId — see step 2 below.
const FORCED_BREAKS = new Set([
  1025, // Pecharunt -> next entry starts a new box
])

const BOX_SIZE = 30

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// --- Step 1: guarantee every non-base entry has a unique id ---
// Single pass: base forms and any non-base entry whose id is already set
// AND hasn't been claimed by an earlier entry in the file keep exactly
// what they have. Only an entry with no id (new), or one that collides
// with something earlier in the file, gets assigned a fresh id — the
// next integer that's not already used anywhere in this file.
const claimedIds = new Set()
let nextId = Math.max(
  0,
  ...pokemon.map(p => p.dexId),
  ...pokemon.map(p => p.id ?? 0)
) + 1

let newlyAssignedCount = 0

for (const p of pokemon) {
  if (p.id === p.dexId) {
    claimedIds.add(p.id) // base form — never reassigned
    continue
  }
  if (p.id != null && !claimedIds.has(p.id)) {
    claimedIds.add(p.id) // already has its own safe, unclaimed id — keep it as-is
    continue
  }
  // Either had no id at all (a newly added entry), or its id collides
  // with an earlier entry's (a copy-paste mistake) — give it a fresh one
  // that's never been used anywhere else in this file.
  while (claimedIds.has(nextId)) nextId++
  p.id = nextId
  claimedIds.add(nextId)
  newlyAssignedCount++
}

// --- Step 2: fill in boxId ONLY for entries that don't have one yet ---
const boxedEntries = pokemon.filter(p => p.boxId != null)
const highestExistingBox = boxedEntries.length
  ? Math.max(...boxedEntries.map(p => p.boxId))
  : 0

let boxId = highestExistingBox + 1
let countInCurrentBox = 0
let previousId = null

for (const p of pokemon) {
  if (p.boxId != null) {
    previousId = p.id
    continue // already boxed (by hand or a previous run) — leave it alone
  }

  const forceNewBox = previousId !== null && FORCED_BREAKS.has(previousId)
  const boxIsFull = countInCurrentBox >= BOX_SIZE

  if (forceNewBox || boxIsFull) {
    boxId++
    countInCurrentBox = 0
  }

  p.boxId = boxId
  countInCurrentBox++
  previousId = p.id
}

fs.writeFileSync(DATA_PATH, JSON.stringify(pokemon, null, 2) + '\n')

const actualBoxCount = Math.max(...pokemon.map(p => p.boxId))
console.log(`Ids: ${newlyAssignedCount} newly assigned, ${claimedIds.size} unique total.`)
console.log(`Boxes: ${actualBoxCount} total across ${pokemon.length} Pokémon.`)
