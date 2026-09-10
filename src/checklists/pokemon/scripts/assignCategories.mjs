// Tags every Pokémon in ../data.json with a "category" field, based on
// simple naming rules. Run this any time you add new Pokémon to the file:
//
//   node src/checklists/pokemon/scripts/assignCategories.mjs
//
// HOW TO NAME NEW ENTRIES SO THIS SCRIPT PICKS THEM UP:
//   Alolan form      -> start the name with "Alolan "        e.g. "Alolan Vulpix"
//   Galarian form     -> start the name with "Galarian "      e.g. "Galarian Ponyta"
//   Hisuian form      -> start the name with "Hisuian "       e.g. "Hisuian Zorua"
//   Paldean form      -> start the name with "Paldean "       e.g. "Paldean Wooper"
//   Totem Pokémon     -> start the name with "Totem "         e.g. "Totem Raticate"
//   Gigantamax form   -> put "(Gigantamax)" at the end        e.g. "Charizard (Gigantamax)"
//   N's Pokémon       -> put "N's" anywhere in the name       e.g. "Zorua (N's Pokémon)"
//   Gender variant     -> same exact name as the base Pokémon, just a
//                         different id and sprite (this already works for
//                         the entries you have — nothing to type differently)
//   Anything else with a different id than dexId (Mega, Origin Forme,
//   costumes, seasonal forms, etc.) automatically falls into "form" —
//   the general "form difference" bucket.
//   Everything else (id === dexId) is just "base".
//
// This always re-tags every entry based on its name, using the rules
// above. If you've hand-set a category that doesn't match the name
// pattern (on purpose, for a one-off exception), running this script
// WILL overwrite it back to what the name suggests — the printed list of
// changes at the end is there so you can catch that and re-fix it if
// that happens.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../data.json')

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
  if (name.startsWith('Galarian ')) return 'galarian'
  if (name.startsWith('Hisuian ')) return 'hisuian'
  if (name.startsWith('Paldean ')) return 'paldean'
  if (name.startsWith('Totem ')) return 'totem'
  if (name.includes('Gigantamax')) return 'gmax'
  if (name.includes("N's")) return 'n'

  const isGenderVariant =
    name.includes('♀') ||
    name.includes('♂') ||
    baseNameByDexId[p.dexId] === name
  if (isGenderVariant) return 'gender'

  return 'form'
}

const changes = []
for (const p of pokemon) {
  const detected = categorize(p)
  if (p.category && p.category !== detected) {
    changes.push({ name: p.name, from: p.category, to: detected })
  }
  p.category = detected
}

fs.writeFileSync(DATA_PATH, JSON.stringify(pokemon, null, 2) + '\n')

const counts = {}
for (const p of pokemon) {
  counts[p.category] = (counts[p.category] || 0) + 1
}
console.log('Tagged', pokemon.length, 'Pokémon:')
console.log(counts)

if (changes.length) {
  console.log(`\n${changes.length} entries changed category — worth a quick look:`)
  for (const c of changes) {
    console.log(`  "${c.name}": ${c.from} -> ${c.to}`)
  }
}
