# My Checklist Project

This started as a single page to check off every Pokémon I've caught in Pokémon Home. It's now a hub that holds several independent checklists — Pokémon Home, Pokémon GO, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold, Colosseum, and XD: Gale of Darkness so far — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist. Progress is stored in one shared Firebase database.

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
- Gigantamax cards (Pokémon Home) get a small badge currently hotlinked to an external image as a placeholder; swap it for a self-hosted `public/icons/gmax-badge.png` when there's time.
- **Pokémon GO has no boxes** — it's one flat, searchable list instead, since the actual game doesn't have a box system. 
- Shadow Pokémon cards get a small badge and a subtle purple glow on the sprite
- Locked by default so random clicks don't change anything — one password unlocks editing across every checklist for the rest of the browser tab after clicking on the lock button or clicking on a card.
- Progress saves to the browser automatically, under its own storage key per checklist even after tab closure.
- Cloud sync through Firebase Realtime Database — one shared database for every checklist. If a sync push ever fails, a Retry button shows up right next to the error instead of needing a page reload
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
  - `usum/` — Ultra Sun & Ultra Moon: same shape as Home, currently a placeholder (see below)
  - `soulsilver/` — Soul Silver & Heart Gold: contains only 1 pokemon, spiked-ear Pichu. Only pokemon that couldn't transfer out of the games.
  - `colluseum/` — Pokémon Colosseum: 54 entries, with its own `categories.js` (see "The GameCube checklists" below)
  - `xd/` — Pokémon XD: Gale of Darkness: 83 entries, all Shadow Pokémon

Adding a new checklist means copying the shape of `src/checklists/home/`, writing its `config.js`, and adding one line to `src/checklists/index.js` — nothing in `src/engine/` needs to change.

## The GameCube checklists (Colosseum & XD)

Both lists were built from one Bulbapedia article, and both keep that article's own row order — which is roughly story order, not dex order:

<https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pokémon>

