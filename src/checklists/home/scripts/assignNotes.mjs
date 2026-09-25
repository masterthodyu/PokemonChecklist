// Fills in the "note" field (see ItemCard's hover tooltip, and the
// "What it does" section of the README) for every base-form Pokémon
// (id === dexId) — the game trio it originally debuted in. Only touches
// entries missing a note; anything already set (a hand-written override)
// is left alone.
//
// Add a new generation by adding one line to RANGES below, then:
//   node src/checklists/home/scripts/assignNotes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data.json')

// Same dexId ranges as generations.js, paired with the game trio each
// generation's Pokémon actually debuted in. Only the base pair is listed
// for a generation with no same-gen enhanced/definitive third version
// (Yellow, Crystal, Emerald, and Platinum are the exceptions).
const RANGES = [
  [1, 151, 'Red/Yellow/Blue'],
  [152, 251, 'Gold/Silver/Crystal'],
  [252, 386, 'Ruby/Sapphire/Emerald'],
  [387, 493, 'Diamond/Pearl/Platinum'],
  [494, 649, 'Black/White'],
  [650, 721, 'X/Y'],
  [722, 809, 'Sun/Moon'],
  [810, 905, 'Sword/Shield'],
  [906, 1025, 'Scarlet/Violet'],
  // [1026, ????, 'Game/Names'],  <- add Gen 10 here once its dex range is known
]

function noteFor(dexId) {
  const hit = RANGES.find(([start, end]) => dexId >= start && dexId <= end)
  return hit ? hit[2] : null
}

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

let filled = 0
let skippedHasNote = 0
let skippedNoRange = 0

for (const p of pokemon) {
  if (p.id !== p.dexId) continue // base forms only
  if (p.note) {
    skippedHasNote++
    continue
  }
  const note = noteFor(p.dexId)
  if (note == null) {
    skippedNoRange++
    continue
  }
  p.note = note
  filled++
}

fs.writeFileSync(DATA_PATH, JSON.stringify(pokemon, null, 2) + '\n')

console.log(`Notes filled: ${filled}`)
console.log(`Skipped (already had a note): ${skippedHasNote}`)
if (skippedNoRange > 0) {
  console.log(`Skipped (no matching range — probably a new generation RANGES doesn't cover yet): ${skippedNoRange}`)
}
