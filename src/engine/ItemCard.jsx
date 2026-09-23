import { useLayoutEffect, useRef } from 'react'

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

// "09/13/25" — always this exact MM/DD/YY shape, deliberately not
// toLocaleDateString(), which would show DD/MM/YY instead for a visitor
// whose browser is set to a non-US locale. Short enough for a card
// corner either way. Null if there's nothing to show (unchecked, or
// checked before dates were tracked).
function formatCheckedDate(isoDate) {
  if (!isoDate) return null
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

// "Hisuian Decidueye (Alpha)" -> "Hisuian Decidueye" — the alpha badge
// (below) says it, so 300-odd cards don't all need to spell it out too.
function stripAlphaText(name) {
  return name
    .replace(/\(Alpha\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// A checklist that has bothered to set `category` on an item at all is
// being explicit, and that should be trusted completely — an item
// deliberately tagged e.g. category: 'fusion' must never ALSO match a
// name-based guess for something unrelated, even if its name happens to
// contain a matching word. (Calyrex (Shadow Rider) is not a Shadow
// Pokémon — it just has "Shadow" in its own name.) The name check only
// ever kicks in as a fallback for a checklist that hasn't tagged
// category on this item at all — GO's own unrelated "Shadow [Pokémon]
// (costume)" reskins are exactly that case, and it's genuinely fine for
// them to fall back to it (see src/checklists/Shadow.test.jsx) — the
// difference is those entries have no category set, Calyrex does.
function matchesBadge(item, categoryValue, nameNeedle) {
  return item.category ? item.category === categoryValue : item.name.includes(nameNeedle)
}

// How far the name is allowed to shrink before we give up and let the
// CSS line-clamp ellipsize it instead (see .name in styles.css). 0.62
// is roughly the point where a name is still legible but any smaller
// starts to feel like squinting — past that, a couple of extreme GO
// entries (the 48-character Gimmighoul ones) are better off just
// truncated than shrunk to the size of fine print.
const MIN_NAME_SCALE = 0.62
const NAME_SHRINK_STEP = 0.04

// Shrinks `el`'s font size, in small steps, until its text no longer
// overflows the 2-line box .name is clamped to in CSS — or until it
// hits MIN_NAME_SCALE, whichever comes first. Comparing scrollHeight
// (the content's real, unclamped height) to clientHeight (the fixed
// 2-line box height) is the standard way to detect -webkit-line-clamp
// truncation; it stays 0-vs-0 in test environments that don't lay text
// out, so this is a safe no-op there.
function shrinkNameToFit(el) {
  if (!el) return
  el.style.fontSize = '' // reset first — same DOM node can be reused for a different name
  let scale = 1
  while (el.scrollHeight > el.clientHeight + 1 && scale > MIN_NAME_SCALE) {
    scale = Math.max(MIN_NAME_SCALE, scale - NAME_SHRINK_STEP)
    el.style.fontSize = `${scale}em`
  }
}

// One clickable tile: picture, number, name, checkbox. Clicking anywhere
// on the card toggles it.
function ItemCard({ item, checked, checkedDate, onToggle, highlighted = false }) {
  const number = item.dexId ?? item.id
  const isGigantamax = matchesBadge(item, 'gmax', 'Gigantamax')
  const displayNameBase = isGigantamax ? stripGigantamaxText(item.name) : item.name
  const dateLabel = checked ? formatCheckedDate(checkedDate) : null
  const isShadow = matchesBadge(item, 'shadow', 'Shadow')
  // Shares the same badge corner as Shadow/Gigantamax above (see
  // styles.css) rather than getting its own spot — a Pokémon is never
  // more than one of Shadow/Gigantamax/Alpha at once, so there's
  // nothing to collide with.
  const isAlpha = matchesBadge(item, 'alpha', '(Alpha)')
  const displayName = isAlpha ? stripAlphaText(displayNameBase) : displayNameBase

  const nameRef = useRef(null)
  // Runs before paint, so a long name never flashes at full size before
  // shrinking — and re-runs if displayName itself changes (it normally
  // won't for a given card's lifetime; checking/unchecking doesn't).
  useLayoutEffect(() => {
    shrinkNameToFit(nameRef.current)
  }, [displayName])

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
        //
        // Lives outside .card-content on purpose (a sibling, not a
        // child) — .card-content is what fades when the item isn't
        // caught, and a child can't opt back out of a parent's opacity.
        // Keeping the tooltip out of that subtree is what lets the hint
        // text stay fully readable while everything inside
        // .card-content — sprite, name, checkbox — dims normally.
        <span className="card-tooltip" role="tooltip">{item.note}</span>
      )}
      <div className="card-content">
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
          {/* `title` gives the full name on hover/long-press as a backup —
              shrinkNameToFit handles almost every case by scaling the
              font down, but a name that's still too long even at the
              size floor falls back to the CSS line-clamp ellipsis, and
              this is how that name stays reachable. */}
          <span className="name" ref={nameRef} title={displayName}>{displayName}</span>
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
    </div>
  )
}

export default ItemCard