**Colosseum — 54 entries.** 51 Shadow Pokémon, plus three Colosseum-exclusive Pokémon that are *not* Shadow: Espeon and Umbreon (Wes's starting pair, tagged `starter`) and the Mt. Battle reward Ho-Oh (tagged `bonus`). Keeping those three out of the `shadow` category is deliberate — it stops them inflating the Shadow count and stops `ItemCard` giving them the purple Shadow glow they haven't earned. The three categories are defined in `colluseum/categories.js` and drive the one sidebar list on that page.

**XD — 83 entries, all Shadow.** No `starter`/`bonus` extras and no sidebar, because a sidebar with a single group in it would just be a second copy of the header's progress bar. Entry 76 is Shadow Lugia, the only Pokémon whose appearance actually changes when it's turned Shadow — hence its own name and the `249S` sprite rather than a plain Lugia's.

Together the two lists cover **131 unique species**, which is the figure the Bulbapedia article itself states. The overlap is Makuhita, Mareep and Togepi — the three species snaggable in both games.

Three of Colosseum's 51 (**Togepi, Mareep and Scizor**) are Japanese-only e-Reader snags via the Card e Room. They're on the list on purpose, since the point of this project is "every Pokémon possible," but they're the ones to expect never to tick off on a Western cartridge. `shadow.test.js` has a test that exists specifically to stop someone "tidying them up" later.

**A note on the folder name:** it's spelled `colluseum`, which is a typo for Colosseum. It's kept that way on purpose — `id`, `storageKey` and `syncId` are the literal keys your saved progress already lives under, both in localStorage and in Firebase. Renaming them would point the app at empty keys and your progress would look like it had reset. Only the display `title` is spelled correctly.

## Hub title & the overall progress card

`src/hubConfig.js` also has a `collectionLabel` field — a small heading shown directly above the overall-completion progress bar at the top of the hub (separate from `title`, which is the page's big `<h1>`). Set it to `''` or `null` to hide that line.

The overall-completion card (the one showing total % across every finished checklist) uses the same solid dark card treatment as the per-checklist rows below it — it used to be a near-transparent tint, which made both the card and its progress bar genuinely hard to see against the hub's background image.

## Icons, colors, and background image

Each checklist's `config.js` has an `icon` field — just point it at an image path and drop the actual file in `public/icons/`. No icon set? The hub shows a plain placeholder box instead, so nothing looks broken while you're still deciding.

A checklist can also set `accentFrom`/`accentTo` (two hex colors) to give its hub row and progress bar their own little gradient instead of the default red-to-yellow. Both are optional — leave them out and the defaults apply.

The hub itself can have a background image too — set `backgroundImage` in `src/hubConfig.js` to a path, and drop that file in `public/`. Leave it `null` and the hub just keeps its plain dark background. Either way, text stays readable — there's a dark overlay under whatever background image gets set.

A general note on images anywhere in this project: self-hosting a file in `public/` (rather than linking straight to someone else's server) is worth the extra step — a hotlinked URL can break on its own if the other site changes something, moves the file, or (as happened with the Gigantamax badge, the USUM icon, and now the hub's own background image) the link had a time-limited access token baked into it.

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
- `src/checklists/registry.test.js` — data-integrity checks that run against the **real** `data.json`/`config.js` files, not fixtures. No duplicate ids *or names* within a checklist, no two checklists sharing a `storageKey`/`syncId`, every `spriteUrl` either a local `/sprites/` path or a full URL, every `dexId` a plausible National Dex number, no box holding more than `boxSize` entries, box numbers running contiguously from 1, no sidebar group that matches zero items, every Home category tag actually present in `categories.js`, generation ranges not overlapping.
- `src/checklists/shadow.test.js` — the Colosseum/XD-specific checks the generic ones can't make: the 51 / 83 / 131 counts the Bulbapedia article states, the non-Shadow exclusives staying out of the `shadow` category, the e-Reader entries still being present, and every Bulbapedia sprite URL being internally valid (see below).
- `src/engine/ItemCard.test.jsx` — per-card behavior: the Gigantamax name-stripping and badge, the Shadow badge, the checked-date label, and that one click fires `onToggle` exactly once.
- `src/engine/ChecklistPage.test.jsx` — the big one. Renders the whole page against small fake checklists and covers box navigation, search (including jump-to-box and the ×/Escape clears), the All/Caught/Not Caught filters, the password lock, Select All / Unselect All / Undo, localStorage persistence, the group sidebar, and that boxless checklists render no box controls at all.

**The offline sprite-URL check** is worth calling out, since it looks like it should need the network and doesn't. Bulbapedia's archive serves every file from a path derived from the MD5 of its own filename — `/media/upload/<md5[0]>/<md5[0..1]>/<filename>` — so a URL can be proved correct (or dead) with nothing but `node:crypto`. `shadow.test.js` recomputes the hash for every Colosseum and XD sprite and fails with the exact expected path if one doesn't line up. A second test checks the dex number embedded in each sprite filename still matches that entry's `dexId`, which is what stops an entry drifting into being named one Pokémon, numbered a second and pictured a third.

Adding a checklist to `src/checklists/index.js` gets covered by `registry.test.js` automatically — no test file changes needed for that part.

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

Colosseum and XD don't have the scripts either — their boxes are just the article's row order chopped into thirties, so a plain sequential fill is all they need. `registry.test.js` is what guards that (no box over 30, no gaps in the numbering), rather than a script you have to remember to rerun.

## Self-hosting sprites & other images

Every sprite in every checklist's `data.json`, plus the hub/checklist icons and the hub background, is currently hotlinked from other sites (see "Image sources" below) rather than self-hosted in `public/`. Two scripts move that over to local files, in two deliberate steps:

1. **`node scripts/download-sprites.mjs`** — reads every checklist's `data.json`, downloads each `spriteUrl` it finds, and saves it to `public/sprites/<checklist-id>/<original-filename>`. **You don't need to create that folder yourself** — the script creates `public/sprites/` (and one subfolder per checklist) automatically the first time it runs. Nothing about this runs on its own — there's no build step, git hook, or CI job that triggers it; you run it yourself, by hand, whenever you want to pull down whatever's currently hotlinked. It's also safe to re-run any time (e.g. after adding new Pokémon to a `data.json`): it skips anything it's already downloaded, so a re-run only fetches what's new.
2. **`node scripts/use-local-sprites.mjs`** — run this only after step 1, and after you've actually looked through `public/sprites/` to confirm the images downloaded correctly. This rewrites each `data.json`'s `spriteUrl` fields to point at the local copy instead of the original hotlinked URL — but only for files it can actually find locally, so a failed/skipped download just keeps its original working URL rather than breaking.

Both are plain Node scripts (`node <path>`), not npm scripts, and both need to run somewhere with normal internet access — some of the source sites (PokémonDB, Serebii, the wixmp-hosted DeviantArt links) block requests from sandboxed or datacenter environments, which is why this is a manual step you run yourself (your own machine, or a Codespace) rather than something automated in CI.

Running step 1 will pull down the 137 Colosseum/XD menu sprites into `public/sprites/colluseum/` and `public/sprites/xd/`. Once step 2 rewrites those to local paths, the MD5 check in `shadow.test.js` skips them automatically — there's no hash left to verify once a URL is a local path, and the test only looks at URLs still pointing at Bulbapedia.

## Cloud sync setup

Every checklist shares one Firebase Realtime Database, each at its own path — so unlike a per-checklist-bin setup, adding a new checklist needs no new sync setup at all, just one more `syncId` in that checklist's `config.js`.

1. Free project at [console.firebase.google.com](https://console.firebase.google.com) (the free Spark plan is enough) — Build → Realtime Database → Create Database, any region
2. Copy the database URL it gives you (looks like `https://your-project-default-rtdb.firebaseio.com`)
3. Local dev: add it to the same `.env.local` as the password, as `VITE_FIREBASE_DB_URL=https://...`
4. Live site: add it as a `FIREBASE_DB_URL` secret in the repo's GitHub Actions settings
5. In the Rules tab, paste `{ "rules": { ".read": true, ".write": true } }` — wide open on purpose, since this is a personal checklist with nothing sensitive in it and only ever one person (me) using it. Anyone who found the database URL could read or overwrite it, though — worth tightening (or moving to a real backend) if that ever stops being an acceptable trade-off.

If `VITE_FIREBASE_DB_URL` isn't set, every checklist just saves locally only — nothing breaks, it just won't follow you across devices until it's set up. One database URL covers every checklist, so there's only ever this one thing to configure, regardless of how many checklists exist.

## Known issues

- Gigantamax cards, the USUM icon, and the hub's own background image are all currently hotlinked to DeviantArt via a temporary wixmp CDN token — see "Image sources" below, and "Self-hosting sprites & other images" above for the fix.
- The Colosseum and XD hub icons are **stand-ins**, not real game logos — they're Umbreon's Colosseum menu sprite and Shadow Lugia's XD menu sprite respectively. They're deliberately the same kind of Bulbapedia archive URL as every sprite in those lists, so they're verifiably correct rather than another token-bearing hotlink, but at 42×42 they're small for a hub row. Worth replacing with proper logos in `public/icons/` when there's time.

## Recently fixed

- **The Colosseum list had six wrong dex numbers** when it first landed — Noctowl (163→164), Flaaffy (179→180), Furret (161→162), Ledian (165→166), Hitmontop (257→237) and Swablu (276→**333**). Most were off-by-ones onto the pre-evolution; Swablu's was unrelated entirely. It was also missing six entries (Smeargle, Ursaring, Shuckle, Togetic, Togepi, Mareep) and had all 48 entries crammed into box 1 despite `boxSize: 30`. The whole file was rebuilt from Bulbapedia, and `registry.test.js` now has checks that would have caught every one of those.
- **`checkPassword` returned `true` on a fresh clone.** With no `.env.local`, `EDIT_PASSWORD` was `undefined`, so `checkPassword(undefined)` was `undefined === undefined` — i.e. a successful unlock on a site with no password set at all. `lock.test.js` had been failing on exactly this and was right to. Fixed with an explicit guard.
- **Five Pokémon GO entries had the wrong name.** In each case the `dexId` and the sprite filename agreed on one species while the name had been copy-pasted from the row above: Buneary, Turtwig (×2) and Rapidash were labelled as Happiny, Chimchar and Ponyta, and two genuinely different Pikachu party hats shared a single name. Renamed by `id`, so no saved progress moved. `registry.test.js`'s duplicate-name check is what surfaced these.

## Still to do

- **Pokémon GO's `data.json` is a work in progress** — lots of costume Pokémon added so far.
- **Ultra Sun & Ultra Moon's `data.json` is a 3-entry placeholder** — plan is to build it around transferable Pokémon rather than a full regional dex from scratch.
- **XD's non-Shadow exclusives** aren't in its list yet. If you want parity with how Colosseum handles Espeon/Umbreon/Ho-Oh, the XD equivalents are the Eevee you start with and the Johto starter you get for clearing Mt. Battle. Copy `colluseum/categories.js` and its `groupSets` block to add them.
- Replace the two GameCube hub icons with real logos (see "Known issues").

## Image sources

None of the artwork or sprites in this project are mine — all hotlinked from other sites for now, most not yet self-hosted (see the "self-hosting" note above for why that's worth doing eventually).

- **Pokémon sprites** (Home, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold checklists) — [PokémonDB](https://pokemondb.net)
- **Pokémon GO costume/seasonal variant sprites** — [Serebii.net](https://www.serebii.net)
- **Colosseum & XD menu sprites**, plus both of those checklists' hub icons — [Bulbagarden Archives](https://archives.bulbagarden.net), the media host behind [Bulbapedia](https://bulbapedia.bulbagarden.net). Bulbapedia content is [CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/).
- **Pokémon Home hub icon** — Google Play Store listing image
- **Pokémon GO hub icon** — [Pokémon GO Wiki](https://pokemongo.fandom.com) (Fandom)
- **Soul Silver/Heart Gold hub icon** — [jklaczpokemon.com](https://jklaczpokemon.com)
- **Ultra Sun/Ultra Moon hub icon** — DeviantArt, via a temporary wixmp CDN link (needs replacing — see "Known issues")
- **Gigantamax badge** (Pokémon Home cards) — fan art by DeviantArt user jormxdos, via a temporary wixmp CDN link (currently hotlinked as a placeholder — see the note in `styles.css`)
- **Hub background image** — "Drawing Every Pokémon Ever" by DeviantArt user ccayco, via a temporary wixmp CDN link

Three of these (the USUM icon, the Gigantamax badge, and the hub background) are DeviantArt links with a time-limited access token baked into the URL — they're likely to stop working on their own at some point regardless of anything else changing, independent of any copyright question. Worth downloading and self-hosting all three in `public/` when there's time, same as anything else linked here long-term.