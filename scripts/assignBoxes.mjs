import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../src/data/pokemon.json')

// Any id in this list: the NEXT entry after it starts a fresh box,
// even if the current box isn't full yet.
const FORCED_BREAKS = new Set([
  1025, // Pecharunt -> next entry starts a new box
])

const BOX_SIZE = 30

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// --- Step 1: fill in missing ids, continuing from the highest existing id ---
let nextId = Math.max(...pokemon.filter(p => p.id != null).map(p => p.id)) + 1
for (const p of pokemon) {
  if (p.id == null) {
    p.id = nextId
    nextId++
  }
}

// --- Step 2: assign boxId, 30 per box, with forced breaks ---
let boxId = 1
let countInCurrentBox = 0
let previousId = null

for (const p of pokemon) {
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

console.log(`Assigned ids up to ${nextId - 1}.`)
console.log(`Assigned ${boxId} boxes across ${pokemon.length} Pokémon.`)
