// Turns "Charizard (Gigantamax)" into "Charizard", and
// "Bulbasaur (Gigantamax Factor) (Gift)" into "Bulbasaur (Gift)" — the
// little G-Max badge (below) shows the Gigantamax part instead of having
// it spelled out in the name every time.
// (This is a Pokémon-specific quirk, kept here since it only ever fires
// for items tagged category "gmax" — it's a harmless no-op for any other
// checklist's items.)
function stripGigantamaxText(name) {
  return name
    .replace(/Gigantamax Factor/g, '')
    .replace(/Gigantamax/g, '')
    .replace(/\(\s*\)/g, '')   // clean up any now-empty "()"
    .replace(/\(\s+/g, '(')    // trim stray space right after "("
    .replace(/\s+\)/g, ')')    // trim stray space right before ")"
    .replace(/\s{2,}/g, ' ')   // collapse doubled-up spaces
    .trim()
}

// One clickable tile for a single checklist item: picture, number, name,
// and a checkbox. Clicking anywhere on the card toggles it checked/not
// checked (the checkbox itself does the same thing, it's just there so
// the checked state is easy to see at a glance).
function ItemCard({ item, checked, onToggle, highlighted = false }) {
  const number = item.dexId ?? item.id
  const isGigantamax = item.category === 'gmax'
  const displayName = isGigantamax ? stripGigantamaxText(item.name) : item.name

  return (
    <div
      className={`card ${checked ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={onToggle}
    >
      <div className="card-image">
        <img
          src={item.spriteUrl}
          alt={item.name}
          loading="lazy"
          onError={e => {
            // If the image link is broken, just hide the broken-image icon
            // instead of showing an ugly placeholder.
            e.target.style.visibility = 'hidden'
          }}
        />
        {isGigantamax && (
          <span className="gmax-badge" title="Gigantamax">

          </span>
        )}
      </div>
      <div className="card-info">
        <span className="dex-number">#{String(number).padStart(3, '0')}</span>
        <span className="name">{displayName}</span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        onClick={e => e.stopPropagation()} // stops the click from also firing the card's onClick above
      />
    </div>
  )
}

export default ItemCard