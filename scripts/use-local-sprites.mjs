// Run this AFTER scripts/download-sprites.mjs and after you've actually
// looked through public/sprites/, public/icons/, and public/backgrounds/
// to confirm everything downloaded correctly. This rewrites:
//   - every data.json's spriteUrl
//   - every checklist's config.js `icon` field
//   - the hub's own hubConfig.js `backgroundImage`, and every checklist's
//     own config.js `backgroundImage`
// to point at the local copy (e.g. "sprites/home/bulbasaur.png",
// "icons/home.png", "backgrounds/hub.jpg") instead of the original
// hotlinked URL — but only for files that actually exist locally, so a
// failed/skipped download just keeps its original hotlinked URL rather
// than breaking.
//
// Usage:
//   node scripts/use-local-sprites.mjs
//
// This is a separate, deliberate step (not automatic) so you get a
// chance to sanity-check the downloaded images first — once this runs,
// the original hotlinked URLs are gone from data.json/config.js unless
// you revert with git.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.join(__dirname, '..')
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'src', 'checklists')
const SPRITES_DIR = path.join(PROJECT_ROOT, 'public', 'sprites')
const ICONS_DIR = path.join(PROJECT_ROOT, 'public', 'icons')
const BACKGROUNDS_DIR = path.join(PROJECT_ROOT, 'public', 'backgrounds')

function urlToFilename(url) {
  const withoutQuery = url.split('?')[0]
  return decodeURIComponent(withoutQuery.split('/').pop())
}

// Mirrors download-sprites.mjs's own UGLY_FILENAME_HOSTS fallback
// exactly — an icon/background pulled from one of these hosts was saved
// to disk as "<id>.<ext>", not its real (garbled/generic) filename, so
// this has to compute the same fallback name to find it again.
const UGLY_FILENAME_HOSTS = ['encrypted-tbn0.gstatic.com', 'wixmp.com']

function filenameFor(url, id, defaultExt = 'png') {
  if (UGLY_FILENAME_HOSTS.some(host => url.includes(host))) {
    return `${id}.${defaultExt}`
  }
  return urlToFilename(url)
}

// Finds `fieldName: 'https://...'` (or "...") in a config.js file and, if
// a local copy of that URL exists on disk, rewrites just that field to
// point at it. Returns null if the field isn't set or is already a local
// path (nothing to do); { switched: false } if it's still a hotlink but
// no local copy was found (failed/skipped download — left as-is); or
// { switched: true } once it's actually rewritten.
function switchFieldToLocal({ configPath, fieldName, assetSubdir, assetDirOnDisk, id, defaultExt }) {
  if (!fs.existsSync(configPath)) return null

  const source = fs.readFileSync(configPath, 'utf8')
  const fieldRegex = new RegExp(`^(\\s*${fieldName}:\\s*)(['"])(https?:\\/\\/[^'"]+)\\2`, 'm')
  const match = source.match(fieldRegex)
  if (!match) return null // not set, or already switched to a local path

  const [, , quote, url] = match
  const filename = filenameFor(url, id, defaultExt)
  const localDiskPath = path.join(assetDirOnDisk, filename)

  if (!fs.existsSync(localDiskPath)) {
    return { switched: false } // failed/skipped download — keep the hotlink working
  }

  const localValue = `${assetSubdir}/${filename}`
  const updated = source.replace(fieldRegex, `$1${quote}${localValue}${quote}`)
  fs.writeFileSync(configPath, updated)
  return { switched: true }
}

function main() {
  const checklistFolders = fs
    .readdirSync(CHECKLISTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  let switched = 0
  let leftAlone = 0

  // --- Every Pokémon sprite in every checklist's data.json ---
  for (const checklistId of checklistFolders) {
    const dataPath = path.join(CHECKLISTS_DIR, checklistId, 'data.json')
    if (!fs.existsSync(dataPath)) continue

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

    for (const item of data) {
      if (!item.spriteUrl) continue
      if (item.spriteUrl.startsWith('sprites/')) continue // already switched

      const filename = urlToFilename(item.spriteUrl)
      const localPath = path.join(SPRITES_DIR, checklistId, filename)

      if (fs.existsSync(localPath)) {
        item.spriteUrl = `sprites/${checklistId}/${filename}`
        switched++
      } else {
        leftAlone++ // no local copy — probably a failed download, keep the original URL working
      }
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n')
  }

  // --- Each checklist's own icon (config.js) ---
  for (const checklistId of checklistFolders) {
    const result = switchFieldToLocal({
      configPath: path.join(CHECKLISTS_DIR, checklistId, 'config.js'),
      fieldName: 'icon',
      assetSubdir: 'icons',
      assetDirOnDisk: ICONS_DIR,
      id: checklistId,
      defaultExt: 'png',
    })
    if (result?.switched) switched++
    else if (result) leftAlone++
  }

  // --- Background images: the hub's own (hubConfig.js) and every
  //     checklist's own (that checklist's config.js) — same field name
  //     either way. ---
  const backgroundTargets = [
    { configPath: path.join(PROJECT_ROOT, 'src', 'hubConfig.js'), id: 'hub' },
    ...checklistFolders.map(checklistId => ({
      configPath: path.join(CHECKLISTS_DIR, checklistId, 'config.js'),
      id: checklistId,
    })),
  ]
  for (const { configPath, id } of backgroundTargets) {
    const result = switchFieldToLocal({
      configPath,
      fieldName: 'backgroundImage',
      assetSubdir: 'backgrounds',
      assetDirOnDisk: BACKGROUNDS_DIR,
      id,
      defaultExt: 'jpg',
    })
    if (result?.switched) switched++
    else if (result) leftAlone++
  }

  console.log(`Switched ${switched} fields to local files. Left ${leftAlone} on their original URL (no local copy found for those).`)
}

main()
