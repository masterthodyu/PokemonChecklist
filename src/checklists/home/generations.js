// Rough National Dex ranges per generation, used only to bucket base-form
// Pokémon (id === dexId) into a generation for the progress sidebar.
// Alternate forms, genders, and costumes aren't counted here on purpose —
// those are meant to become their own separate categories instead.
export const GENERATIONS = [
  { gen: 1, label: 'Kanto', start: 1, end: 151 },
  { gen: 2, label: 'Johto', start: 152, end: 251 },
  { gen: 3, label: 'Hoenn', start: 252, end: 386 },
  { gen: 4, label: 'Sinnoh', start: 387, end: 493 },
  { gen: 5, label: 'Unova', start: 494, end: 649 },
  { gen: 6, label: 'Kalos', start: 650, end: 721 },
  { gen: 7, label: 'Alola', start: 722, end: 809 },
  { gen: 8, label: 'Galar', start: 810, end: 905 },
  { gen: 9, label: 'Paldea', start: 906, end: 1025 },
]
