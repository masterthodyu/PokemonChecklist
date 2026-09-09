// Fixes up src/data/pokemon.json:
//  1. Makes sure every non-base Pokémon (anything where id !== dexId —
//     genders, forms, regional variants, Gigantamax, etc.) has a unique
//     id. Safe to run any time, even if you or Copilot added entries by
//     hand with id numbers that happen to collide with something else —
//     this will renumber them cleanly, in the order they already appear
//     in the file. Base-form ids (id === dexId) are never touched.
//  2. Assigns a boxId to any entry that doesn't have one yet, 30 per box.
//     Entries that ALREADY have a boxId (including ones you set by hand,
//     like grouping a whole category into its own box) are left alone —
//     this script will never move or renumber a box you've already set.
//
// Run from your project root:
//   node scripts/assignBoxes.mjs
//
// Heads up: renumbering ids can shift which id number a gender/form
// Pokémon happens to have. If you've already got some of those checked
// off as caught, double-check your progress after running this — your
// caught list is stored by id, so a few might look unchecked afterward
// and need re-checking. Base-dex Pokémon (the vast majority) are never
// affected, since their id never changes.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../src/data/pokemon.json')

// Any id in this list: the NEXT entry after it starts a fresh box,
// even if the current box isn't full yet. Only matters for entries that
// don't already have a boxId — see step 2 below.
const FORCED_BREAKS = new Set([
  1025, // Pecharunt -> next entry starts a new box
])

const BOX_SIZE = 30

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// --- Step 1: guarantee every non-base entry has a unique id ---
const maxDexId = Math.max(...pokemon.map(p => p.dexId))
let nextId = maxDexId + 1
for (const p of pokemon) {
  if (p.id !== p.dexId) {
    p.id = nextId
    nextId++
  }
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
console.log(`Ids: unique through ${nextId - 1}.`)
console.log(`Boxes: ${actualBoxCount} total across ${pokemon.length} Pokémon.`)
