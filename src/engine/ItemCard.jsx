// "Charizard (Gigantamax)" -> "Charizard". "Bulbasaur (Gigantamax
// Factor) (Gift)" -> "Bulbasaur (Gift)" — the badge shows the Gigantamax
// part instead of spelling it out in the name.
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

// "Sep 13" — short enough for a card corner. Null if there's nothing to
// show (unchecked, or checked before dates were tracked).
function formatCheckedDate(isoDate) {
  if (!isoDate) return null
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// One clickable tile: picture, number, name, checkbox. Clicking anywhere
// on the card toggles it.
function ItemCard({ item, checked, checkedDate, onToggle, highlighted = false }) {
  const number = item.dexId ?? item.id
  const isGigantamax = item.category === 'gmax' || item.name.includes('Gigantamax')
  const displayName = isGigantamax ? stripGigantamaxText(item.name) : item.name
  const dateLabel = checked ? formatCheckedDate(checkedDate) : null
  // Category is the real tag (Colosseum/XD's Shadow Pokémon); the name
  // check is a fallback for anything not tagged yet. GO's own unrelated
  // "Shadow [Pokémon] (costume)" reskins happen to match this fallback
  // too — see src/checklists/Shadow.test.jsx, that's documented as
  // expected, not a bug.
  const isShadow = item.category === 'shadow' || item.name.includes('Shadow')

  return (
    <div
      className={`card ${checked ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`}
      data-shadow={isShadow || undefined}
      onClick={onToggle}
    >
      <div className="card-image">
        <img
          src={item.spriteUrl.startsWith('http') ? item.spriteUrl : `${import.meta.env.BASE_URL}${item.spriteUrl}`}
          alt={item.name}
          loading="lazy"
          onError={e => {
            // If the image link is broken, just hide the broken-image icon
            // instead of showing an ugly placeholder.
            e.target.style.visibility = 'hidden'
          }}
        />
        {isGigantamax && (
          <span className="gmax-badge" title="Gigantamax" />
        )}
      </div>
      <div className="card-info">
        <span className="dex-number">#{String(number).padStart(3, '0')}</span>
        <span className="name">{displayName}</span>
      </div>
      {dateLabel && (
        <span className="checked-date" title={new Date(checkedDate).toLocaleString()}>
          {dateLabel}
        </span>
      )}
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