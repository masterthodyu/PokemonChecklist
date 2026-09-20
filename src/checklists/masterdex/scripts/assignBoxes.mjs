// Fixes up ../data.json:
//  1. Guarantees every entry has a unique id. Existing ids are NEVER
//     renumbered — only an entry with no id yet (one you just added by
//     hand), or one whose id collides with an earlier entry's, gets
//     assigned a fresh one. Safe to insert a new Pokémon anywhere in the
//     file, not just at the end, and rerun this — only the new/colliding
//     entry's id changes, nothing else shifts. Progress is stored keyed
//     by id, not file position, so an already-checked entry can't
//     silently look unchecked afterward.
//
//     Unlike Home's version of this script, there's no "base form" id to
//     leave alone here — masterdex isn't a full dex, every entry is its
//     own specific catch, so every id goes through the same check.
//  2. Assigns a boxId to any entry that doesn't have one yet, 30 per box.
//     An entry that already has a boxId (including one set by hand) is
//     left alone.
//
// Run from your project root:
//   node src/checklists/masterdex/scripts/assignBoxes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data.json')

// Any id in this list: the NEXT entry after it starts a fresh box, even
// if the current box isn't full. Only matters for entries with no boxId
// yet — empty for now, add to it if you ever want to group entries into
// their own dedicated boxes (e.g. all Pokéwalker catches together).
const FORCED_BREAKS = new Set([])

const BOX_SIZE = 30

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// --- Step 1: guarantee every entry has a unique id ---
const claimedIds = new Set()
let nextId = Math.max(0, ...pokemon.map(p => p.id ?? 0)) + 1
let newlyAssignedCount = 0

for (const p of pokemon) {
  if (p.id != null && !claimedIds.has(p.id)) {
    claimedIds.add(p.id) // already has its own safe, unclaimed id — keep it
    continue
  }
  // No id at all, or it collides with an earlier entry's — give it a
  // fresh one that's never been used anywhere else in this file.
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
