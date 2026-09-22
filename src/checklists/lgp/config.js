import data from './data.json'
export default {
  id: 'lgp',
  title: "Pokémon Let's Go Pikachu ",
  path: '/lgp',
  icon: 'icons/letsgopika.png',
  backgroundImage: 'backgrounds/Pikachu_Eevee_wallpaper_1920x1080.jpg',
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'lgp-caught-v1',
  syncId: 'lgp',
  groupSets: [],
}