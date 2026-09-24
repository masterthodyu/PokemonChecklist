// These tests read the real data.json/config.js files that ship with the
// app (not fixtures) — the goal is to catch data problems automatically
// (duplicate ids, missing fields, bad category tags) instead of relying
// on someone noticing during a manual review, which is how the GO
// duplicate-id issue in "Known issues" sat around for a while.
//
// Everything in the `describe.each(CHECKLISTS)` block below is generated
// from the registry, so adding a checklist to src/checklists/index.js
// gets it covered here automatically with no edits to this file.

import { describe, expect, it } from 'vitest'
import { CHECKLISTS } from './index.js'
import homeConfig from './home/config.js'
import { CATEGORIES } from './home/categories.js'
import { GENERATIONS } from './home/generations.js'

// The highest real National Dex number as of Gen 9 (Pecharunt). A dexId
// above this is almost always a typo rather than a new Pokémon — and if a
// Gen 10 ever does land, this one line is the only thing to bump.
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

  // ChecklistPage divides by data.length to show a percentage, and
  // Math.max(...[]) is -Infinity — an empty data.json breaks the page in
  // two different ways at once, so it's worth failing loudly here.
  it('gives every checklist at least one entry', () => {
    for (const config of CHECKLISTS) {
      expect(config.data.length, `${config.id} has an empty data.json`).toBeGreaterThan(0)
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

  // note is optional (almost nothing has one yet) — this only guards
  // against it being set to something silently wrong, like an empty
  // string or a number, rather than just left out.
  it('gives every item with a note a real, non-empty string', () => {
    const bad = config.data
      .filter(item => 'note' in item)
      .filter(item => typeof item.note !== 'string' || item.note.trim() === '')
      .map(item => `${item.name} -> ${JSON.stringify(item.note)}`)
    expect(bad).toEqual([])
  })

  // Every spriteUrl is either a local file under public/sprites/ (after
  // scripts/use-local-sprites.mjs has run) or a full http(s) hotlink.
  // Anything else — a bare filename, a "www." with no scheme, a stray
  // space — renders as a silently broken image, since ItemCard's onError
  // handler deliberately hides broken images rather than showing them.
  it('gives every item a spriteUrl that is either a local sprites/ path or a full URL', () => {
    const bad = config.data
      .filter(item => !/^sprites\//.test(item.spriteUrl) && !/^https?:\/\//.test(item.spriteUrl))
      .map(item => `${item.name} -> "${item.spriteUrl}"`)
    expect(bad).toEqual([])
  })

  // Skipped for checklists that opt in via allowDuplicateNames (see
  // masterdex/config.js) — some lists legitimately have two entries with
  // the same plain name, distinguished by their note field instead. The
  // id-uniqueness check above still applies to everyone, no exceptions.
  it.skipIf(config.allowDuplicateNames)('has no two items sharing the same name', () => {
    const counts = new Map()
    for (const item of config.data) {
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([name, n]) => `${name} x${n}`)
    expect(duplicates).toEqual([])
  })

  // dexId is optional (GO's costume entries don't all have one), but when
  // it IS set it has to be a real National Dex number. This is the check
  // that catches an off-by-one typo like Ledyba's 165 being used for
  // Ledian, which is genuinely 166.
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

    // The grid is a fixed 6x5 CSS layout — a box holding more than
    // boxSize entries overflows it. This is exactly what the Colosseum
    // list did when it first landed: all 48 entries sat in box 1.
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

    // ChecklistPage's "jump to box" input is bounded by the HIGHEST boxId,
    // so a gap in the sequence (boxes 1, 2, 4) gives you a reachable box
    // that renders an empty grid with no explanation.
    it('uses a contiguous run of box numbers starting at 1', () => {
      const used = [...new Set(config.data.map(item => item.boxId))].sort((a, b) => a - b)
      const expected = Array.from({ length: used.length }, (_, i) => i + 1)
      expect(used).toEqual(expected)
    })
  } else {
    // A boxless checklist (GO) skips box navigation entirely. A stray
    // boxId in its data.json is dead weight that reads as if the box
    // system applies when it doesn't.
    it('has no leftover boxId values (boxless checklist)', () => {
      const stray = config.data.filter(item => item.boxId != null).map(item => item.name)
      expect(stray).toEqual([])
    })
  }

  // Every group a sidebar offers should actually match something. A group
  // whose `matches` never fires renders as a permanently-disabled 0/0 row,
  // which looks like a bug in the page rather than a mistake in config.
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