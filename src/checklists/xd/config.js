import data from './data.json'

// Pokémon XD: Gale of Darkness. data.json is built from Bulbapedia's
// "List of Shadow Pokémon" article, in that article's own row order (which
// is roughly story order — Teddiursa at the HQ Lab first, Dragonite from
// Miror B. last), not dex order:
//   https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pokémon
//
// All 83 entries are Shadow Pokémon, which is the whole point of the game,
// so unlike the Colosseum list there are no 'starter'/'bonus' extras and no
// Category sidebar — a sidebar with one group in it would just be a second
// copy of the header's progress bar. If you later add XD's non-Shadow
// exclusives (the Eevee you start with, the Mt. Battle Johto starter
// reward), copy the colluseum/ folder's categories.js + groupSets shape.
//
// Entry 76 is Shadow Lugia, the one Pokémon whose appearance actually
// changes when it's turned Shadow — hence the name and the 249S sprite,
// rather than a plain Lugia.
export default {
  id: 'xd',
  title: 'Pokémon XD: Gale of Darkness',
  path: '/xd',
  // Shadow Lugia's own menu sprite — the game's box-art mascot. Same
  // stand-in caveat as the Colosseum icon: correct-by-construction rather
  // than a token-bearing hotlink. Swap for a real logo in public/icons/
  // when you have one.
  icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlpGg_gO9qiJ5jXM9B1yq9vsVb4nJ0fwEKw2ZCnon0gA&s',
  // Shadow Lugia's pale blue-white into Shadow purple.
  accentFrom: '#cfdced',
  accentTo: '#604e82',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'xd-caught-v1',
  syncId: 'xd',
  groupSets: [],
}