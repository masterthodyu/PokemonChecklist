// These tests read the real data.json/config.js files that ship with the
// app (not fixtures) — the goal is to catch data problems automatically
// (duplicate ids, missing fields, bad category tags) instead of relying
// on someone noticing during a manual review, which is how the GO
// duplicate-id issue in "Known issues" sat around for a while.

import { describe, expect, it } from 'vitest'
import { CHECKLISTS } from './index.js'
import homeConfig from './home/config.js'
import { CATEGORIES } from './home/categories.js'
import { GENERATIONS } from './home/generations.js'

describe('checklist registry (src/checklists/index.js)', () => {
  it('gives every checklist a unique id, route path, storage key, and syncId', () => {
    for (const field of ['id', 'path', 'storageKey', 'syncId']) {
      const values = CHECKLISTS.map(c => c[field])
      const unique = new Set(values)
      expect(unique.size, `duplicate "${field}" values: ${values.join(', ')}`).toBe(values.length)
    }
  })

  it('gives every checklist the fields the engine and HubPage assume exist', () => {
    for (const config of CHECKLISTS) {
      expect(config.title, config.id).toBeTruthy()
      expect(config.path, config.id).toMatch(/^\//)
      expect(Array.isArray(config.data), config.id).toBe(true)
      expect(Array.isArray(config.groupSets), config.id).toBe(true)
    }
  })
})

// One block per checklist, generated from the real registry — add a
// checklist to src/checklists/index.js and it's automatically covered
// here too, no test file changes needed.
describe.each(CHECKLISTS)('$id data.json', config => {
  it('has no two items sharing the same id', () => {
    const ids = config.data.map(item => item.id)
    const seen = new Set()
    const duplicates = new Set()
    for (const id of ids) {
      if (seen.has(id)) duplicates.add(id)
      seen.add(id)
    }
    expect([...duplicates]).toEqual([])
  })

  it('gives every item the fields ItemCard.jsx and the search bar rely on', () => {
    for (const item of config.data) {
      const label = `id=${item.id}`
      expect(item.id, label).not.toBeUndefined()
      expect(item.name, label).toBeTruthy()
      expect(item.spriteUrl, label).toBeTruthy()
    }
  })

  if (config.boxSize) {
    it('gives every item a boxId of at least 1 (boxed checklist)', () => {
      for (const item of config.data) {
        expect(item.boxId, `id=${item.id}`).toBeGreaterThanOrEqual(1)
      }
    })
  }
})

describe('home checklist category tagging', () => {
  // CATEGORIES only lists the "extra" sidebar categories beyond base forms
  // (see the comment at the top of categories.js) — assignCategories.mjs
  // also tags every plain base-form entry as 'base', which deliberately
  // has no matching sidebar group (nothing in groupSets' `matches` looks
  // for it). That's intentional, not a typo, so it's allowed here too.
  const validKeys = new Set([...CATEGORIES.map(c => c.key), 'base'])

  it('only uses category keys that are either a real sidebar group or the "base" marker', () => {
    const mistagged = homeConfig.data
      .filter(item => item.category && !validKeys.has(item.category))
      .map(item => `${item.name} -> "${item.category}"`)
    expect(mistagged).toEqual([])
  })
})

describe('home checklist generation ranges', () => {
  it("generation ranges don't overlap each other", () => {
    const sorted = [...GENERATIONS].sort((a, b) => a.start - b.start)
    for (let i = 1; i < sorted.length; i++) {
      expect(
        sorted[i].start,
        `Gen ${sorted[i - 1].gen} (${sorted[i - 1].start}-${sorted[i - 1].end}) overlaps Gen ${sorted[i].gen} (${sorted[i].start}-${sorted[i].end})`
      ).toBeGreaterThan(sorted[i - 1].end)
    }
  })

  it('every base-form Pokémon (id === dexId) falls inside some generation range', () => {
    const baseForms = homeConfig.data.filter(item => item.id === item.dexId)
    const orphaned = baseForms.filter(
      item => !GENERATIONS.some(g => item.dexId >= g.start && item.dexId <= g.end)
    ).map(item => `#${item.dexId} ${item.name}`)
    expect(orphaned).toEqual([])
  })
})