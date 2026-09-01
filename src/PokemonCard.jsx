function PokemonCard({ pokemon, caught, onToggle }) {
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

  return (
    <div className={`card ${caught ? 'caught' : ''}`} onClick={onToggle}>
      <img
        src={spriteUrl}
        alt={pokemon.name}
        loading="lazy"
        onError={e => { e.target.style.visibility = 'hidden' }}
      />
      <div className="card-info">
        <span className="dex-number">#{String(pokemon.id).padStart(3, '0')}</span>
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