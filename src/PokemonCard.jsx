// One clickable tile for a single Pokémon: picture, dex number, name,
// and a checkbox. Clicking anywhere on the card toggles it caught/not
// caught (the checkbox itself does the same thing, it's just there so
// the caught state is easy to see at a glance).
function PokemonCard({ pokemon, caught, onToggle, highlighted = false }) {
  const dexNumber = pokemon.dexId ?? pokemon.id

  return (
    <div
      className={`card ${caught ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={onToggle}
    >
      <img
        src={pokemon.spriteUrl}
        alt={pokemon.name}
        loading="lazy"
        onError={e => {
          // If the sprite image link is broken, just hide the broken-image
          // icon instead of showing an ugly placeholder.
          e.target.style.visibility = 'hidden'
        }}
      />
      <div className="card-info">
        <span className="dex-number">#{String(dexNumber).padStart(3, '0')}</span>
        <span className="name">{pokemon.name}</span>
      </div>
      <input
        type="checkbox"
        checked={caught}
        onChange={onToggle}
        onClick={e => e.stopPropagation()} // stops the click from also firing the card's onClick above
      />
    </div>
  )
}

export default PokemonCard