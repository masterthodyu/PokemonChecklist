// Guards specific CSS rules that have regressed silently before, by
// reading styles.css as plain text and checking the property is still
// there — not a full CSS parser, just enough to turn "someone deleted a
// line while editing a nearby rule" into a loud failing test instead of
// a quiet visual bug nobody notices until a screenshot looks wrong.
//
// Add a new check here the same way if another rule earns one: something
// that's been lost and re-added more than once, or that would be easy to
// delete by accident while editing the rule right next to it, with no
// other test that would ever catch it (a component test wouldn't — jsdom
// doesn't apply real CSS, so nothing here is duplicated by component
// tests elsewhere in the suite).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8')

// Pulls out the body of one `selector { ... }` rule, so a check can look
// for a property within THAT rule specifically rather than just
// searching the whole file — which would still pass even if the
// property existed only in some unrelated rule instead.
function ruleBody(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Couldn't find a "${selector} {" rule in styles.css`)
  const end = css.indexOf('}', start)
  return css.slice(start, end)
}

describe('styles.css - regression guards', () => {
  it('.card img keeps object-fit: contain, so a non-square sprite scales instead of stretching', () => {
    // Lost and silently re-added at least three times across separate
    // rounds of edits before this test existed (see the comment on this
    // rule in styles.css itself) — without it, tall art like Giratina's
    // Origin Forme or an Arceus plate gets squashed to fill the 72x72
    // box instead of scaled to fit inside it.
    expect(ruleBody('.card img')).toMatch(/object-fit:\s*contain/)
  })
})