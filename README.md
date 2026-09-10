# My Checklists

Started as a single page to check off every Pokémon I've caught. It's now a hub that holds several independent checklists — Pokémon Home, Pokémon GO, and Ultra Sun/Ultra Moon so far — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist.

## How it's structured

- `src/App.jsx` — just wires up routing: a hub page, plus one route per checklist. Doesn't know anything about Pokémon (or any specific checklist) at all anymore.
- `src/HubPage.jsx` — the landing page (`/`). A centered, stacked list — one row per checklist, each with its own icon and progress bar, linking into that checklist.
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

Adding a new checklist means copying the shape of `src/checklists/pokemon/`, writing its `config.js`, and adding one line to `src/checklists/index.js` — nothing in `src/engine/` needs to change.

## What it does

- Hub page: a centered vertical list, one row per checklist, each with an icon (see "Icons" below) and a progress bar
- Every item shows up as a card in a grid — click it (or its checkbox) to mark caught/not caught
- **Select All** button marks everything currently visible as caught in one click — the current box for a boxed checklist, or the current filtered list for a boxless one
- Most checklists use 30-per-box (6×5) grids with Previous/Next and a "jump to box #" field, same as the games' PC boxes
- **Pokémon GO has no boxes** — it's one flat, searchable list instead, since the actual game doesn't have a box system. Clicking a sidebar group (once GO has any set up) narrows the list instead of jumping to a box
- Search bar (name or number) jumps to the right box, or filters the flat list directly for boxless checklists
- Filter buttons: All / Caught / Not Caught
- Left sidebar: one progress-bar list per "group set" a checklist defines (Pokémon Home has Generation and Category) — click a row to jump to it
- Gigantamax cards (Pokémon Home) get a small badge instead of spelling "Gigantamax" out in the name every time
- Locked by default so random clicks don't change anything — one password unlocks editing across every checklist for the rest of the browser tab
- Progress saves to the browser automatically, under its own storage key per checklist
- Cloud sync through JSONBin.io, one bin per checklist — see setup steps below
- Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`

## Icons (hub) and background image

Each checklist's `config.js` has an `icon` field — just point it at an image path and drop the actual file in `public/icons/`. No icon set? The hub shows a plain placeholder box instead, so nothing looks broken while you're still deciding.

The hub itself can have a background image too — set `backgroundImage` in `src/hubConfig.js` to a path, and drop that file in `public/`. Leave it `null` and the hub just keeps its plain dark background. Either way, text stays readable — there's a dark overlay under whatever background image gets set.

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

**Deployment note:** `vite.config.js`'s `base` and `App.jsx`'s router `basename` both need to match your actual GitHub repo name exactly (currently set to `/PokemonChecklist/` — update both together if the repo ever gets renamed, or links will 404 on the live site).

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

## Why it's built this way

It's a Vite + React app, hosted for free on GitHub Pages. No real backend — JSONBin.io stands in as a free cloud save per checklist, and the rest is a JSON file per checklist plus your progress in the browser. Simple on purpose.

## Still to do

- **Ultra Sun & Ultra Moon's `data.json` is a 3-entry placeholder**, not the real Alola regional Pokédex — the actual ~400-entry regional dex order needs to be sourced properly (not guessed) before this checklist is usable for real.
- **Pokémon GO's `data.json` currently only covers Gen 1 (Kanto)** — later generations have been added to the game in waves over time, so rather than guess at what's actually available, it's left for deliberate expansion.
- Confirm cloud sync is actually working end-to-end once bins are set up (should work — the code was verified, just needs configuring).
- `src/checklists/pokemon/missing.text` is a scratch list of Pokémon not yet added to that checklist's `data.json`.
- Probably clean up more code as I understand it better.