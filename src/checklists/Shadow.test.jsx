// Data checks specific to "Shadow Pokémon" — the mechanic Colosseum and
// XD are both built around — rather than the generic per-checklist shape
// checks in Registry.test.jsx. Referenced by name in
// ChecklistPage.test.jsx's file header comment as "where the real data
// gets checked" alongside registry.test.js.
//
// This file previously contained a stray, unrelated copy of HubPage.jsx
// (with only its import paths adjusted) instead of any actual tests —
// Vitest picking that up as a test file with zero describe/it blocks is
// what "Shadow.test.jsx failing" meant. Restored here as actual tests.

import { describe, expect, it } from 'vitest'
import colosseumConfig from './colosseum/config.js'
import xdConfig from './xd/config.js'
import homeConfig from './home/config.js'
import goConfig from './go/config.js'
import { CHECKLISTS } from './index.js'

describe('Colosseum (colosseum/) category distribution', () => {
  // config.js's own comment: "54 entries = 51 Shadow Pokémon + Wes's two
  // starters + the Mt. Battle Ho-Oh." If a future data edit throws that
  // off, this is the test that catches it — a miscounted category here
  // means the sidebar's "Shadow Pokémon" total no longer reflects the
  // actual in-game goal.
  it('has exactly 51 shadow, 2 starter, and 1 bonus entries', () => {
    const counts = { shadow: 0, starter: 0, bonus: 0 }
    for (const item of colosseumConfig.data) counts[item.category]++
    expect(counts).toEqual({ shadow: 51, starter: 2, bonus: 1 })
  })

  it("Wes's two starters are Espeon and Umbreon, tagged 'starter' not 'shadow'", () => {
    const starters = colosseumConfig.data.filter(item => item.category === 'starter').map(item => item.name).sort()
    expect(starters).toEqual(['Espeon', 'Umbreon'])
  })
})

describe('XD (xd/) is entirely Shadow Pokémon', () => {
  // config.js: "All 83 entries are Shadow Pokémon, which is the whole
  // point of the game" — unlike Colosseum, nothing here should ever be
  // tagged anything other than 'shadow'.
  it('tags every single entry "shadow"', () => {
    const notShadow = xdConfig.data.filter(item => item.category !== 'shadow').map(item => item.name)
    expect(notShadow).toEqual([])
  })

  // config.js: "Entry 76 is Shadow Lugia, the one Pokémon whose
  // appearance actually changes when it's turned Shadow — hence the name
  // and the 249S sprite, rather than a plain Lugia."
  it('has Shadow Lugia at id 76 with dexId 249 and an "S"-suffixed sprite', () => {
    const entry = xdConfig.data.find(item => item.id === 76)
    expect(entry?.name).toBe('Shadow Lugia')
    expect(entry?.dexId).toBe(249)
    expect(entry?.spriteUrl).toMatch(/249S\.png$/)
  })
})

describe('ItemCard\'s name-based Shadow fallback (see ItemCard.jsx) against real data', () => {
  // ItemCard falls back to checking whether "Shadow" (capital S) appears
  // in an item's name when category isn't set to 'shadow' — see
  // ItemCard.test.jsx for the component-level behavior. This checks it
  // against what's actually in the checklists today.

  // Home's Marshadow is the obvious near-miss: it contains "shadow" as a
  // substring, but lowercase and mid-word ("Mar" + "shadow"). Since the
  // fallback check is case-sensitive, this must NOT match — Marshadow
  // getting Colosseum's purple Shadow-Pokémon glow would be a visual bug,
  // not a cute coincidence.
  it('does not treat Marshadow as a Shadow Pokémon', () => {
    const marshadow = homeConfig.data.find(item => item.name === 'Marshadow')
    expect(marshadow).toBeDefined()
    expect(marshadow.category).not.toBe('shadow')
    expect(marshadow.name.includes('Shadow')).toBe(false)
  })

  // Pokémon GO has its own, unrelated "Shadow [Pokémon] (event)" costume
  // Pokémon (Halloween/holiday reskins with a capital "Shadow" in the
  // name) — nothing to do with the Colosseum/XD Shadow Pokémon mechanic,
  // but they don't have category: 'shadow' set, so ItemCard's name
  // fallback picks them up and gives them the same purple glow too. Not
  // fixed here — it's a plausible, harmless double meaning of "shadow"
  // rather than a clear bug — but pinned to today's known count (9) so a
  // future name that starts with "Shadow ..." changes this test on
  // purpose instead of silently changing what glows purple.
  it('also matches 9 of GO\'s unrelated cosmetic "Shadow" costume Pokémon (documented, not a bug fix)', () => {
    const goShadowNamed = goConfig.data.filter(
      item => item.category !== 'shadow' && item.name.includes('Shadow')
    )
    expect(goShadowNamed).toHaveLength(9)
  })
})

describe('Shadow-capable checklists are wired into the registry', () => {
  it('both colosseum and xd are registered in CHECKLISTS', () => {
    const ids = CHECKLISTS.map(c => c.id)
    expect(ids).toEqual(expect.arrayContaining(['colosseum', 'xd']))
  })
})