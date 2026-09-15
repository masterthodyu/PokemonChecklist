// Downloads every sprite image referenced across every checklist's
// data.json into public/sprites/<checklist-id>/<filename>, instead of
// hotlinking pokemondb.net / serebii.net / wixmp directly. Run this from
// wherever you actually have normal internet access (your own machine,
// or a Codespace) — some of these hosts block requests from sandboxed/
// datacenter environments, which is why this has to be a script you run
// yourself rather than something done for you automatically.
//
// Usage:
//   node scripts/download-sprites.mjs
//
// Safe to re-run any time — it skips any file that's already been
// downloaded, so running it again after adding new Pokémon only fetches
// the new ones.
//
// This ONLY downloads the files — it does not change any data.json's
// spriteUrl fields to point at the new local copies. That's a separate,
// deliberate second step (see scripts/use-local-sprites.mjs) so you can
// check the downloaded images actually look right before switching
// anything over.

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
}

main()
