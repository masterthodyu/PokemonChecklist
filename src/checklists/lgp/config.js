import data from './data.json'
export default {
  id: 'lgp',
  title: "Pokémon Let's Go Pikachu ",
  path: '/lgp',
  icon: 'https://assets.nintendo.eu/image/upload/f_auto,c_limit,w_992,q_auto:low/MNS/NOE/70010000000446/SQ_NSwitch_PokemonLetsGoPikachu_enGB',
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'lgp-caught-v1',
  syncId: 'lgp',
  groupSets: [],
}