// Data checks specific to the two GameCube checklists (Colosseum and XD),
// whose data.json files were both built from one Bulbapedia article:
//   https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pokémon
//
// The generic checks in registry.test.js already cover shape (ids, boxes,
// sprite URL format). What's here instead is the stuff only these two
// lists can be wrong about: the counts the article itself states, and
// whether each Bulbapedia sprite URL is internally consistent.

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import colluseumConfig from './colluseum/config.js'
import xdConfig from './xd/config.js'
import { CATEGORIES as COLO_CATEGORIES } from './colluseum/categories.js'

// Straight from the article: "There are 131 different Pokémon on this
// list." Colosseum has 51 Shadow Pokémon and XD has 83, which is 134 —
// the difference is Makuhita, Mareep and Togepi, the three species that
// can be snagged in BOTH games.
const COLO_SHADOW_COUNT = 51
const XD_SHADOW_COUNT = 83
const SPECIES_IN_BOTH = ['Makuhita', 'Mareep', 'Togepi']
const TOTAL_UNIQUE_SPECIES = 131

describe('Colosseum checklist', () => {
  it('has exactly the 51 Shadow Pokémon Bulbapedia lists for Colosseum', () => {
    const shadow = colluseumConfig.data.filter(item => item.category === 'shadow')
    expect(shadow).toHaveLength(COLO_SHADOW_COUNT)
  })

  // Espeon and Umbreon are Wes's starting pair and Ho-Oh is the Mt. Battle
  // reward — all three are Colosseum-exclusive and belong on the list, but
  // none of them is a Shadow Pokémon. Tagging them 'shadow' would both
  // inflate the Shadow count and give them ItemCard's purple Shadow glow.
  it('keeps the three non-Shadow Colosseum exclusives out of the shadow category', () => {
    const byName = Object.fromEntries(colluseumConfig.data.map(item => [item.name, item]))
    expect(byName['Espeon'].category).toBe('starter')
    expect(byName['Umbreon'].category).toBe('starter')
    expect(byName['Ho-Oh'].category).toBe('bonus')
  })

  it('only uses category keys that categories.js actually defines', () => {
    const validKeys = new Set(COLO_CATEGORIES.map(c => c.key))
    const mistagged = colluseumConfig.data
      .filter(item => !validKeys.has(item.category))
      .map(item => `${item.name} -> "${item.category}"`)
    expect(mistagged).toEqual([])
  })

  // The three e-Reader-only snags are the entries most likely to get
  // "cleaned up" by someone who can't find them in a Western copy. They're
  // on the list on purpose — this is the test that says so out loud.
  it('still includes the Japanese e-Reader exclusives', () => {
    const names = colluseumConfig.data.map(item => item.name)
    for (const name of ['Togepi', 'Mareep', 'Scizor']) {
      expect(names, `${name} (Card e Room, Japanese games only)`).toContain(name)
    }
  })
})

describe('XD: Gale of Darkness checklist', () => {
  it('has exactly the 83 Shadow Pokémon Bulbapedia lists for XD', () => {
    const shadow = xdConfig.data.filter(item => item.category === 'shadow')
    expect(shadow).toHaveLength(XD_SHADOW_COUNT)
  })

  it('tags every single entry as shadow (XD has no non-Shadow extras on this list)', () => {
    const offTag = xdConfig.data
      .filter(item => item.category !== 'shadow')
      .map(item => `${item.name} -> "${item.category}"`)
    expect(offTag).toEqual([])
  })

  // Shadow Lugia is the one Pokémon whose appearance actually changes when
  // it's turned Shadow, which is why it gets its own name and the "249S"
  // sprite rather than sharing plain Lugia's.
  it('lists Shadow Lugia under its own name, on dex #249, with the 249S sprite', () => {
    const lugia = xdConfig.data.filter(item => item.dexId === 249)
    expect(lugia).toHaveLength(1)
    expect(lugia[0].name).toBe('Shadow Lugia')
    expect(lugia[0].spriteUrl).toMatch(/Menu_XD_249S\.png$/)
  })
})

describe('Colosseum + XD together', () => {
  it('covers 131 unique Shadow species across both games', () => {
    const names = new Set([
      ...colluseumConfig.data.filter(i => i.category === 'shadow').map(i => i.name),
      ...xdConfig.data.map(i => i.name),
    ])
    expect(names.size).toBe(TOTAL_UNIQUE_SPECIES)
  })

  it('has the three dual-game species present in both lists', () => {
    const coloNames = new Set(colluseumConfig.data.map(i => i.name))
    const xdNames = new Set(xdConfig.data.map(i => i.name))
    for (const name of SPECIES_IN_BOTH) {
      expect(coloNames, `${name} missing from Colosseum`).toContain(name)
      expect(xdNames, `${name} missing from XD`).toContain(name)
    }
  })

  // Bulbapedia's archive serves every file from a path derived from the
  // MD5 of its own filename: /media/upload/<md5[0]>/<md5[0:2]>/<filename>.
  // That means a URL can be checked for correctness offline — if the hash
  // folders don't match the filename, the link is dead, full stop. This
  // catches a hand-edited URL or a mistyped dex number without needing
  // network access in CI.
  it.each([
    ['colluseum', colluseumConfig, 'Colo'],
    ['xd', xdConfig, 'XD'],
  ])('builds every %s Bulbapedia sprite URL with a matching MD5 path', (_id, config, game) => {
    const pattern = new RegExp(
      `^https://archives\\.bulbagarden\\.net/media/upload/([0-9a-f])/([0-9a-f]{2})/(Menu_${game}_\\w+\\.png)$`
    )
    const broken = []
    for (const item of config.data) {
      // Only checks the ones still hotlinked to Bulbapedia — once
      // scripts/use-local-sprites.mjs has run, these become /sprites/...
      // paths and there's no hash left to verify.
      if (!item.spriteUrl.startsWith('https://archives.bulbagarden.net/')) continue

      const match = pattern.exec(item.spriteUrl)
      if (!match) {
        broken.push(`${item.name}: not a Menu_${game}_*.png archive URL -> ${item.spriteUrl}`)
        continue
      }
      const [, dir1, dir2, filename] = match
      const hash = createHash('md5').update(filename).digest('hex')
      if (dir1 !== hash[0] || dir2 !== hash.slice(0, 2)) {
        broken.push(`${item.name}: ${filename} should live at ${hash[0]}/${hash.slice(0, 2)}, not ${dir1}/${dir2}`)
      }
    }
    expect(broken).toEqual([])
  })

  // The sprite filename embeds the dex number, so these two can drift apart
  // silently — an entry can end up named one Pokémon, numbered a second and
  // pictured a third. Colosseum writes the number bare (Menu_Colo_296.png)
  // while XD zero-pads to three digits (Menu_XD_037.png), which is why this
  // compares numerically rather than as text.
  it.each([
    ['colluseum', colluseumConfig],
    ['xd', xdConfig],
  ])('keeps every %s sprite filename in step with its dexId', (_id, config) => {
    const mismatched = []
    for (const item of config.data) {
      const match = /Menu_(?:Colo|XD)_(\d+)S?\.png$/.exec(item.spriteUrl)
      if (!match) continue
      if (Number(match[1]) !== item.dexId) {
        mismatched.push(`${item.name}: dexId ${item.dexId} but sprite ${match[1]}`)
      }
    }
    expect(mismatched).toEqual([])
  })
})