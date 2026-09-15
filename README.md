# My Checklists

Started as a single page to check off every Pokémon I've caught. It's now a hub that holds several independent checklists — Pokémon Home, Pokémon GO, Ultra Sun/Ultra Moon, and Soul Silver/Heart Gold so far — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist. Progress is stored in one shared Firebase database.

## How this differs from other trackers

This list is something more personally tailored to myself. I wanted to not just be bound by base forms in Pokémon Home, or not include N's Pokémon, or leave out the one Spiky-eared Pichu from HGSS. I wanted to mark that I've caught EVERY SINGLE POKÉMON POSSIBLE — starting with all the sprite differences, and then maybe in the future going for the ultra rares, like Japan birthday Pokémon or rarer events.

## How it's structured

- `src/App.jsx` — just wires up routing: a hub page, plus one route per checklist. Doesn't know anything about Pokémon (or any specific checklist) at all anymore.
- `src/HubPage.jsx` — the landing page (`/`). A centered, stacked list — one row per checklist, each with its own icon, accent color, and progress bar, linking into that checklist.
- `src/hubConfig.js` — the hub's own settings: its title, and an optional background image.
- `src/engine/` — the shared, checklist-agnostic engine every checklist page actually renders through: box grid (or flat list), search, filters, select-all/undo, the group-progress sidebars, the password lock, and cloud sync all live here.
  - `ChecklistPage.jsx` — the main page component
  - `ItemCard.jsx` — one clickable tile
  - `GroupProgress.jsx` — one progress-bar sidebar list (shared by every group set a checklist defines — Pokémon Home's Generation and Category sidebars are two instances of this same component, not two copies of similar code)
  - `lock.js` — the password check
  - `sync.js` — cloud sync via Firebase Realtime Database's REST API, one shared database, one path per checklist
- `src/checklists/` — one folder per checklist. `index.js` is the registry — add one line here per new checklist.
  - `home/` — Pokémon Home: `config.js`, `data.json`, `generations.js`, `categories.js`, `scripts/`
  - `go/` — Pokémon GO: boxless (no box system, since the real game doesn't have one either)
  - `usum/` — Ultra Sun & Ultra Moon: same shape as Home, currently a placeholder (see below)
  - `soulsilver/` — Soul Silver & Heart Gold: same shape as Home, currently a placeholder (see below)

Adding a new checklist means copying the shape of `src/checklists/home/`, writing its `config.js`, and adding one line to `src/checklists/index.js` — nothing in `src/engine/` needs to change.

## What it does

- Hub page: a centered vertical list, one row per checklist, each with its own icon and accent color (see "Icons, colors, and background image" below) and a progress bar. A checklist with fewer than 10 entries shows "🚧 Still being built" instead of a percentage, since something like "0 / 3 (0%)" reads as broken rather than "not built out yet"
- Every item shows up as a card in a grid — click it (or its checkbox) to mark caught/not caught
- Checking something **stamps the date it was checked**, shown as a small label in the corner of the card. Unchecking removes it entirely (no history kept — if you want to backdate or restore something, that's a database-level edit)
- **Select All** / **Unselect All** buttons act on everything currently visible (the current box, or the current filtered list for a boxless checklist), both with a confirmation showing exactly how many items are affected, and both disable themselves when there's nothing to do
- After a Select All / Unselect All, an **Undo banner** appears for a few seconds — reverts that one bulk action back to exactly how things were, in case of a misclick. It clears itself the moment you make any other change, so it can never revert the wrong thing
- Search bar (name or number) has a clear (×) button, and Escape clears it too — jumps to the right box for boxed checklists, or filters the flat list directly for boxless ones
- Filter buttons: All / Caught / Not Caught, with an empty-state message ("No matches for that search," "Everything here is already caught," etc.) instead of a silently blank grid
- Most checklists use 30-per-box (6×5) grids with Previous/Next and a "jump to box #" field, same as the games' PC boxes
- **Pokémon GO has no boxes** — it's one flat, searchable list instead, since the actual game doesn't have a box system. Clicking a sidebar group (once GO has any set up) narrows the list instead of jumping to a box
- Left sidebar: one progress-bar list per "group set" a checklist defines (Pokémon Home has Generation and Category) — click a row to jump to it. Checklists with no group sets defined (SoulSilver, GO, USUM currently) skip the sidebar entirely and center the content instead of leaving a dead gap
- Gigantamax cards (Pokémon Home) get a small badge instead of spelling "Gigantamax" out in the name every time — currently hotlinked to an external image as a placeholder; swap it for a self-hosted `public/icons/gmax-badge.png` when there's time (see the note in `styles.css`)
- Shadow Pokémon cards get a small badge and a subtle purple glow on the sprite
- Locked by default so random clicks don't change anything — one password unlocks editing across every checklist for the rest of the browser tab
- Progress saves to the browser automatically, under its own storage key per checklist
- Cloud sync through Firebase Realtime Database — one shared database for every checklist. If a sync push ever fails, a Retry button shows up right next to the error instead of needing a page reload
- Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`

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

**Deployment note:** `vite.config.js`'s `base` needs to match your actual GitHub repo name exactly (currently `/PokemonChecklist/`). `App.jsx`'s router `basename` reads this automatically now, so there's only ever one place to update it. That subpath only applies during `npm run build` — `npm run dev` stays at the plain root, since forcing the dev server under a subpath was causing 404s (most setups, including a GitHub Codespaces forwarded preview URL, open the dev server at its root). `vite.config.js` also sets `server.host: true` so Codespaces' port forwarding can actually reach the dev server.

## The password lock

Editing is locked until you type a password in. It's not real security — since this is a static site with no backend, a determined person could still dig the password out of the code if they really wanted to. It's mainly there so nothing changes by accident. One password unlocks every checklist. This is a single-user personal tool, not something built for multiple people to log in separately — one shared password and one shared database is the right amount of complexity for that.

To set your own password:
- Local dev: copy `.env.local.example` to `.env.local` and fill it in
- Live site: add it as a `PASSWORD` secret in the repo's GitHub Actions settings

## How the boxes are organized (boxed checklists)

Every item in a boxed checklist's `data.json` has a `boxId` already baked in. To change where a box starts, add a break point to that checklist's `assignBoxes.mjs` and rerun it — no need to hand-edit every entry:

```
node src/checklists/home/scripts/assignBoxes.mjs
```

Same idea for categories — `assignCategories.mjs` tags each item automatically based on naming conventions explained in the comment at the top of that file:

```
node src/checklists/home/scripts/assignCategories.mjs
```

Pokémon GO doesn't have either script — it's boxless, and category tagging hasn't been needed there yet (its ids are hand-assigned decimals grouping variants near their base species, e.g. all the Pikachu costumes near `25.x` — see "Known issues" below for a gotcha with that scheme).

## Cloud sync setup

Every checklist shares one Firebase Realtime Database, each at its own path — so unlike a per-checklist-bin setup, adding a new checklist needs no new sync setup at all, just one more `syncId` in that checklist's `config.js`.

1. Free project at [console.firebase.google.com](https://console.firebase.google.com) (the free Spark plan is enough) — Build → Realtime Database → Create Database, any region
2. Copy the database URL it gives you (looks like `https://your-project-default-rtdb.firebaseio.com`)
3. Local dev: put it in `.env.local` as `VITE_FIREBASE_DB_URL` (see `.env.local.example`)
4. Live site: add it as a `FIREBASE_DB_URL` secret in the repo's GitHub Actions settings
5. In the Rules tab, paste `{ "rules": { ".read": true, ".write": true } }` — wide open on purpose, since this is a personal checklist with nothing sensitive in it and only ever one person (me) using it. Anyone who found the database URL could read or overwrite it, though — worth tightening (or moving to a real backend) if that ever stops being an acceptable trade-off.

If `VITE_FIREBASE_DB_URL` isn't set, every checklist just saves locally only — nothing breaks, it just won't follow you across devices until it's set up. One database URL covers every checklist, so there's only ever this one thing to configure, regardless of how many checklists exist.

## Known issues

- **Pokémon GO has 3 duplicate `id` values** as of the last data pass: `25.0039` (Green Balloon Pikachu / Purple Shirt Pikachu), `25.0062` (Black Balloon Pikachu / Captain Pikachu), and `25.0094` (Cosmog Spacesuit Pikachu / World Championships 2026 Pikachu). Two entries sharing one id means checking either one shows both as checked, and React will complain about duplicate list keys. Needs a manual renumber of one entry in each pair — the decimal scheme itself is fine (safe, since nothing does math on `id`, only exact comparisons), this is just a handful of accidental collisions from the data entry itself.
- Gigantamax cards, the USUM icon, and the hub's own background image are all currently hotlinked to DeviantArt via a temporary wixmp CDN token — see "Image sources" below.

## Still to do

- **Pokémon GO's `data.json` is a work in progress** — lots of costume Pokémon added so far (see "Known issues" above for the one data problem to fix).
- **Ultra Sun & Ultra Moon's `data.json` is a 3-entry placeholder** — plan is to build it around transferable Pokémon rather than a full regional dex from scratch.
- **Soul Silver & Heart Gold's `data.json` is a 1-entry placeholder** (just the special event Spiky-eared Pichu).
- **GameCube games** — eventually add Pokémon Colosseum/XD as their own checklist(s), largely to track Shadow Pokémon.
- `src/checklists/home/missing.text` is a scratch list of Pokémon not yet added to that checklist's `data.json`.

## Image sources

None of the artwork or sprites in this project are mine — all hotlinked from other sites for now, most not yet self-hosted (see the "self-hosting" note above for why that's worth doing eventually).

- **Pokémon sprites** (Home, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold checklists) — [PokémonDB](https://pokemondb.net)
- **Pokémon GO costume/seasonal variant sprites** — [Serebii.net](https://www.serebii.net)
- **Pokémon Home hub icon** — Google Play Store listing image
- **Pokémon GO hub icon** — [Pokémon GO Wiki](https://pokemongo.fandom.com) (Fandom)
- **Soul Silver/Heart Gold hub icon** — [jklaczpokemon.com](https://jklaczpokemon.com)
- **Ultra Sun/Ultra Moon hub icon** — DeviantArt, via a temporary wixmp CDN link (needs replacing — see "Known issues")
- **Gigantamax badge** (Pokémon Home cards) — fan art by DeviantArt user jormxdos, via a temporary wixmp CDN link (currently hotlinked as a placeholder — see the note in `styles.css`)
- **Hub background image** — "Drawing Every Pokémon Ever" by DeviantArt user ccayco, via a temporary wixmp CDN link

Three of these (the USUM icon, the Gigantamax badge, and the hub background) are DeviantArt links with a time-limited access token baked into the URL — they're likely to stop working on their own at some point regardless of anything else changing, independent of any copyright question. Worth downloading and self-hosting all three in `public/` when there's time, same as anything else linked here long-term.