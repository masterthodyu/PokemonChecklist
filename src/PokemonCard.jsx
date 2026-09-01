function PokemonCard({ pokemon, caught, onToggle, highlighted = false }) {
  const spriteSlug = pokemon.sprite ?? String(pokemon.dexid ?? pokemon.id)
  const spriteUrl = `https://img.pokemondb.net/sprites/home/normal/${spriteSlug}.png`

  return (
    <div className={`card ${caught ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`} onClick={onToggle}>
      <img
        src={spriteUrl}
        alt={pokemon.name}
        loading="lazy"
        onError={e => { e.target.style.visibility = 'hidden' }}
      />
      <div className="card-info">
        <span className="dex-number">#{String(pokemon.dexid ?? pokemon.id).padStart(3, '0')}</span>
        <span className="name">{pokemon.name}</span>
      </div>
      <input
        type="checkbox"
        checked={caught}
        onChange={onToggle}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

export default PokemonCard