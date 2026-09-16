// Sidebar groups for the Colosseum checklist, in display order. `key` must
// match the `category` value on each entry in data.json.
//
// Unlike the Home checklist's categories.js, there's no 'base' catch-all
// here — every single Colosseum entry belongs to exactly one of these three,
// so the sidebar totals always add up to the full list length.
export const CATEGORIES = [
  { key: 'shadow', label: 'Shadow Pokémon' },
  { key: 'starter', label: "Wes's Starters" },
  { key: 'bonus', label: 'Mt. Battle Reward' },
]