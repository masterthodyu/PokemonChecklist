function PokemonCard({ pokemon, caught, onToggle, highlighted = false }) {
  const dexNumber = pokemon.dexId ?? pokemon.id
  const spriteUrl = pokemon.spriteUrl
  return (
    <div className={`card ${caught ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`} onClick={onToggle}>
      <img
        src={spriteUrl}
        alt={pokemon.name}
        loading="lazy"
        onError={e => { e.target.style.visibility = 'hidden' }}
      />
      <div className="card-info">
        <span className="dex-number">#{String(dexNumber).padStart(3, '0')}</span>
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
