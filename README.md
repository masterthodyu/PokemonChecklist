# My Checklists

Started as a single page to check off every Pokémon I've caught. It's now set up so the same site can hold several independent checklists — Pokémon is the first one, with more planned — sharing one lock, one deploy, and one underlying "engine" instead of copy-pasting the whole app for each new checklist.

## How it's structured now

- `src/App.jsx` — just wires up routing: a hub page, plus one route per checklist. Doesn't know anything about Pokémon (or any other checklist) specifically anymore.
- `src/HubPage.jsx` — the landing page (`/`). Lists every checklist with its own progress %, linking into each one.
- `src/engine/` — the shared, checklist-agnostic engine that every checklist page actually renders through: box grid, search, filters, the group-progress sidebars, the password lock, and cloud sync all live here.
  - `ChecklistPage.jsx` — the main page component (used to be `App.jsx`)
  - `ItemCard.jsx` — one clickable tile (used to be `PokemonCard.jsx`)
  - `GroupProgress.jsx` — one progress-bar sidebar list (replaces the old separate `GenProgress.jsx` + `CategoryProgress.jsx`, which were nearly identical)
  - `lock.js` — the password check
  - `sync.js` — the JSONBin.io cloud sync, now per-checklist instead of one global bin
- `src/home/` — one folder per checklist. `src/home/index.js` is the registry — add one line here per new checklist. `src/home/pokemon/` holds everything Pokémon-specific:
  - `config.js` — the one file that wires this checklist into the shared engine (title, box size, storage key, its JSONBin bin id, and how its Generation/Category sidebars are grouped)
  - `data.json` — the Pokémon list itself (renamed from `pokemon.json`)
  - `generations.js`, `categories.js` — the group definitions `config.js` uses
  - `scripts/assignBoxes.mjs`, `scripts/assignCategories.mjs` — the data-fixing scripts, now sitting together instead of split across `scripts/` and a stray `fix box numbers/` folder

Adding a second checklist means copying the shape of `src/home/pokemon/` into a new folder, writing its `config.js`, and adding one line to `src/home/index.js` — no changes needed anywhere in `src/engine/`.

## What it does (currently working)

- Hub page lists every checklist with its own progress %, and links into each one
- Every Pokémon shows up as a card in a grid — click it (or its checkbox) to mark caught/not caught
- Boxes hold 30 Pokémon each, same as the games, with Previous/Next buttons and a "jump to box #" field
- Search bar (name or dex number) jumps to the box that Pokémon is in and highlights it in the grid
- Filter buttons: All / Caught / Not Caught
- Left sidebar, top: progress bars by **Generation** (Kanto through Paldea) — click one to jump to where it starts
- Left sidebar, bottom: progress bars by **Category** (Gender Variants, Form Differences, Alolan/Galarian/Hisuian/Paldean Forms, N's Pokémon, Totem Pokémon, Gigantamax Forms) — click one to jump to it
- Gigantamax cards get a badge and have "Gigantamax" trimmed out of the display name so it's not redundant
- Locked by default so I don't accidentally mess up my own progress — one password (set via env var, not stored in the code) unlocks editing across every checklist for the rest of the tab
- Progress saves to the browser's localStorage automatically on every change, under its own key per checklist
- Cloud sync through JSONBin.io is wired up in the code (per checklist, one bin each) but **not actually working right now** — still debugging it. Everything falls back to localStorage in the meantime, so progress is safe, it just doesn't follow you across devices/browsers yet.
- Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`, pulling the password and each checklist's JSONBin secret in at build time

## A couple of loose ends in the repo right now

- `src/home/pokemon/missing.text` is a scratch list of Pokémon not yet added to `data.json` (move it there alongside `data.json` if it isn't already).
- A handful of code comments (in `assignBoxes.mjs`, `assignCategories.mjs`, `config.js`, `ChecklistPage.jsx`, `App.jsx`) still say "checklists" instead of "home" from before the folder got renamed — harmless, since they're just comments, but worth a find-and-replace pass when convenient.

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

## The password lock

Editing is locked until you type a password in. It's not real security — since this is just a static site with no backend, a determined person could still dig the password out of the code if they really wanted to. It's mainly there so I don't accidentally uncheck something by clicking around. One password unlocks every checklist on the site.

To set your own password:
- Local dev: copy `.env.local.example` to `.env.local` and fill it in
- Live site: add it as a `PASSWORD` secret in the repo's GitHub Actions settings

## How the boxes are organized

Every Pokémon in `src/home/pokemon/data.json` has a `boxId` already baked in. If I ever want to change where a box starts (like keeping a generation's last few Pokémon from spilling into the next box), I don't edit all 1340 entries by hand — I just add a break point to `assignBoxes.mjs` and run:

```
node src/home/pokemon/scripts/assignBoxes.mjs
```

Same idea for categories (gender, form differences, regional forms, etc.) — each Pokémon has a `category` field, and `assignCategories.mjs` figures it out automatically based on the name:

```
node src/home/pokemon/scripts/assignCategories.mjs
```

The comment at the top of that file explains exactly how to name new entries so it tags them right.

## Cloud sync setup (per checklist) — work in progress, not working yet

Each checklist that wants cloud sync needs its own JSONBin.io bin:

1. Make a free account at [jsonbin.io](https://jsonbin.io) and copy your `X-Master-Key`
2. Create one bin per checklist with `{"caughtIds": []}` as its starting content, and copy its Bin ID into that checklist's `config.js` (e.g. `VITE_POKEMON_BIN_ID` for Pokémon)
3. Local dev: put the master key and each bin id in `.env.local`
4. Live site: add the master key as a `JSONBIN_KEY` secret, and each checklist's bin id as its own secret (e.g. `POKEMON_BIN_ID`) — see `.github/workflows/deploy.yml` for the exact names it expects

## Why it's built this way

It's a Vite + React app, hosted for free on GitHub Pages. No real backend — JSONBin.io stands in as a free "just store some JSON somewhere" cloud save per checklist, and the rest is a JSON file per checklist plus your progress in the browser. Simple on purpose. Going forward I'm aiming to keep the code itself simple and easy to follow rather than clever.

## Still to do

- Get JSONBin sync actually working — currently wired up but broken
- Decide on a permanent place to store progress instead of the temporary JSONBin setup
- Clean up the loose ends listed above (leftover comments, scratch file)
- Build the second checklist and make sure the `src/home/` + engine split actually holds up in practice
- Probably clean up more code as I understand it better