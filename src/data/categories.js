// Every "extra" category beyond generation, in the order they show up in
// the sidebar. `key` must match the `category` value the assignCategories
// script writes onto each Pokémon in pokemon.json.
//
// Adding a new category later? Add one line here, and add a matching rule
// in scripts/assignCategories.mjs so entries actually get tagged with it.
export const CATEGORIES = [
  { key: 'gender', label: 'Gender Variants' },
  { key: 'form', label: 'Form Differences' },
  { key: 'alolan', label: 'Alolan Forms' },
  { key: 'galarian', label: 'Galarian Forms' },
  { key: 'hisuian', label: 'Hisuian Forms' },
  { key: 'paldean', label: 'Paldean Forms' },
  { key: 'n', label: "N's Pokémon" },
  { key: 'totem', label: 'Totem Pokémon' },
  { key: 'gmax', label: 'Gigantamax Forms' },
]