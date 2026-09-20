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

// "Hisuian Decidueye (Alpha)" -> "Hisuian Decidueye" — the alpha badge
// (below) says it, so 300-odd cards don't all need to spell it out too.
function stripAlphaText(name) {
  return name
    .replace(/\(Alpha\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// One clickable tile: picture, number, name, checkbox. Clicking anywhere
// on the card toggles it.
function ItemCard({ item, checked, checkedDate, onToggle, highlighted = false }) {
  const number = item.dexId ?? item.id
  const isGigantamax = item.category === 'gmax' || item.name.includes('Gigantamax')
  const displayNameBase = isGigantamax ? stripGigantamaxText(item.name) : item.name
  const dateLabel = checked ? formatCheckedDate(checkedDate) : null
  // Category is the real tag (Colosseum/XD's Shadow Pokémon); the name
  // check is a fallback for anything not tagged yet. GO's own unrelated
  // "Shadow [Pokémon] (costume)" reskins happen to match this fallback
  // too — see src/checklists/Shadow.test.jsx, that's documented as
  // expected, not a bug.
  const isShadow = item.category === 'shadow' || item.name.includes('Shadow')
  // Same category-first-then-name pattern as Shadow/Gigantamax above.
  // Shares the same badge corner as those two (see styles.css) rather
  // than getting its own spot — a Pokémon is never more than one of
  // Shadow/Gigantamax/Alpha at once, so there's nothing to collide with.
  const isAlpha = item.category === 'alpha' || item.name.includes('(Alpha)')
  const displayName = isAlpha ? stripAlphaText(displayNameBase) : displayNameBase

  return (
    <div
      className={`card ${checked ? 'caught' : ''} ${highlighted ? 'highlighted' : ''}`}
      data-shadow={isShadow || undefined}
      onClick={onToggle}
    >
      {item.note && (
        // Deliberately not the native `title` attribute — browsers put a
        // several-hundred-ms delay before that shows up and it can't be
        // styled at all. This is a real element instead, shown purely
        // via CSS on :hover/:focus-within (see .card-tooltip in
        // styles.css), which is what makes it appear instantly.
        <span className="card-tooltip" role="tooltip">{item.note}</span>
      )}
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
        {isShadow && (
          <span className="shadow-badge" title="Shadow Pokémon" />
        )}
        {isAlpha && (
          <span className="alpha-badge" title="Alpha Pokémon" />
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