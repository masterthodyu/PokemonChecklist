// Downloads every sprite image referenced across every checklist's
// data.json — AND every checklist's own icon (config.js's `icon` field,
// if it's still an external URL) — AND every background image (both the
// hub's own, in hubConfig.js, and each checklist's own, in that
// checklist's config.js — same `backgroundImage` field either way, if
// it's still an external URL) — into public/sprites/, public/icons/, and
// public/backgrounds/ respectively, instead of hotlinking pokemondb.net /
// serebii.net / archives.bulbagarden.net / Google's thumbnail cache /
// DeviantArt's wixmp CDN directly. Run this from wherever you actually
// have normal internet access (your own machine, or a Codespace) — some
// of these hosts block requests from sandboxed/datacenter environments,
// which is why this has to be a script you run yourself rather than
// something done for you automatically.
//
// Usage:
//   node scripts/download-sprites.mjs
//
// Safe to re-run any time — it skips any file that's already been
// downloaded, so running it again after adding new Pokémon (or setting a
// new background somewhere) only fetches what's new.
//
// This ONLY downloads the files — it does not change any data.json's
// spriteUrl fields to point at the new local copies. That's a separate,
// deliberate second step (see scripts/use-local-sprites.mjs) so you can
// check the downloaded images actually look right before switching
// anything over. icon and backgroundImage fields live in .js files, not
// JSON, so use-local-sprites.mjs doesn't touch those at all — swap those
// two over by hand once you've checked the download, same as always.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.join(__dirname, '..')
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'src', 'checklists')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'sprites')

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
}

function urlToFilename(url) {
  // Keeps the original filename (e.g. "bulbasaur.png",
  // "025-worlds2025.png") so it's still obvious which Pokémon/costume
  // each file is just by looking at the folder.
  const withoutQuery = url.split('?')[0]
  return decodeURIComponent(withoutQuery.split('/').pop())
}

// Some hosts (Google's thumbnail cache, DeviantArt's wixmp CDN) put
// everything in one shared path with a garbled/generic filename rather
// than the actual image's own name — falls back to "<id>.<ext>" instead
// for those, so the downloaded file is still obviously identifiable.
const UGLY_FILENAME_HOSTS = ['encrypted-tbn0.gstatic.com', 'wixmp.com']

function filenameFor(url, id, defaultExt = 'png') {
  if (UGLY_FILENAME_HOSTS.some(host => url.includes(host))) {
    return `${id}.${defaultExt}`
  }
  return urlToFilename(url)
}

async function downloadOne(url, destPath) {
  const res = await fetch(url, { headers: BROWSER_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

async function main() {
  const checklistFolders = fs
    .readdirSync(CHECKLISTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  // --- Each checklist's icon (config.js), not just its data.json sprites ---
  // Colosseum and XD's icons in particular are still hotlinked to
  // encrypted-tbn0.gstatic.com — Google's internal search-thumbnail
  // cache, never meant for direct embedding, and known to go stale
  // without warning. That's the single most likely reason sprites
  // "aren't loading" for those two checklists specifically.
  const iconsDir = path.join(PROJECT_ROOT, 'public', 'icons')
  fs.mkdirSync(iconsDir, { recursive: true })

  for (const checklistId of checklistFolders) {
    const configPath = path.join(CHECKLISTS_DIR, checklistId, 'config.js')
    if (!fs.existsSync(configPath)) continue

    const configSource = fs.readFileSync(configPath, 'utf8')
    const iconMatch = configSource.match(/icon:\s*['"](https?:\/\/[^'"]+)['"]/)
    if (!iconMatch) continue // no icon set, or already a local path — nothing to do

    const iconUrl = iconMatch[1]
    const filename = filenameFor(iconUrl, checklistId)
    const destPath = path.join(iconsDir, filename)

    if (fs.existsSync(destPath)) {
      skipped++
      continue
    }

    try {
      await downloadOne(iconUrl, destPath)
      downloaded++
      console.log(`✓ icons/${filename} (${checklistId})`)
    } catch (err) {
      failed++
      console.warn(`✗ icons/${filename} (${checklistId}) — ${err.message} (${iconUrl})`)
    }
  }

  // --- Background images: the hub's own (hubConfig.js) and every
  //     checklist's own (that checklist's config.js) — same
  //     backgroundImage field either way, only downloaded if it's still
  //     a real URL (not null, not already a local path). ---
  const backgroundsDir = path.join(PROJECT_ROOT, 'public', 'backgrounds')
  fs.mkdirSync(backgroundsDir, { recursive: true })

  async function downloadBackgroundIfPresent(configPath, id) {
    if (!fs.existsSync(configPath)) return
    const configSource = fs.readFileSync(configPath, 'utf8')
    const match = configSource.match(/backgroundImage:\s*['"](https?:\/\/[^'"]+)['"]/)
    if (!match) return // null, unset, or already a local path — nothing to do

    const bgUrl = match[1]
    const filename = filenameFor(bgUrl, id, 'jpg')
    const destPath = path.join(backgroundsDir, filename)

    if (fs.existsSync(destPath)) {
      skipped++
      return
    }

    try {
      await downloadOne(bgUrl, destPath)
      downloaded++
      console.log(`✓ backgrounds/${filename} (${id})`)
    } catch (err) {
      failed++
      console.warn(`✗ backgrounds/${filename} (${id}) — ${err.message} (${bgUrl})`)
    }
  }

  await downloadBackgroundIfPresent(path.join(PROJECT_ROOT, 'src', 'hubConfig.js'), 'hub')
  for (const checklistId of checklistFolders) {
    await downloadBackgroundIfPresent(path.join(CHECKLISTS_DIR, checklistId, 'config.js'), checklistId)
  }

  // --- Every Pokémon sprite in every checklist's data.json ---
  for (const checklistId of checklistFolders) {
    const dataPath = path.join(CHECKLISTS_DIR, checklistId, 'data.json')
    if (!fs.existsSync(dataPath)) continue

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    const destFolder = path.join(OUTPUT_DIR, checklistId)
    fs.mkdirSync(destFolder, { recursive: true })

    for (const item of data) {
      if (!item.spriteUrl) continue

      const filename = urlToFilename(item.spriteUrl)
      const destPath = path.join(destFolder, filename)

      if (fs.existsSync(destPath)) {
        skipped++
        continue
      }

      try {
        await downloadOne(item.spriteUrl, destPath)
        downloaded++
        console.log(`✓ ${checklistId}/${filename}`)
      } catch (err) {
        failed++
        console.warn(`✗ ${checklistId}/${filename} — ${err.message} (${item.spriteUrl})`)
      }
    }
  }

  console.log(`\nDone. Downloaded ${downloaded}, already had ${skipped}, failed ${failed}.`)
  if (failed > 0) {
    console.log('Failures are usually a dead/moved link on the source site — worth checking those URLs by hand.')
  }
  console.log('\nSprites: run node scripts/use-local-sprites.mjs next to switch data.json over automatically.')
  console.log('Icons and backgrounds: both live in .js files (config.js / hubConfig.js), not JSON, so switch')
  console.log('  those over by hand — change the field to point at /icons/<filename> or /backgrounds/<filename>')
  console.log('  for whichever ones just downloaded.')
}

main()
