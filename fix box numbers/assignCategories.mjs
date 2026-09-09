// Tags every Pokémon in pokemon.json with a "category" field, based on
// simple naming rules. Run this any time you add new Pokémon to the file:
//
//   node scripts/assignCategories.mjs
//
// HOW TO NAME NEW ENTRIES SO THIS SCRIPT PICKS THEM UP:
//   Alolan form      -> start the name with "Alolan "      e.g. "Alolan Vulpix"
//   Hisuian form      -> start the name with "Hisuian "     e.g. "Hisuian Zorua"
//   Paldean form      -> start the name with "Paldean "     e.g. "Paldean Wooper"
//   Totem Pokémon     -> start the name with "Totem "       e.g. "Totem Raticate"
//   Gigantamax form   -> start the name with "Gigantamax "  e.g. "Gigantamax Charizard"
//   N's Pokémon       -> put "(N's)" anywhere in the name   e.g. "Zorua (N's)"
//   Gender variant     -> same exact name as the base Pokémon, just a
//                         different id and sprite (this already works for
//                         the entries you have — nothing to type differently)
//   Anything else with a different id than dexId (Mega, Origin Forme,
//   costumes, seasonal forms, etc.) automatically falls into "form" —
//   the general "form difference" bucket.
//   Everything else (id === dexId) is just "base".

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../src/data/pokemon.json')

const pokemon = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// Look up each base Pokémon's name by its dexId, so we can tell a gender
// variant (same name as the base) apart from an actual form (different name).
const baseNameByDexId = {}
for (const p of pokemon) {
  if (p.id === p.dexId) baseNameByDexId[p.dexId] = p.name
}

function categorize(p) {
  if (p.id === p.dexId) return 'base'

  const name = p.name
  if (name.startsWith('Alolan ')) return 'alolan'
  if (name.startsWith('Hisuian ')) return 'hisuian'
  if (name.startsWith('Paldean ')) return 'paldean'
  if (name.startsWith('Totem ')) return 'totem'
  if (name.startsWith('Gigantamax ')) return 'gigantamax'
  if (name.includes("(N's)")) return 'n'

  const isSameNameAsBase = baseNameByDexId[p.dexId] === name
  if (isSameNameAsBase) return 'gender'

  return 'form'
}

for (const p of pokemon) {
  p.category = categorize(p)
}

fs.writeFileSync(DATA_PATH, JSON.stringify(pokemon, null, 2) + '\n')

const counts = {}
for (const p of pokemon) {
  counts[p.category] = (counts[p.category] || 0) + 1
}
console.log('Tagged', pokemon.length, 'Pokémon:')
console.log(counts)
