import data from './data.json'
export default {
  id: 'colosseum',
  title: 'Pokémon Colosseum',
  path: '/colosseum',
  icon: 'icons/colosseum.png',
  backgroundImage: 'backgrounds/Colosseum.jpg',
  accentFrom: '#c8a25b',
  accentTo: '#604e82',
  // Each entry's `category` (shadow/starter/bonus) still exists and still
  // matters — it's what drives the Shadow badge on every Shadow Pokémon
  // card (see ItemCard.jsx's isShadow check) — it's just no longer also
  // used to build a sidebar to browse by. groupSets: [] (not omitted —
  // ChecklistPage.jsx reads it unconditionally) is what every other
  // sidebar-less checklist (GO, SV, ...) already uses for "no sidebar."
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'colosseum-caught-v1',
  syncId: 'colosseum',
  groupSets: [],
}