// Runs against the all data.json and config.js files, not fixtures
// catches data problems (duplicate ids, missing fields, bad categories) before manual testing
// describe.each(CHECKLISTS) means a new checklist is covered automatically, no edits needed here.

import { describe, expect, it } from 'vitest'
import { CHECKLISTS } from './index.js'
import homeConfig from './home/config.js'
import { CATEGORIES } from './home/categories.js'
import { GENERATIONS } from './home/generations.js'

// Highest real National Dex number as of Gen 9. A dexId above this is
// almost always a typo — bump this one line if a Gen 10 ever lands.
const MAX_NATIONAL_DEX = 1025

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

  // ChecklistPage divides by data.length for a percentage, and
  // Math.max(...[]) is -Infinity — an empty data.json breaks two things
  // at once, so this fails loudly rather than quietly.
  it('gives every checklist at least one entry', () => {
    for (const config of CHECKLISTS) {
      expect(config.data.length, `${config.id} has an empty data.json`).toBeGreaterThan(0)
    }
  })
})

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

  // note is optional — this only guards against it being set to
  // something wrong (empty string, a number) rather than just left out.
  it('gives every item with a note a real, non-empty string', () => {
    const bad = config.data
      .filter(item => 'note' in item)
      .filter(item => typeof item.note !== 'string' || item.note.trim() === '')
      .map(item => `${item.name} -> ${JSON.stringify(item.note)}`)
    expect(bad).toEqual([])
  })

  // ItemCard's onError hides broken images rather than showing them, so
  // a malformed spriteUrl fails silently in the app. This is the test
  // that catches it instead.
  it('gives every item a spriteUrl that is either a local sprites/ path or a full URL', () => {
    const bad = config.data
      .filter(item => !/^sprites\//.test(item.spriteUrl) && !/^https?:\/\//.test(item.spriteUrl))
      .map(item => `${item.name} -> "${item.spriteUrl}"`)
    expect(bad).toEqual([])
  })

  // Skipped for checklists that opt in via allowDuplicateNames (see
  // masterdex/config.js) — some lists legitimately have two entries with
  // the same name, told apart by note instead. Id-uniqueness above still
  // applies to everyone.
  it.skipIf(config.allowDuplicateNames)('has no two items sharing the same name', () => {
    const counts = new Map()
    for (const item of config.data) {
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([name, n]) => `${name} x${n}`)
    expect(duplicates).toEqual([])
  })

  // dexId is optional, but when set it has to be real — catches an
  // off-by-one like Ledyba's 165 being used for Ledian (actually 166).
  it('gives every item with a dexId a plausible National Dex number', () => {
    const bad = config.data
      .filter(item => item.dexId != null)
      .filter(item => !Number.isInteger(item.dexId) || item.dexId < 1 || item.dexId > MAX_NATIONAL_DEX)
      .map(item => `${item.name} -> ${item.dexId}`)
    expect(bad).toEqual([])
  })

  if (config.boxSize) {
    it('gives every item a boxId of at least 1 (boxed checklist)', () => {
      for (const item of config.data) {
        expect(item.boxId, `id=${item.id}`).toBeGreaterThanOrEqual(1)
      }
    })

    // The grid is a fixed 6x5 layout — a box past boxSize overflows it.
    // Colosseum's first draft put all 48 entries in box 1.
    it('never puts more than boxSize items in a single box', () => {
      const counts = new Map()
      for (const item of config.data) {
        counts.set(item.boxId, (counts.get(item.boxId) ?? 0) + 1)
      }
      const overfull = [...counts]
        .filter(([, n]) => n > config.boxSize)
        .map(([boxId, n]) => `box ${boxId} holds ${n} (max ${config.boxSize})`)
      expect(overfull).toEqual([])
    })

    // "Jump to box" is bounded by the highest boxId — a gap (1, 2, 4)
    // gives you a reachable box that renders an empty, unexplained grid.
    it('uses a contiguous run of box numbers starting at 1', () => {
      const used = [...new Set(config.data.map(item => item.boxId))].sort((a, b) => a - b)
      const expected = Array.from({ length: used.length }, (_, i) => i + 1)
      expect(used).toEqual(expected)
    })
  } else {
    it('has no leftover boxId values (boxless checklist)', () => {
      const stray = config.data.filter(item => item.boxId != null).map(item => item.name)
      expect(stray).toEqual([])
    })
  }

  // A group whose matches() never fires renders as a permanently 0/0
  // sidebar row — looks like a page bug, is actually a config mistake.
  it('has no sidebar group that matches zero items', () => {
    const empty = []
    for (const set of config.groupSets) {
      const candidates = config.data.filter(set.filter)
      for (const g of set.groups) {
        if (!candidates.some(item => set.matches(item, g))) {
          empty.push(`${set.label} -> ${set.displayLabel(g)}`)
        }
      }
    }
    expect(empty).toEqual([])
  })
})

describe('home checklist category tagging', () => {
  // CATEGORIES lists the "extra" sidebar categories beyond base forms —
  // assignCategories.mjs also tags plain base forms as 'base', which has
  // no matching sidebar group on purpose. Allowed here too.
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