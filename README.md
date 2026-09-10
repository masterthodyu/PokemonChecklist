# My Checklists

Started as a single page to check off every Pokémon I've caught. It's now a hub that holds several independent checklists — Pokémon Home, Pokémon GO, Ultra Sun/Ultra Moon, and Soul Silver/Heart Gold so far — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist.

## How it's structured

- `src/App.jsx` — just wires up routing: a hub page, plus one route per checklist. Doesn't know anything about Pokémon (or any specific checklist) at all anymore.
- `src/HubPage.jsx` — the landing page (`/`). A centered, stacked list — one row per checklist, each with its own icon, accent color, and progress bar, linking into that checklist.
- `src/hubConfig.js` — the hub's own settings: its title, and an optional background image.
- `src/engine/` — the shared, checklist-agnostic engine every checklist page actually renders through: box grid (or flat list), search, filters, select-all, the group-progress sidebars, the password lock, and cloud sync all live here.
  - `ChecklistPage.jsx` — the main page component
  - `ItemCard.jsx` — one clickable tile
  - `GroupProgress.jsx` — one progress-bar sidebar list
  - `lock.js` — the password check
  - `sync.js` — JSONBin.io cloud sync, one bin per checklist
- `src/checklists/` — one folder per checklist. `index.js` is the registry — add one line here per new checklist.
  - `pokemon/` — Pokémon Home: `config.js`, `data.json`, `generations.js`, `categories.js`, `scripts/`
  - `go/` — Pokémon GO: boxless (no box system, since the real game doesn't have one either)
  - `usum/` — Ultra Sun & Ultra Moon: same shape as Home, currently a placeholder (see below)
  - `soulsilver/` — Soul Silver & Heart Gold: same shape as Home, currently a placeholder (see below)

Adding a new checklist means copying the shape of `src/checklists/pokemon/`, writing its `config.js`, and adding one line to `src/checklists/index.js` — nothing in `src/engine/` needs to change.

## What it does

- Hub page: a centered vertical list, one row per checklist, each with its own icon and accent color (see "Icons, colors, and background image" below) and a progress bar
- Every item shows up as a card in a grid — click it (or its checkbox) to mark caught/not caught
- **Select All** button marks everything currently visible as caught in one click — the current box for a boxed checklist, or the current filtered list for a boxless one
- Most checklists use 30-per-box (6×5) grids with Previous/Next and a "jump to box #" field, same as the games' PC boxes
- **Pokémon GO has no boxes** — it's one flat, searchable list instead, since the actual game doesn't have a box system. Clicking a sidebar group (once GO has any set up) narrows the list instead of jumping to a box
- Search bar (name or number) jumps to the right box, or filters the flat list directly for boxless checklists
- Filter buttons: All / Caught / Not Caught
- Left sidebar: one progress-bar list per "group set" a checklist defines (Pokémon Home has Generation and Category) — click a row to jump to it
- Gigantamax cards (Pokémon Home) get a small badge instead of spelling "Gigantamax" out in the name every time — currently hotlinked to an external image as a placeholder; swap it for a self-hosted `public/icons/gmax-badge.png` when there's time (see the note in `styles.css`)
- Locked by default so random clicks don't change anything — one password unlocks editing across every checklist for the rest of the browser tab
- Progress saves to the browser automatically, under its own storage key per checklist
- Cloud sync through JSONBin.io, one bin per checklist — see setup steps below
- Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`

## Icons, colors, and background image

Each checklist's `config.js` has an `icon` field — just point it at an image path and drop the actual file in `public/icons/`. No icon set? The hub shows a plain placeholder box instead, so nothing looks broken while you're still deciding.

A checklist can also set `accentFrom`/`accentTo` (two hex colors) to give its hub row and progress bar their own little gradient instead of the default red-to-yellow. Both are optional — leave them out and the defaults apply.

The hub itself can have a background image too — set `backgroundImage` in `src/hubConfig.js` to a path, and drop that file in `public/`. Leave it `null` and the hub just keeps its plain dark background. Either way, text stays readable — there's a dark overlay under whatever background image gets set.

A general note on images anywhere in this project: self-hosting a file in `public/` (rather than linking straight to someone else's server) is worth the extra step — a hotlinked URL can break on its own if the other site changes something, moves the file, or (as happened once already with the Gigantamax badge) the link had a time-limited access token baked into it.

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

**Deployment note:** `vite.config.js`'s `base` needs to match your actual GitHub repo name exactly (currently `/PokemonChecklist/`). `App.jsx`'s router `basename` reads this automatically now, so there's only ever one place to update it.

## The password lock

Editing is locked until you type a password in. It's not real security — since this is a static site with no backend, a determined person could still dig the password out of the code if they really wanted to. It's mainly there so nothing changes by accident. One password unlocks every checklist.

To set your own password:
- Local dev: copy `.env.local.example` to `.env.local` and fill it in
- Live site: add it as a `PASSWORD` secret in the repo's GitHub Actions settings

## How the boxes are organized (boxed checklists)

Every item in a boxed checklist's `data.json` has a `boxId` already baked in. To change where a box starts, add a break point to that checklist's `assignBoxes.mjs` and rerun it — no need to hand-edit every entry:

```
node src/checklists/pokemon/scripts/assignBoxes.mjs
```

Same idea for categories — `assignCategories.mjs` tags each item automatically based on naming conventions explained in the comment at the top of that file:

```
node src/checklists/pokemon/scripts/assignCategories.mjs
```

## Cloud sync setup (per checklist)

Each checklist that wants cloud sync needs its own JSONBin.io bin, but they all share one master key:

1. Free account at [jsonbin.io](https://jsonbin.io), copy your `X-Master-Key`
2. Create one bin per checklist with `{"caughtIds": []}` as its starting content, and copy its Bin ID into that checklist's `config.js`
3. Local dev: put the master key and each bin id in `.env.local` (see `.env.local.example`)
4. Live site: add the master key as a `JSONBIN_KEY` secret, and each checklist's bin id as its own secret — see `.github/workflows/deploy.yml` for the exact names it expects

If a checklist's bin id (or the master key) isn't set, that checklist just saves locally only — nothing breaks, it just won't follow you across devices until it's set up.

## Still to do

- **Pokémon GO's `data.json` is a work in progress** — a mix of costume/seasonal variants across several generations, still being added to. `id` uses decimals on purpose (`25.01`, `25.02`, ...) to keep all of a species' variants grouped together — with 40+ Pikachu variants alone, that's a reasonable call, and it's safe: nothing in this app does math on `id`, only exact comparisons and storage, so floats won't silently corrupt anything. The one thing worth staying disciplined about is a **consistent number of decimal digits** (the data currently mixes `26.01`, `999.1`, and `25.0001` — numerically `25.1 > 25.01`, so mismatched precision can make sort order and "which number haven't I used yet" harder to track as the list grows). Picking one fixed width (like always 2 digits, `25.01`–`25.99`) would give 99 variant slots per species and keep it predictable long-term — not required, just worth knowing.
- **Ultra Sun & Ultra Moon's `data.json` is a 3-entry placeholder**, not the real Alola regional Pokédex — the actual ~400-entry regional dex order needs to be sourced properly (not guessed) before this checklist is usable for real.
- **Soul Silver & Heart Gold's `data.json` is a 1-entry placeholder** (just the special event Spiky-eared Pichu) — same story, needs the real Johto/National dex order sourced properly.
- Confirm cloud sync is actually working end-to-end once all four bins are set up (should work — the code was verified, just needs configuring).
- `src/checklists/pokemon/missing.text` is a scratch list of Pokémon not yet added to that checklist's `data.json`.
- Probably clean up more code as I understand it better.

## Image sources

None of the artwork or sprites in this project are mine — all hotlinked from other sites for now, most not yet self-hosted (see the "self-hosting" note above for why that's worth doing eventually).

- **Pokémon sprites** (Home, Ultra Sun/Ultra Moon, Soul Silver/Heart Gold checklists) — [PokémonDB](https://pokemondb.net)
- **Pokémon GO costume/seasonal variant sprites** — [Serebii.net](https://www.serebii.net)
- **Pokémon Home hub icon** — Google Play Store listing image
- **Pokémon GO hub icon** — [Pokémon GO Wiki](https://pokemongo.fandom.com) (Fandom)
- **Soul Silver/Heart Gold hub icon** — [jklaczpokemon.com](https://jklaczpokemon.com)
- **Ultra Sun/Ultra Moon hub icon** — DeviantArt, via a temporary wixmp CDN link (needs replacing — see note below)
- **Gigantamax badge** (Pokémon Home cards) — fan art by DeviantArt user jormxdos, via a temporary wixmp CDN link (currently hotlinked as a placeholder — see the note in `styles.css`)

Two of these (the USUM icon and the Gigantamax badge) are DeviantArt links with a time-limited access token baked into the URL — they're likely to stop working on their own at some point regardless of anything else changing, independent of any copyright question. Worth downloading and self-hosting both in `public/` when there's time, same as anything else linked here long-term.