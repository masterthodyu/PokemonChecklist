import data from './data.json'
export default {
  id: 'lge',
  title: "Pokémon Let's Go Eevee ",
  path: '/lgp',
  icon: 'https://assets.nintendo.eu/image/upload/f_auto,c_limit,w_992,q_auto:low/MNS/NOE/70010000000449/SQ_NSwitch_PokemonLetsGoEevee_enGB',
  accentFrom: '#c7ccd1',
  accentTo: '#f4c430',
  data, // array of { id, dexId, name, spriteUrl, boxId, category }
  boxSize: 30,
  storageKey: 'lge-caught-v1',
  syncId: 'lge',
  groupSets: [],
}