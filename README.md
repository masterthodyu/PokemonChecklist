# DISCLAIMER
This is an unofficial, non-commercial fan project. Pokemon and all related names, images, and data are trademarks and copyrights of Nintendo, Game Freak, Creatures Inc. and The Pokemon Company. This project is not affiliated with, endorsed by or sponsored by any of them.

# My Checklist Project

This started as a single page to check off every Pokémon I've caught in Pokémon Home. It's now a hub that holds several independent checklists — Pokémon Home, Pokémon GO, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold, Colosseum, and XD: Gale of Darkness so far — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist. Progress is stored in one shared Firebase database. Built with Claude's help along the way, especially for the parts I didn't know how to do myself.

I edit these during my night shifts when I get the chance so apologies for poor edits or discrepencies. Software development isn't my current employment so I get out of practice here and there.

## How this differs from other trackers

This list is something more personally tailored to myself. I wanted to not just be bound by base forms in Pokémon Home, or not include N's Pokémon, or leave out the one Spiky-eared Pichu from HGSS. I wanted to mark that I've caught EVERY SINGLE POKÉMON POSSIBLE — starting with all the sprite differences, and then maybe in the future going for the ultra rares, like Japan birthday Pokémon or rarer events.

## What it does

- Central page that lists overall collection progress. Clickable pages to specific lists(see "Icons, colors, and background image" below) and progress bars. A checklist explicitly marked `placeholder: true` in its config shows "🚧 Still being built" instead of a percentage, since something like "0 / 3 (0%)" reads as broken rather than "not built out yet" (a genuinely tiny-but-finished list, like the 1-entry HGSS one, still shows a real percentage)
- Every item shows up as a card in a grid — click it (or its checkbox) to mark caught/not caught
- Checking something **stamps the date it was checked**, shown as a small label in the corner of the card. Unchecking removes it entirely (no history kept — if you want to backdate or restore something, that's a database-level edit)
- **Select All** / **Unselect All** buttons act on everything currently visible (the current box, or the current filtered list for a boxless checklist), both with a confirmation showing exactly how many items are affected, and both disable themselves when there's nothing to do
- After a Select All / Unselect All, an **Undo banner** appears for a few seconds — reverts that one bulk action back to exactly how things were, in case of a misclick. It clears itself the moment you make any other change, so it can never revert the wrong thing
- Search bar (name or number) has a clear (×) button, and Escape clears it too — jumps to the right box for boxed checklists, or filters the flat list directly for boxless ones
- Filter buttons: All / Caught / Not Caught, with an empty-state message ("No matches for that search," "Everything here is already caught," etc.) instead of a silently blank grid
- Most checklists use 30-per-box (6×5) grids with Previous/Next and a "jump to box #" field, same as the games' PC boxes
- Left sidebar: one progress-bar list per "group set" a checklist defines (Pokémon Home has Generation and Category; Colosseum has Category) — click a row to jump to it. Checklists with no group sets defined (SoulSilver, GO, USUM, XD currently) skip the sidebar entirely and center the content instead of leaving a dead gap
- Gigantamax cards (Pokémon Home) get a small badge (currently hotlinked from DeviantArt — see "Image sources" below).
- **Pokémon GO has no boxes** — it's one flat, searchable list instead, since the actual game doesn't have a box system. 
- Shadow Pokémon cards get a small badge and a subtle purple glow on the sprite
- Locked by default so random clicks don't change anything — one password unlocks editing across every checklist for the rest of the browser tab after clicking on the lock button or clicking on a card.
- Progress saves to the browser automatically, under its own storage key per checklist even after tab closure.
- Cloud sync through Firebase Realtime Database — one shared database for every checklist. A "☁️ Synced" status shows **when it last actually synced**, not just that it's currently synced. If a sync push ever fails, a Retry button shows up right next to the error instead of needing a page reload. On a brand-new device where localStorage starts empty, a failed sync gets a more prominent warning instead of the usual small gray line — "0 caught" plus a failed sync could otherwise look exactly like every bit of progress being gone, rather than "we just couldn't check yet"
- Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`

## How it's structured

- `src/App.jsx` — just wires up routing: a hub page, plus one route per checklist. Doesn't know anything about Pokémon (or any specific checklist) at all anymore.
- `src/HubPage.jsx` — the landing page (`/`). A centered, stacked list — one row per checklist, each with its own icon, accent color, and progress bar, linking into that checklist.
- `src/hubConfig.js` — the hub's own settings: its title, and an optional background image.
- `src/engine/` — the shared, checklist-agnostic engine every checklist page actually renders through: box grid (or flat list), search, filters, select-all/undo, the group-progress sidebars, the password lock, and cloud sync all live here.
  - `ChecklistPage.jsx` — the main page component
  - `ItemCard.jsx` — configures the one clickable pokemon tiles
  - `GroupProgress.jsx` — one progress-bar sidebar list (shared by every group set a checklist defines — Pokémon Home's Generation and Category sidebars are two instances of this same component, not two copies of similar code)
  - `lock.js` — the password check
  - `sync.js` — cloud sync via Firebase Realtime Database's REST API, one shared database, one path per checklist
- `src/checklists/` — one folder per checklist. `index.js` is the registry — add one line here per new checklist.
  - `home/` — Pokémon Home: `config.js`, `data.json`, `generations.js`, `categories.js`, `scripts/`
  - `go/` — Pokémon GO: boxless (no box system, since the real game doesn't have one either)
  - `usum/` — Ultra Sun & Ultra Moon: just the four non transferable Totem Pokémon exclusive to that games.
  - `soulsilver/` — Soul Silver & Heart Gold: contains only 1 pokemon, spiked-ear Pichu. Only pokemon that couldn't transfer out of the games.
  - `colosseum/` — Pokémon Colosseum: 54 entries, with its own `categories.js` (see "The GameCube checklists" below)
  - `xd/` — Pokémon XD: Gale of Darkness: 83 entries, all Shadow Pokémon

Adding a new checklist means copying the shape of `src/checklists/home/`, writing its `config.js`, and adding one line to `src/checklists/index.js` — nothing in `src/engine/` needs to change.

## The GameCube checklists (Colosseum & XD)

**Colosseum — 54 entries.** 51 Shadow Pokémon, plus three Colosseum-exclusive Pokémon that are *not* Shadow: Espeon and Umbreon (Wes's starting pair, tagged `starter`) and the Mt. Battle reward Ho-Oh (tagged `bonus`). Keeping those three out of the `shadow` category is deliberate — it stops them inflating the Shadow count and stops `ItemCard` giving them the purple Shadow glow they haven't earned. The three categories are defined in `colosseum/categories.js` and drive the one sidebar list on that page.

**XD — 83 entries, all Shadow.** No `starter`/`bonus` extras and no sidebar, because a sidebar with a single group in it would just be a second copy of the header's progress bar. Entry 76 is Shadow Lugia, the only Pokémon whose appearance actually changes when it's turned Shadow — hence its own name and the `249S` sprite rather than a plain Lugia's.

Together the two lists cover **131 unique species**, which is the figure the Bulbapedia article itself states. The overlap is Makuhita, Mareep and Togepi — the three species snaggable in both games.

Three of Colosseum's 51 (**Togepi, Mareep and Scizor**) are Japanese-only e-Reader snags via the Card e Room. They're on the list on purpose, since the point of this project is "every Pokémon possible," but they're the ones to expect never to tick off on a Western cartridge. `Shadow.test.jsx` has a test that exists specifically to stop someone "tidying them up" later.

**A note on the folder name:** this was originally spelled `colluseum` (a typo for Colosseum), same as `id`, `storageKey`, and `syncId`. It's since been fixed everywhere — folder included — because this checklist was still new enough that nothing had real saved progress sitting under the old misspelled keys yet. That's the opposite of Home's `pokemon`/`pokemon-caught-v1` keys, which stay misspelled on purpose (see that config's own comment) specifically because real progress already exists there. If you'd already checked things off here before this fix, that progress would be stuck under the old `colluseum-caught-v1` key — a one-time migration would be needed to recover it, rather than just the rename.

## Hub title & the overall progress card

`src/hubConfig.js` also has a `collectionLabel` field — a small heading shown directly above the overall-completion progress bar at the top of the hub (separate from `title`, which is the page's big `<h1>`). Set it to `''` or `null` to hide that line.

The overall-completion card (the one showing total % across every finished checklist) uses the same solid dark card treatment as the per-checklist rows below it — it used to be a near-transparent tint, which made both the card and its progress bar genuinely hard to see against the hub's background image.

## Icons, colors, and background image

Each checklist's `config.js` has an `icon` field — just point it at an image path and drop the actual file in `public/icons/`. No icon set? The hub shows a plain placeholder box instead, so nothing looks broken while you're still deciding.

A checklist can also set `accentFrom`/`accentTo` (two hex colors) to give its hub row and progress bar their own little gradient instead of the default red-to-yellow. Both are optional — leave them out and the defaults apply.

The hub itself can have a background image too — set `backgroundImage` in `src/hubConfig.js` to a path, and drop that file in `public/`. Leave it `null` and the hub just keeps its plain dark background. Either way, text stays readable — there's a dark overlay under whatever background image gets set.

A general note on images anywhere in this project: self-hosting a file in `public/` (rather than linking straight to someone else's server) is worth the extra step — a hotlinked URL can break on its own if the other site changes something, moves the file, or (as with the Gigantamax badge and the hub's own background image, currently) the link had a time-limited access token baked into it.

## Running it yourself

You'll need [Node.js](https://nodejs.org) installed. Then:

```
npm install
npm run dev
```

That starts it up locally so you can poke around before pushing anything live.

To build the actual site (the thing that gets deployed):

```
npm run build
```

## Automated tests

```
npm test          # runs the whole suite once
npm run test:watch   # re-runs on file changes
```
Test will also run upon build or dev start.

Uses [Vitest](https://vitest.dev) (config lives in `vite.config.js`'s `test` block) plus [Testing Library](https://testing-library.com/react) for the component tests. Five kinds of tests, none of which need Firebase, a real browser, or any network access:

- `src/engine/sync.test.js`, `src/engine/lock.test.js` — pure-logic tests for the checked-id parsing, the Firebase REST calls (with `fetch` mocked), and the password check.
- `src/checklists/Registry.test.jsx` — data-integrity checks that run against the **real** `data.json`/`config.js` files, not fixtures. No duplicate ids *or names* within a checklist, no two checklists sharing a `storageKey`/`syncId`, every `spriteUrl` either a local `/sprites/` path or a full URL, every `dexId` a plausible National Dex number, no box holding more than `boxSize` entries, box numbers running contiguously from 1, no sidebar group that matches zero items, every Home category tag actually present in `categories.js`, generation ranges not overlapping.
- `src/checklists/Shadow.test.jsx` — the Colosseum/XD-specific checks the generic ones can't make: Colosseum's 51/2/1 shadow/starter/bonus split, XD's Shadow Lugia entry, the 131-unique-Shadow-species figure Bulbapedia's own article states (and that the 3-species overlap is exactly Makuhita/Mareep/Togepi), and that both checklists are wired into `CHECKLISTS`. Also verifies every sprite URL still pointing at Bulbagarden (currently all 83 of XD's) is internally consistent — Bulbagarden's archive path is a deterministic MD5 hash of the filename, so a wrong or typo'd URL can be caught with `node:crypto` alone, no network needed — and that the dex number baked into each of those filenames matches that entry's `dexId`. Also checks the "Shadow" name fallback `ItemCard.jsx` uses (see `ItemCard.test.jsx` for the component-level behavior of that same fallback) against the real data — that Home's Marshadow doesn't false-positive into it, and that GO's own unrelated "Shadow [Pokémon]" costume Pokémon do (documented on purpose, not something this fixes).
- `src/engine/ItemCard.test.jsx` — per-card behavior: the Gigantamax name-stripping and badge, the Shadow badge, the checked-date label, and that one click fires `onToggle` exactly once.
- `src/engine/ChecklistPage.test.jsx` — the big one. Renders the whole page against small fake checklists and covers box navigation, search (including jump-to-box and the ×/Escape clears), the All/Caught/Not Caught filters, the password lock, Select All / Unselect All / Undo, localStorage persistence, the group sidebar, and that boxless checklists render no box controls at all.

Adding a checklist to `src/checklists/index.js` gets covered by `Registry.test.jsx` automatically — no test file changes needed for that part.

**Deployment note:** `vite.config.js`'s `base` needs to match your actual GitHub repo name exactly (currently `/PokemonChecklist/`). `App.jsx`'s router `basename` reads this automatically now, so there's only ever one place to update it. That subpath only applies during `npm run build` — `npm run dev` stays at the plain root, since forcing the dev server under a subpath was causing 404s (most setups, including a GitHub Codespaces forwarded preview URL, open the dev server at its root). `vite.config.js` also sets `server.host: true` so Codespaces' port forwarding can actually reach the dev server.

## The password lock

Editing the page is "protected" by a password to prevent accidental clicks or unwanted guest clicks. One password unlocks every checklist. This is a single-user personal tool, not something built for multiple people to log in separately — one shared password and one shared database is the right amount of complexity for that.

To set your own password:
- Local dev: create a `.env.local` file in the project root containing `VITE_EDIT_PASSWORD=whatever-you-want`. It's already in `.gitignore`, so it won't get committed.
- Live site: add it as a `PASSWORD` secret in the repo's GitHub Actions settings — `deploy.yml` reads that secret into `VITE_EDIT_PASSWORD` at build time.

If no password is configured at all, editing simply can't be unlocked — `checkPassword` returns false for everything rather than letting an empty value through.

## How the boxes are organized (boxed checklists)

Every item in a boxed checklist's `data.json` has a `boxId` already baked in. To change where a box starts, add a break point to that checklist's `assignBoxes.mjs` and rerun it — no need to hand-edit every entry:

```
node src/checklists/home/scripts/assignBoxes.mjs
```

Same idea for categories — `assignCategories.mjs` tags each item automatically based on naming conventions explained in the comment at the top of that file:

```
node src/checklists/home/scripts/assignCategories.mjs
```

Pokémon GO doesn't have either script — it's boxless, and category tagging hasn't been needed there yet (its ids are hand-assigned decimals grouping variants near their base species, e.g. all the Pikachu costumes near `25.x`). Since these are hand-assigned rather than generated, double-check a new entry's decimal doesn't already belong to another costume before adding it — two entries sharing one `id` means checking either one shows both as checked, and React will complain about duplicate list keys.

Colosseum and XD don't have the scripts either — their boxes are just the article's row order chopped into thirties, so a plain sequential fill is all they need. `Registry.test.jsx` is what guards that (no box over 30, no gaps in the numbering), rather than a script you have to remember to rerun.

## Self-hosting sprites & other images

Every sprite and icon started out hotlinked from other sites (see "Image sources" below). Two scripts move that over to local files in `public/`, in two deliberate steps:

1. **`node scripts/download-sprites.mjs`** — reads every checklist's `data.json` and downloads each `spriteUrl` it finds into `public/sprites/<checklist-id>/<original-filename>`, and separately reads every checklist's `config.js` for an `icon:` field that's still a real URL (not already a local path) and downloads that too, into `public/icons/<checklist-id>.<ext>`. **You don't need to create either folder yourself** — the script creates `public/sprites/` and `public/icons/` (and one sprites-subfolder per checklist) automatically the first time it runs. Nothing about this runs on its own — there's no build step, git hook, or CI job that triggers it; you run it yourself, by hand, whenever you want to pull down whatever's currently hotlinked. It's also safe to re-run any time (e.g. after adding new Pokémon to a `data.json`): it skips anything it's already downloaded, so a re-run only fetches what's new.
2. **`node scripts/use-local-sprites.mjs`** — run this only after step 1, and after you've actually looked through `public/sprites/` to confirm the images downloaded correctly. This rewrites each `data.json`'s `spriteUrl` fields to point at the local copy instead of the original hotlinked URL — but only for files it can actually find locally, so a failed/skipped download just keeps its original working URL rather than breaking. **This one doesn't touch `icon:` fields** — those live in `config.js`, not a JSON file, so once step 1 has downloaded an icon, swap that checklist's `icon:` line over by hand (`download-sprites.mjs` prints the exact local path to use for each one it downloads).

Both are plain Node scripts (`node <path>`), not npm scripts, and both need to run somewhere with normal internet access — some of the source sites (PokémonDB, Serebii, the wixmp-hosted DeviantArt links) block requests from sandboxed or datacenter environments, which is why this is a manual step you run yourself (your own machine, or a Codespace) rather than something automated in CI.

Colosseum's 54 sprites, and every checklist's icon, have already been through both steps and live locally in `public/sprites/colosseum/` and `public/icons/`. XD's 83 sprites haven't — `xd/data.json` still points straight at Bulbagarden. Running both scripts again only fetches those 83, since everything else downloaded already gets skipped.

## Cloud sync setup

Every checklist shares one Firebase Realtime Database, each at its own path — so unlike a per-checklist-bin setup, adding a new checklist needs no new sync setup at all, just one more `syncId` in that checklist's `config.js`.

1. Free project at [console.firebase.google.com](https://console.firebase.google.com) (the free Spark plan is enough) — Build → Realtime Database → Create Database, any region
2. Copy the database URL it gives you (looks like `https://your-project-default-rtdb.firebaseio.com`)
3. Local dev: add it to the same `.env.local` as the password, as `VITE_FIREBASE_DB_URL=https://...`
4. Live site: add it as a `FIREBASE_DB_URL` secret in the repo's GitHub Actions settings
5. In the Rules tab, paste `{ "rules": { ".read": true, ".write": true } }` — wide open on purpose, since this is a personal checklist with nothing sensitive in it and only ever one person (me) using it. Anyone who found the database URL could read or overwrite it, though — worth tightening (or moving to a real backend) if that ever stops being an acceptable trade-off.

If `VITE_FIREBASE_DB_URL` isn't set, every checklist just saves locally only — nothing breaks, it just won't follow you across devices until it's set up. One database URL covers every checklist, so there's only ever this one thing to configure, regardless of how many checklists exist.

## Image sources

None of the artwork or sprites in this project are mine. Most of it is downloaded and self-hosted in `public/` now rather than hotlinked (see "Self-hosting sprites & other images" above) — every checklist's hub icon, and every checklist's sprites except XD's. What's below is where each originally came from, self-hosted or not:

- **Pokémon sprites** (Home, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold checklists) — [PokémonDB](https://pokemondb.net)
- **Pokémon GO costume/seasonal variant sprites** — [Serebii.net](https://www.serebii.net)
- **Colosseum menu sprites** — [Serebii.net](https://www.serebii.net); self-hosted now.
- **XD menu sprites** — [Bulbagarden Archives](https://archives.bulbagarden.net), the media host behind [Bulbapedia](https://bulbapedia.bulbagarden.net). Bulbapedia content is [CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/). Still hotlinked directly — see "Self-hosting sprites & other images" above.
- **Pokémon Home hub icon** — Google Play Store listing image
- **Pokémon GO hub icon** — [Pokémon GO Wiki](https://pokemongo.fandom.com) (Fandom)
- **Soul Silver/Heart Gold hub icon** — [jklaczpokemon.com](https://jklaczpokemon.com)
- **Ultra Sun/Ultra Moon hub icon** — DeviantArt originally; self-hosted now.
- **Colosseum & XD hub icons** — Bulbagarden Archives originally; self-hosted now.
- **Gigantamax badge** (Pokémon Home cards) — fan art by DeviantArt user jormxdos, still hotlinked via a temporary wixmp CDN link (see the note in `styles.css`)
- **Hub background image** — "Drawing Every Pokémon Ever" by DeviantArt user ccayco, still hotlinked via a temporary wixmp CDN link

The Gigantamax badge and the hub background are both DeviantArt links with a time-limited access token baked into the URL, so unlike a plain hotlink these could stop working on their own even if nothing else changes — the fix is the same as anything else here still hotlinked: download it and point `public/` at the local copy.

## License

The code itself is MIT-licensed — see `LICENSE`. That covers this project's own code only; it doesn't extend to Pokémon itself (see the disclaimer at the top) or to any of the sprites/artwork listed above, which stay under whatever terms their original sources use.