// Run this AFTER scripts/download-sprites.mjs and after you've actually
// looked through public/sprites/ to confirm the images downloaded
// correctly. This rewrites every data.json's spriteUrl to point at the
// local copy (e.g. "/sprites/home/bulbasaur.png") instead of the
// original hotlinked URL — but only for files that actually exist
// locally, so a failed/skipped download just keeps its original
// hotlinked URL rather than breaking.
//
// Usage:
//   node scripts/use-local-sprites.mjs
//
// This is a separate, deliberate step (not automatic) so you get a
// chance to sanity-check the downloaded images first — once this runs,
// the original hotlinked URLs are gone from data.json unless you revert
// with git.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.join(__dirname, '..')
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'src', 'checklists')
const SPRITES_DIR = path.join(PROJECT_ROOT, 'public', 'sprites')

function urlToFilename(url) {
  const withoutQuery = url.split('?')[0]
  return decodeURIComponent(withoutQuery.split('/').pop())
}

function main() {
  const checklistFolders = fs
    .readdirSync(CHECKLISTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  let switched = 0
  let leftAlone = 0

  for (const checklistId of checklistFolders) {
    const dataPath = path.join(CHECKLISTS_DIR, checklistId, 'data.json')
    if (!fs.existsSync(dataPath)) continue

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

    for (const item of data) {
      if (!item.spriteUrl) continue
      if (item.spriteUrl.startsWith('/sprites/')) continue // already switched

      const filename = urlToFilename(item.spriteUrl)
      const localPath = path.join(SPRITES_DIR, checklistId, filename)

      if (fs.existsSync(localPath)) {
        item.spriteUrl = `/sprites/${checklistId}/${filename}`
        switched++
      } else {
        leftAlone++ // no local copy — probably a failed download, keep the original URL working
      }
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n')
  }

  console.log(`Switched ${switched} entries to local sprites. Left ${leftAlone} on their original URL (no local copy found for those).`)
}

main()
