// Covers the per-card behaviors the README's "What it does" section
// promises: the Gigantamax and Alpha name-stripping + badges, the Shadow
// badge, the optional hover tooltip, the checked-date label, that
// clicking the card (or its checkbox) fires onToggle exactly once — not
// zero, not twice — and that every card's displayed name carries a
// title attribute with the full text (styles.css clamps it to 2 lines).

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ItemCard from './ItemCard.jsx'

const stylesPath = fileURLToPath(new URL('../styles.css', import.meta.url))

const baseItem = {
  id: 1,
  dexId: 1,
  name: 'Bulbasaur',
  spriteUrl: 'bulbasaur.png',
  category: 'base',
}

describe('ItemCard - Gigantamax detection', () => {
  it('strips "(Gigantamax)" from the displayed name when category is "gmax"', () => {
    const item = { ...baseItem, name: 'Venusaur (Gigantamax)', category: 'gmax' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Venusaur')).toBeInTheDocument()
    expect(screen.queryByText(/Gigantamax/)).not.toBeInTheDocument()
  })

  it('handles the longer "(Gigantamax Factor) (Gift)" phrasing, keeping the "(Gift)" part', () => {
    const item = { ...baseItem, name: 'Bulbasaur (Gigantamax Factor) (Gift)', category: 'gmax' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Bulbasaur (Gift)')).toBeInTheDocument()
  })

  it('still detects Gigantamax via the name even without a "gmax" category (the fallback)', () => {
    const item = { ...baseItem, name: 'Charizard (Gigantamax)', category: undefined }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.gmax-badge')).not.toBeNull()
    expect(screen.getByText('Charizard')).toBeInTheDocument()
  })

  it('does NOT fall back to the name check when an explicit, different category is set', () => {
    // Regression test: this used to be `category === 'gmax' ||
    // name.includes(...)`, which meant an explicit non-gmax category
    // never actually suppressed the name fallback — it only ever added
    // to it. A checklist that bothers to tag category at all should be
    // trusted completely.
    const item = { ...baseItem, name: 'Some Gigantamax-Named Thing', category: 'fusion' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.gmax-badge')).toBeNull()
  })

  it('shows no badge and no text-stripping for an ordinary item', () => {
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.gmax-badge')).toBeNull()
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
  })
})

describe('ItemCard - Alpha detection', () => {
  it('strips "(Alpha)" from the displayed name when category is "alpha"', () => {
    const item = { ...baseItem, name: 'Hisuian Decidueye (Alpha)', category: 'alpha' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Hisuian Decidueye')).toBeInTheDocument()
    expect(container.querySelector('.alpha-badge')).not.toBeNull()
  })

  it('keeps the rest of a two-part name, e.g. the gender symbol', () => {
    const item = { ...baseItem, name: 'Staraptor ♀ (Alpha)', category: 'alpha' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Staraptor ♀')).toBeInTheDocument()
  })

  it('still detects an alpha via the name even without an "alpha" category (the fallback)', () => {
    const item = { ...baseItem, name: 'Kleavor (Alpha)', category: undefined }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.alpha-badge')).not.toBeNull()
    expect(screen.getByText('Kleavor')).toBeInTheDocument()
  })

  it('does NOT fall back to the name check when an explicit, different category is set', () => {
    const item = { ...baseItem, name: 'Something (Alpha)-Named', category: 'fusion' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.alpha-badge')).toBeNull()
  })

  it('shows only the alpha badge (not gmax) for an alpha-only item', () => {
    const item = { ...baseItem, name: 'Kleavor (Alpha)', category: 'alpha' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.gmax-badge')).toBeNull()
    expect(container.querySelector('.alpha-badge')).not.toBeNull()
  })

  it('shows no alpha badge for an ordinary item', () => {
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.alpha-badge')).toBeNull()
  })
})

describe('ItemCard - Shadow detection', () => {
  it('sets data-shadow="true" when category is "shadow"', () => {
    const item = { ...baseItem, name: 'Raticate', category: 'shadow' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card').getAttribute('data-shadow')).toBe('true')
  })

  it('falls back to a name check ("Shadow" in the name) when category is unset', () => {
    const item = { ...baseItem, name: 'Shadow Raticate (Party Hat)', category: undefined }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card').getAttribute('data-shadow')).toBe('true')
  })

  it('does NOT set data-shadow when an explicit, different category is set — even with "Shadow" right in the name', () => {
    // This is the exact real bug: Calyrex (Shadow Rider) is not a Shadow
    // Pokémon, it's a fusion form that happens to have "Shadow" in its
    // own name. Before this fix, the OR-based check meant tagging it
    // with any other category never actually suppressed the name match.
    const item = { ...baseItem, name: 'Calyrex (Shadow Rider)', category: 'fusion' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card').hasAttribute('data-shadow')).toBe(false)
  })

  it('does not set data-shadow on an ordinary item', () => {
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card').hasAttribute('data-shadow')).toBe(false)
  })
})

describe('ItemCard - hover tooltip', () => {
  it('renders the tooltip text when item.note is set', () => {
    const item = { ...baseItem, note: 'Catch in Red/Blue/Yellow' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Catch in Red/Blue/Yellow')
  })

  it('renders nothing tooltip-related when item.note is not set (most items today)', () => {
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card-tooltip')).toBeNull()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders nothing when item.note is an empty string, same as unset', () => {
    const item = { ...baseItem, note: '' }
    const { container } = render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(container.querySelector('.card-tooltip')).toBeNull()
  })

  it('keeps the tooltip outside .card-content, whether or not the item is caught', () => {
    // .card:not(.caught) dims the whole .card-content shell — sprite,
    // name, checkbox, background, border — to opacity 0.6 (see
    // styles.css), so an unobtained Pokémon's card reads as "not yet
    // caught." The tooltip is deliberately NOT inside .card-content (it's
    // a sibling, both children of .card): opacity applies to an
    // element's whole rendered subtree, so nesting the tooltip inside the
    // dimmed wrapper would fade it too, no matter what opacity the
    // tooltip set on itself. jsdom doesn't apply the actual stylesheet,
    // so this checks the DOM structure that dimming rule depends on
    // rather than a computed opacity value.
    const item = { ...baseItem, note: 'Catch in Red/Blue/Yellow' }
    for (const checked of [false, true]) {
      const { container } = render(<ItemCard item={item} checked={checked} onToggle={() => {}} />)
      const tooltip = container.querySelector('.card-tooltip')
      expect(tooltip.closest('.card-content')).toBeNull()
      expect(tooltip.parentElement).toBe(container.querySelector('.card'))
    }
  })

  it('puts the sprite, name, and checkbox inside .card-content, so they DO fade together', () => {
    // The flip side of the test above: .card-image/.card-info/the
    // checkbox are supposed to dim as a unit when uncaught, so unlike the
    // tooltip they need to actually be inside .card-content.
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
    const content = container.querySelector('.card-content')
    expect(content.querySelector('.card-image')).not.toBeNull()
    expect(content.querySelector('.card-info')).not.toBeNull()
    expect(content.querySelector('input[type="checkbox"]')).not.toBeNull()
  })
})

describe('ItemCard - checked date', () => {
  it('shows a formatted date label when checked with a known date', () => {
    const isoDate = '2026-09-13T14:22:01.000Z'
    render(<ItemCard item={baseItem} checked={true} checkedDate={isoDate} onToggle={() => {}} />)
    // Computed the same way the component computes it, so this doesn't
    // hardcode a locale-specific string that could differ across machines.
    const expectedLabel = new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })

  it('shows no date label when unchecked, even if a date happens to be passed in', () => {
    const { container } = render(
      <ItemCard item={baseItem} checked={false} checkedDate="2026-09-13T14:22:01.000Z" onToggle={() => {}} />
    )
    expect(container.querySelector('.checked-date')).toBeNull()
  })

  it('shows no date label when checked but the date is unknown (pre-feature legacy data)', () => {
    const { container } = render(<ItemCard item={baseItem} checked={true} checkedDate={null} onToggle={() => {}} />)
    expect(container.querySelector('.checked-date')).toBeNull()
  })
})

describe('ItemCard - clicking', () => {
  it('calls onToggle exactly once when the card itself is clicked', () => {
    const onToggle = vi.fn()
    const { container } = render(<ItemCard item={baseItem} checked={false} onToggle={onToggle} />)
    container.querySelector('.card').click()
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle exactly once (not twice) when the checkbox itself is clicked', () => {
    // The checkbox's onClick calls stopPropagation specifically so this
    // doesn't also fire the card's own onClick — this test exists to
    // catch that regressing back to a double-fire.
    const onToggle = vi.fn()
    render(<ItemCard item={baseItem} checked={false} onToggle={onToggle} />)
    screen.getByRole('checkbox').click()
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

describe('ItemCard - number display', () => {
  it('pads the dex number to 3 digits', () => {
    render(<ItemCard item={{ ...baseItem, dexId: 25 }} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('#025')).toBeInTheDocument()
  })

  it('falls back to id when dexId is missing (boxless checklists without a dex number)', () => {
    const item = { id: 7, name: 'Some GO Costume', spriteUrl: 'x.png' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('#007')).toBeInTheDocument()
  })
})

describe('ItemCard - name shrink-to-fit', () => {
  // jsdom doesn't actually lay text out, so scrollHeight/clientHeight are
  // both 0 by default — these tests fake real layout numbers on
  // HTMLElement.prototype so shrinkNameToFit's overflow check has
  // something real to react to, then restore the originals afterward so
  // other tests in this file aren't affected.
  function mockLayout({ scrollHeight, clientHeight }) {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight })
    return () => {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
    }
  }

  it('leaves the font size untouched when the name already fits its 2-line box', () => {
    const restore = mockLayout({ scrollHeight: 24, clientHeight: 24 })
    try {
      render(<ItemCard item={baseItem} checked={false} onToggle={() => {}} />)
      expect(screen.getByText('Bulbasaur').style.fontSize).toBe('')
    } finally {
      restore()
    }
  })

  it('shrinks the font size, step by step, when the name overflows — down to the size floor if it never stops overflowing', () => {
    // A constant "still overflowing" reading regardless of font size
    // means the loop runs until it hits MIN_NAME_SCALE (0.62) rather
    // than converging early — this pins down that exact floor value so
    // a name never shrinks all the way to unreadable.
    const restore = mockLayout({ scrollHeight: 999, clientHeight: 24 })
    try {
      const item = { ...baseItem, name: 'Gimmighoul (Roaming Form) (10th Anniversary Coin)' }
      render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
      expect(screen.getByText(item.name).style.fontSize).toBe('0.62em')
    } finally {
      restore()
    }
  })

  it("keeps .name's box height in a unit independent of its own font-size", () => {
    // Regression guard for a real bug: .name's box height was declared
    // in `em`, which resolves against the element's OWN font-size — the
    // same element shrinkNameToFit() sets an inline font-size on. That
    // meant a shrunk (long-name) card's "fixed" box shrank right along
    // with its font, so it came out visibly shorter than a card next to
    // it that never needed shrinking — the opposite of a fixed box.
    // jsdom doesn't apply the real stylesheet (see the tooltip-fade
    // tests above), so this reads styles.css as text rather than
    // asserting on a computed style.
    const css = readFileSync(stylesPath, 'utf8')
    const nameRule = css.match(/\.name\s*\{[^}]*\}/)?.[0]
    expect(nameRule, '.name rule not found in styles.css').toBeTruthy()
    expect(nameRule).not.toMatch(/(?:min|max)-height:\s*[\d.]+em/)
    expect(nameRule).toMatch(/(?:min|max)-height:\s*[\d.]+rem/)
  })
})

describe('ItemCard - name tooltip (full name stays readable when the card face clamps it)', () => {
  it('sets the native title attribute to the full displayed name', () => {
    // styles.css clamps .name to 2 lines so every card is the same
    // height regardless of checklist — GO's long costume names are
    // exactly the case that used to break that. title is what keeps
    // the full name reachable, just a hover/long-press away instead of
    // spelled out on the card.
    const item = { ...baseItem, name: 'Pikachu (World Championships 2025)' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Pikachu (World Championships 2025)')).toHaveAttribute(
      'title',
      'Pikachu (World Championships 2025)'
    )
  })

  it('uses the stripped display name, not the raw item.name, for a Gigantamax entry', () => {
    const item = { ...baseItem, name: 'Bulbasaur (Gigantamax Factor) (Gift)', category: 'gmax' }
    render(<ItemCard item={item} checked={false} onToggle={() => {}} />)
    expect(screen.getByText('Bulbasaur (Gift)')).toHaveAttribute('title', 'Bulbasaur (Gift)')
  })
})