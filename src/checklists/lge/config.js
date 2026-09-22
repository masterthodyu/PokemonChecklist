import data from './data.json'
export default {
  id: 'lge',
  title: "Pokémon Let's Go Eevee ",
  path: '/lge',
  icon: 'icons/letsgoeevee.png',
  backgroundImage: 'backgrounds/Pikachu_Eevee_wallpaper_1920x1080.jpg',
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'lge-caught-v1',
  syncId: 'lge',
  groupSets: [],
}