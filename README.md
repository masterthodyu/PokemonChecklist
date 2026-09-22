# DISCLAIMER

This is an unofficial, non-commercial fan project. Pokémon and all related names, images, and data are trademarks and copyrights of Nintendo, Game Freak, Creatures Inc. and The Pokémon Company. This project is not affiliated with, endorsed by, or sponsored by any of them.

# My Pokémon Checklist

This started as a single page to check off every Pokémon I've caught in Pokémon Home. It's grown into a hub of independent checklists — Home, GO, Colosseum, Scarlet & Violet, and half a dozen others — all sharing one lock, one deploy, and one underlying "engine," instead of copy-pasting a whole app per checklist. Progress is stored in one shared Firebase database.

Built with the assistance of Claude. I work on this during night shifts when I get the chance, so apologies in advance for rough edits or the odd discrepancy — software isn't my day job, so I get rusty between sessions. 🌙

### Contents

- [How this differs from other trackers](#how-this-differs-from-other-trackers)
- [What it does](#what-it-does)
- [How it's structured](#how-its-structured)
- [Fusion forms](#fusion-forms)
- [Alpha Pokémon](#alpha-pokémon)
- [The GameCube checklists (Colosseum & XD)](#the-gamecube-checklists-colosseum--xd)
- [Master Dex](#master-dex)
- [Hub title & the overall progress card](#hub-title--the-overall-progress-card)
- [Icons, colors, and background image](#icons-colors-and-background-image)
- [Running it yourself](#running-it-yourself)
- [Automated tests](#automated-tests)
- [The password lock](#the-password-lock)
- [How the boxes are organized](#how-the-boxes-are-organized-boxed-checklists)
- [Self-hosting sprites & other images](#self-hosting-sprites--other-images)
- [Cloud sync setup](#cloud-sync-setup)
- [Image sources](#image-sources)
- [License](#license)

---

## How this differs from other trackers

This is something more personally tailored to me. I didn't want to be bound by just base forms in Pokémon Home, or skip N's Pokémon, or leave out the one Spiky-eared Pichu from HGSS. The goal is to mark that I've caught **every single Pokémon possible** — starting with every sprite difference, and eventually working toward the ultra-rares too, like Japan-only birthday Pokémon or rarer events.

## What it does

- **A central hub** with overall progress plus a card per checklist, each linking into its own page (icons/colors covered [below](#icons-colors-and-background-image)). A checklist marked `placeholder: true` shows "🚧 Still being built" instead of a percentage — "0 / 3 (0%)" reads as broken, not "not built out yet." A genuinely tiny-but-finished list (like the 1-entry HGSS one) still shows a real percentage. A checklist marked `bonus: true` (like [Master Dex](#master-dex)) is the opposite kind of exception — it shows a real percentage, it just never counts toward the hub's own overall total.
- **Every Pokémon is a card** in a grid — click it, or its checkbox, to mark caught / not caught.
- **Checking something stamps the date**, shown as a small label on the card. Unchecking removes it entirely — no history kept, so backdating or restoring something is a database-level edit.
- **Select All / Unselect All** act on everything currently visible (the current box, or the filtered list for a boxless checklist), with a confirmation showing exactly how many items are affected. Both buttons disable themselves when there's nothing to do.
- **An Undo banner** appears for a few seconds after a bulk action, reverting it back exactly. It clears itself the moment anything else changes, so it can never undo the wrong thing.
- **Search** (name or number) has a clear (×) button and an Escape shortcut — jumps to the right box for boxed checklists, or filters the flat list directly for boxless ones.
- **Filters** — All / Caught / Not Caught — with a real empty-state message ("No matches for that search," "Everything here is already caught") instead of a blank grid.
- **30-per-box (6×5) grids** with Previous/Next and a "jump to box #" field, mirroring the games' own PC boxes.
- **A sidebar** per "group set" a checklist defines — Home has Generation and Category; Colosseum has Category — click a row to jump there. Checklists with no group sets skip the sidebar entirely rather than leaving a dead gap. With two or more group sets, only the first (Generation, for Home) gets the left sidebar to itself; everything after it (Category) stacks into a second sidebar on the right instead of both being crammed into one long left-hand column.
- **The search bar lives inside each box's own header row**, next to that box's shown/caught count and Select All/Unselect All — grouped with what it's actually filtering, rather than sitting in its own row above the box controls where it wasn't obviously tied to anything.
- **Gigantamax, Shadow, and Alpha cards** each get a small badge in the same top-left corner of the sprite — a card is never more than one of the three, so there's nothing for the badges to collide with. Shadow Pokémon also get a subtle purple glow on the sprite itself, separate from the badge. Badge detection checks `category` first and only ever falls back to guessing from the name (e.g. "Shadow" appearing in it) when a checklist hasn't set `category` on that item at all — an explicit category always wins, even if it's set to something else entirely. That's what stops Scarlet & Violet's Calyrex (Shadow Rider) from getting a Shadow badge it doesn't deserve just because "Shadow" is part of its own name.
- **Pokémon GO has no boxes** — it's one flat, searchable list, since the game itself has no box system. A "↑ Top" button appears once you've scrolled down a bit, for getting back to the search bar without a long scroll back up — boxed checklists don't need it, since Previous/Next already keeps everything on one screen.
- **Every card is the same size**, regardless of how long its name is — GO in particular has a lot of long costume names ("Bulbasaur (Shedinja Costume)," "Pikachu (World Championships 2025)"). A name that doesn't fit its 2-line box gets its own font size shrunk down (in small steps, down to a floor past which it's better off truncated than tiny) rather than being left to wrap the card taller than its neighbors, so a whole row never ends up lopsided around one long name.
- **A hover tooltip** shows a per-item note when a checklist bothers to set one — "Catch in Red/Blue/Yellow," "Shiny from Black 2/White 2," that kind of thing. It's an optional `note` field in that entry's `data.json`; nothing shows for the (currently, vast majority of) entries that don't have one. Shown on hover or keyboard focus, essentially instantly — it's a real element shown by CSS, not the native `title` attribute, which has a built-in delay and can't be styled.
- **Locked by default.** One password unlocks editing across every checklist for the rest of the browser tab.
- **Progress saves locally**, under its own storage key per checklist, surviving tab close.
- **Cloud sync via Firebase.** A "☁️ Synced" status shows when it *last actually synced*, not just that sync is on. A failed push gets a Retry button right next to the error. On a brand-new device where local storage starts empty, a failed sync shows a louder warning — otherwise "0 caught" plus a quiet sync failure looks identical to actually having lost everything.
- **Auto-deploys to GitHub Pages** via GitHub Actions on every push to `main`.

## How it's structured

- `src/App.jsx` — wires up routing: a hub page, plus one route per checklist. Knows nothing about Pokémon, or any specific checklist.
- `src/HubPage.jsx` — the landing page (`/`): one row per checklist, each with its own icon, accent color, and progress bar.
- `src/hubConfig.js` — the hub's own settings: title, collection label, optional background image.
- `src/engine/` — the shared, checklist-agnostic engine every page actually renders through:
  - `ChecklistPage.jsx` — the main page component
  - `ItemCard.jsx` — the individual clickable Pokémon tile
  - `GroupProgress.jsx` — one sidebar progress list, reused for every group set a checklist defines
  - `lock.js` — the password check
  - `sync.js` — cloud sync via Firebase Realtime Database's REST API
- `src/checklists/` — one folder per checklist. `index.js` is the registry; add one line here per new checklist.

| Folder | Game | What's in it |
|---|---|---|
| `home/` | Pokémon Home | The main list — `config.js`, `data.json`, `generations.js`, `categories.js`, `scripts/`. Contains all base pokémon, gender differences, alternate forms, N's pokémon, Totem pokémon, Gigantimax, and [Alpha pokémon](#alpha-pokémon) |
| `go/` | Pokémon GO | Boxless — one flat list, since the real game has no box system |
| `colosseum/` | Pokémon Colosseum | 54 entries — see [The GameCube checklists](#the-gamecube-checklists-colosseum--xd) |
| `xd/` | Pokémon XD: Gale of Darkness | 83 entries, all Shadow Pokémon — see [The GameCube checklists](#the-gamecube-checklists-colosseum--xd) |
| `hgss/` | HeartGold & SoulSilver | Just the 1 Pokémon that can't transfer out — Spiky-eared Pichu |
| `oras/` | Omega Ruby & Alpha Sapphire | Every non-transferable Cosplay Pikachu |
| `usum/` | Ultra Sun & Ultra Moon | Just the 4 non-transferable Totem Pokémon (using Ultra Sun) |
| `lge/` | Let's Go, Eevee! | Just the 1 non-transferable partner Eevee |
| `lgp/` | Let's Go, Pikachu! | Just the 1 non-transferable partner Pikachu |
| `swsh/` | Sword & Shield | Every Silvally type, plus Black Kyurem, Dusk Mane Necrozma, and Ice Rider Calyrex — see [Fusion forms](#fusion-forms) |
| `legends_arceus/` | Pokémon Legends: Arceus | Just Origin Forme Dialga & Palkia — caught in the old wooden Poké Balls. The regular-ball versions live in Home |
| `sv/` | Scarlet & Violet | Origin Forme Giratina, every Arceus plate, plus White Kyurem, Dawn Wings Necrozma, and Shadow Rider Calyrex — see [Fusion forms](#fusion-forms) |
| `masterdex/` | — (bonus checklist) | Extreme-completionist extras that don't fit anywhere else — see [Master Dex](#master-dex) |

Adding a new checklist means copying the shape of `src/checklists/home/`, writing its `config.js`, and adding one line to `index.js` — nothing in `src/engine/` needs to change.

## Fusion forms

Three Pokémon in the whole Pokédex have a fusion mechanic: Kyurem (Black/White), Necrozma (Dusk Mane/Dawn Wings), and Calyrex (Ice Rider/Shadow Rider). Since a save file can only ever hold one of the two forms at a time, I've split them across two checklists rather than trying to force both into one:

- **`swsh/`** gets Black Kyurem, Dusk Mane Necrozma, and Ice Rider Calyrex
- **`sv/`** gets White Kyurem, Dawn Wings Necrozma, and Shadow Rider Calyrex

All 6 of these are explicitly tagged `category: 'fusion'` in their `data.json` — not for any sidebar grouping (neither checklist has one), but so Shadow Rider Calyrex's own name doesn't accidentally trigger the Shadow Pokémon badge (see "What it does" above for why an explicit category always wins over a name-based guess).

## Alpha Pokémon

Boxes **60–70** are the Legends: Arceus alphas — 320 entries, category `alpha`, its own sidebar row, and the alpha symbol badged onto every card. They're catchable in exactly one game, so they get their own stretch of boxes rather than being scattered next to their normal-sized counterparts.

**What's in scope.** Every Pokémon in the game can be caught as an alpha *except* the 18 Legendaries and Mythicals (Uxie through Darkrai — Hisui dex #225–242), and Alolan Vulpix and Alolan Ninetales, which only ever arrive as a gift or a transfer. That leaves Hisui dex **#001–#224**, which is the first stretch of boxes, in Hisui dex order rather than National — so evolution lines stay together the way the in-game dex shows them.

**Then the variants.** Everything that's a second sprite of a slot already in that run is appended *after* Lucario (#224), still walked in Hisui dex order:

- **Regional duplicates.** Hisuian Sneasel holds dex slot #202 in the main run, since that's the form the game lists there. Johtonian Sneasel is technically a variant *within* the region, so it and its female form sit out in the tail — the same rule would apply to any future regional pair.
- **Gender differences** — 62 of them, from Bidoof ♀ through Abomasnow ♀, mirroring exactly which species the `gender` category already tracks.
- **Form differences** — Burmy and Wormadam's three cloaks each, Shellos and Gastrodon's West/East Sea, and all 27 extra Unown letters (`B`–`Z`, `!`, `?`; plain `Unown` is the `A` form and stays at #142 in the main run). Basculin is White-Striped only in Hisui, so it needs no extra entry.

**Naming.** Every entry ends in `(Alpha)`, which is both what `assignCategories.mjs` matches on and what `ItemCard` strips back out before rendering — the badge says "alpha" already, so 320 cards don't need to spell it. The alpha rule is checked *before* the regional-form ones, so `Hisuian Decidueye (Alpha)` counts as an alpha, not as a Hisuian form. Sprites are reused from each entry's existing non-alpha card, since an alpha looks identical apart from being enormous.

One gap worth knowing about: **Hisuian Sliggoo has no base entry** in this checklist yet, only Hisuian Goodra. Its alpha card hotlinks PokémonDB directly instead of borrowing a local sprite — worth fixing whenever the base entry gets added.

## The GameCube checklists (Colosseum & XD)

**Colosseum — 54 entries.** 51 Shadow Pokémon, plus three Colosseum-exclusive Pokémon that are *not* Shadow: Espeon and Umbreon (Wes's starting pair, tagged `starter`) and the Mt. Battle reward Ho-Oh (tagged `bonus`). Keeping those three out of the `shadow` category is deliberate — it stops them inflating the Shadow count, and stops `ItemCard` giving them a purple glow they haven't earned. The three categories live in `colosseum/categories.js` and drive that page's one sidebar.

**XD — 83 entries, all Shadow.** No `starter`/`bonus` extras and no sidebar — a sidebar with a single group in it would just be a second copy of the header's own progress bar. Entry 76 is Shadow Lugia, the only Pokémon whose appearance actually changes when it turns Shadow, hence its own name and the `249S` sprite rather than a plain Lugia's.

Together the two lists cover **131 unique species**, the figure Bulbapedia's own article states. The overlap is Makuhita, Mareep, and Togepi — the three species snaggable in both games.

Three of Colosseum's 51 (**Togepi, Mareep, and Scizor**) are Japan-only e-Reader snags via the Card e Room. They're on the list on purpose — the whole point here is "every Pokémon possible" — but they're the ones to expect never to tick off on a Western cartridge. `Shadow.test.jsx` has a test that exists specifically to stop future-me from "tidying them up" later.

## Master Dex

A bonus checklist for things that don't fit the "did you catch this species" model at all — specific shinies, specific event- or location-locked forms, matched pairs. Inspired by BirdKeeperToby-style extreme completionism: shiny Haxorus from Black 2/White 2, Red Gyarados from Gold/Silver/Crystal, a matching pair of Spinda, Origin Forme Dialga and Palkia — that kind of thing.

No longer a placeholder — `masterdex/data.json` is a real, growing list now (20 entries as of this writing, added a few at a time as they're actually caught), and `placeholder: true` has been removed from `masterdex/config.js` accordingly.

Three things make this checklist different from every other one:

- **It doesn't count toward the hub's overall completion.** `bonus: true` in `masterdex/config.js` excludes it from that math, since this is an optional extra tier on top of the real dex rather than part of it.
- **Its boxes don't start at 1.** `boxNumberOffset` in `masterdex/config.js` shifts what a box number *displays* as, without touching the underlying `boxId` values in `data.json` — those still run a plain 1, 2, 3… like every checklist, since `Registry.test.jsx` requires that. The offset itself is computed live, right there in `config.js`, as `Math.max` over every `boxId` in Home's own `data.json`, so Master Dex's boxes always pick up exactly where Home's leave off with no fixed number to remember to bump. `ChecklistPage.jsx` is where it actually gets applied — box label, header, and jump-to-box field all add it on the way out, while `boxIndex` stays untouched underneath. Defaults to `0` for every other checklist.
- **Entries can legitimately share a name.** `allowDuplicateNames: true` in `masterdex/config.js` skips `Registry.test.jsx`'s usual duplicate-name check for this list only — several entries here are the same species caught in different specific ways (three separate "Pikachu" entries, for instance), distinguished by the `note` field instead of by cramming the distinction into the name itself. Ids still have to be unique regardless; that check is never skipped for anyone.

`spriteUrl` is a mix right now: most entries reuse an existing sprite from `home/`'s own `public/sprites/home/` folder (no need to download the same sprite twice), a couple of shiny catches hotlink PokémonDB directly, and four of the original starter entries (Shiny Haxorus, the matching Spinda pair, Origin Dialga, Origin Palkia) still point at `sprites/masterdex/...` paths with no real file behind them yet — those still need actual art before they'll render.

Growing this list by hand no longer means picking the next `id` or figuring out which `boxId` has room — `masterdex/scripts/assignBoxes.mjs` does that for you. Add a new entry with just `dexId`, `name`, `spriteUrl` (and `note` if it needs one), no `id`/`boxId` at all, then run:

```
node src/checklists/masterdex/scripts/assignBoxes.mjs
```

It only assigns an id/boxId to what's actually missing one (or colliding with an existing one) — nothing already-correct gets touched or renumbered, so already-checked progress on the rest of the list is never affected.

## Hub title & the overall progress card

`src/hubConfig.js` has a `collectionLabel` field — a small heading shown right above the overall-completion progress bar (separate from `title`, the page's big `<h1>`). Set it to `''` or `null` to hide that line.

The overall-completion card uses the same solid dark-card treatment as the per-checklist rows below it. It used to be a near-transparent tint, which made both the card and its progress bar genuinely hard to see against the hub's background image.

## Icons, colors, and background image

Each checklist's `config.js` has an `icon` field — point it at an image path, and drop the actual file in `public/icons/`. No icon set? The hub shows a plain placeholder box instead, so nothing looks broken while you're still deciding.

A checklist can also set `accentFrom` / `accentTo` (two hex colors) for its own hub-row and progress-bar gradient, instead of the default red-to-yellow. Both optional.

The hub itself can have a background image too — set `backgroundImage` in `hubConfig.js` and drop the file in `public/`. Leave it `null` for the plain dark background. Either way, text stays readable — there's a dark overlay under whatever background gets set. (The hub's own background is `backgrounds/hub.jpg` — self-hosted, not hotlinked, since it was moved local along with everything else in the "Self-hosting" section below.)

**Each individual checklist can have its own background too**, separate from the hub's — set `backgroundImage` in that checklist's own `config.js` (every checklist has this field now, `null` by default) the same way as the hub's: a path to a file in `public/`, or a hotlinked URL. Same dark overlay underneath either way. Unlike the hub's background — which tiles a specific portrait image sideways to fill the width — a checklist's background just scales to cover the page and stays centered, since it needs to look reasonable with whatever image that particular checklist sets, at whatever aspect ratio. Leave it `null` (the default) and that checklist just keeps the same plain dark background every page has always had — nothing to opt into, nothing looks different unless you actually set one.

A general note on images anywhere in this project: self-hosting a file in `public/` (rather than linking straight to someone else's server) is worth the extra step. A hotlinked URL can break on its own if the source site changes something, moves the file, or — like the Gigantamax badge and the alpha badge, currently — the link had a time-limited access token baked in. (The hub background used to be in that same boat — a token-bearing DeviantArt/wixmp link — but it's self-hosted now too; see "Image sources" below.)

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
npm test            # runs the whole suite once
npm run test:watch  # re-runs on file changes
```

Tests also run automatically before every `npm run build` or `npm run dev`.

Built with [Vitest](https://vitest.dev) (config in `vite.config.js`'s `test` block) and [Testing Library](https://testing-library.com/react) for the component tests. Six kinds of tests, none needing Firebase, a real browser, or network access:

- **`src/engine/sync.test.js`, `src/engine/lock.test.js`** — pure-logic tests: checked-id parsing, the Firebase REST calls (`fetch` mocked), and the password check.
- **`src/checklists/Registry.test.jsx`** — data-integrity checks against the *real* `data.json`/`config.js` files, not fixtures: no duplicate ids or names within a checklist, no two checklists sharing a `storageKey`/`syncId`, every `spriteUrl` a local path or a full URL, every `dexId` a plausible dex number, no overfull or gapped boxes, no sidebar group matching zero items, every Home category tag real, generation ranges not overlapping, and any item's optional `note` (see "What it does" above) being a real non-empty string rather than accidentally set to something silently wrong.
- **`src/checklists/Shadow.test.jsx`** — the Colosseum/XD-specific checks the generic ones can't make: the 51/2/1 shadow/starter/bonus split, XD's Shadow Lugia entry, the 131-unique-species figure Bulbapedia states (and that the overlap is exactly Makuhita/Mareep/Togepi), and that both checklists are wired in. Also validates every sprite URL still pointing at Bulbagarden — its archive path is a deterministic MD5 hash of the filename, so a typo'd URL is catchable with `node:crypto` alone — and checks the "Shadow" name fallback against real data (Marshadow doesn't false-positive; GO's own cosmetic "Shadow" costumes do, on purpose).
- **`src/engine/ItemCard.test.jsx`** — per-card behavior: Gigantamax and Alpha name-stripping and badges, the Shadow badge, that an explicit category always wins over a name-based guess (the Calyrex Shadow Rider case), the hover tooltip (renders only when `item.note` is set, nothing for an empty string), the checked-date label, one click firing `onToggle` exactly once.
- **`src/HubPage.test.jsx`** — the hub itself: the collection label renders, placeholder checklists don't count toward the overall total, localStorage counts show up correctly, and bad or missing localStorage data doesn't crash the page.
- **`src/engine/ChecklistPage.test.jsx`** — the big one. Renders a whole page against small fake checklists: box navigation, `boxNumberOffset`, the jump-to-box field (clamping, and committing on blur/Enter rather than every keystroke), search (×/Escape), the All/Caught/Not Caught filters, the password lock, Select All / Unselect All / Undo, localStorage persistence, the group sidebar, and that boxless checklists render no box controls at all.

Adding a checklist to `index.js` is automatically covered by `Registry.test.jsx` — no test file changes needed.

**Deployment note:** `vite.config.js`'s `base` needs to match your GitHub repo name exactly (currently `/PokemonChecklist/`). `App.jsx`'s router `basename` reads this automatically, so it's the one place to update. That subpath only applies during `npm run build` — `npm run dev` stays at the plain root, since forcing the dev server under a subpath caused 404s in most setups, including a GitHub Codespaces forwarded preview URL. `vite.config.js` also sets `server.host: true` so Codespaces' port forwarding can reach it.

## The password lock

Editing is "protected" by a password, mostly to stop accidental clicks. One password unlocks every checklist — this is a single-user personal tool, not something built for separate logins, so one shared password and one shared database is the right amount of complexity.

To set your own:
- **Local dev:** create `.env.local` in the project root with `VITE_EDIT_PASSWORD=whatever-you-want`. Already `.gitignore`d.
- **Live site:** add it as a `PASSWORD` secret in the repo's GitHub Actions settings — `deploy.yml` reads it into `VITE_EDIT_PASSWORD` at build time.

No password configured at all? Editing simply can't unlock — `checkPassword` returns false for everything rather than letting an empty value through.

## How the boxes are organized (boxed checklists)

Every item in a boxed checklist's `data.json` already has a `boxId`. To change where a box starts, add a break point to that checklist's `assignBoxes.mjs` and rerun it — no hand-editing every entry:

```
node src/checklists/home/scripts/assignBoxes.mjs
```

`assignBoxes.mjs` no longer renumbers everything on every run — only an entry with no `id` yet, or one whose `id` collides with an existing one, gets assigned a fresh id; anything already correct is left exactly as-is. That matters because progress is stored keyed by `id`, not by file position: the old renumber-everything behavior meant a bunch of already-checked Pokémon could look unchecked again after any run that changed the file's order. Base-form ids (`id === dexId`) were never touched either way.

[Master Dex](#master-dex) has its own copy of this script (`masterdex/scripts/assignBoxes.mjs`) rather than sharing Home's, since it has no "base form" id space to leave alone — every entry there is its own specific catch, so every id goes through the same check.

Same idea for categories — `assignCategories.mjs` tags each item automatically, based on the naming conventions explained in that file's own header comment:

```
node src/checklists/home/scripts/assignCategories.mjs
```

GO skips both scripts — it's boxless, and its ids are hand-assigned decimals grouping variants near their base species (e.g. every Pikachu costume near `25.x`). Since these are hand-assigned, double-check a new entry's decimal isn't already taken before adding it — two entries sharing an id means checking either one checks both, and React will complain about duplicate list keys.

Colosseum and XD skip the scripts too — their boxes are just the source article's row order, chopped into thirties, so a plain sequential fill is all they need. `Registry.test.jsx` is what guards that (no box over 30, no gaps), rather than a script to remember to rerun.

None of the above is about what a box *displays as* — that's a separate, purely cosmetic layer (`boxNumberOffset`) covered in [Master Dex](#master-dex).

## Self-hosting sprites & other images

Every sprite and icon started out hotlinked (see [Image sources](#image-sources) below). Two scripts move that to local files in `public/`:

1. **`node scripts/download-sprites.mjs`** — downloads every `spriteUrl` in every checklist's `data.json` into `public/sprites/<checklist-id>/`, and every still-external checklist `icon` into `public/icons/<checklist-id>.<ext>`. Creates both folders itself the first time it runs, so there's nothing to set up by hand. Safe to re-run any time — it skips whatever's already downloaded.
2. **`node scripts/use-local-sprites.mjs`** — run this only after step 1, and after actually checking `public/sprites/` downloaded correctly. Rewrites each `data.json`'s `spriteUrl` to the local copy — only for files it can actually find, so a failed download just keeps its original working URL. Doesn't touch `icon:` fields (those live in `config.js`, not JSON) — swap those over by hand once step 1 has printed the local path to use.

Both are plain Node scripts, not npm scripts, and both need normal internet access — some source sites (PokémonDB, Serebii, the wixmp-hosted DeviantArt links) block sandboxed or datacenter IPs, so this is a manual step run from your own machine or a Codespace.

Colosseum's 54 sprites, and every checklist's icon, have already been through both steps. XD's 83 haven't — `xd/data.json` still points straight at Bulbagarden.

## Cloud sync setup

Every checklist shares one Firebase Realtime Database, each at its own path — adding a new checklist needs no new sync setup, just one more `syncId` in its `config.js`.

1. Free project at [console.firebase.google.com](https://console.firebase.google.com) (Spark plan is enough) — Build → Realtime Database → Create Database, any region
2. Copy the database URL (`https://your-project-default-rtdb.firebaseio.com`)
3. **Local dev:** add it to `.env.local` as `VITE_FIREBASE_DB_URL=https://...`
4. **Live site:** add it as a `FIREBASE_DB_URL` secret in the repo's GitHub Actions settings
5. In the Rules tab, paste `{ "rules": { ".read": true, ".write": true } }` — wide open on purpose, since this is a personal checklist with nothing sensitive and only ever one user (me). Anyone with the URL could read or overwrite it, though — worth tightening (or moving to a real backend) if that trade-off ever stops being acceptable.

No `VITE_FIREBASE_DB_URL` set? Everything just saves locally — nothing breaks, it just won't follow you across devices yet.

## Image sources

None of the artwork or sprites here are mine. Most of it is downloaded and self-hosted in `public/` now (see [Self-hosting](#self-hosting-sprites--other-images) above) rather than hotlinked — every checklist's hub icon, and every checklist's sprites except XD's.

| Asset | Source |
|---|---|
| Pokémon sprites (Home, USUM, HGSS) | [PokémonDB](https://pokemondb.net) |
| GO costume/seasonal sprites | [Serebii.net](https://www.serebii.net) |
| Colosseum menu sprites | [Serebii.net](https://www.serebii.net) — self-hosted now |
| XD menu sprites | [Bulbagarden Archives](https://archives.bulbagarden.net) ([CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/)) — still hotlinked |
| Home hub icon | Google Play Store listing image |
| GO hub icon | [Pokémon GO Wiki](https://pokemongo.fandom.com) (Fandom) |
| HGSS hub icon | [jklaczpokemon.com](https://jklaczpokemon.com) |
| USUM hub icon | DeviantArt originally — self-hosted now |
| Colosseum & XD hub icons | Bulbagarden Archives originally — self-hosted now |
| Gigantamax badge (Home) | Fan art by DeviantArt user jormxdos — still hotlinked via a temporary wixmp CDN link |
| Alpha badge (Home) | Fan art by DeviantArt user jormxdos — still hotlinked via a temporary wixmp CDN link |
| Hub background | *Drawing Every Pokémon Ever* by DeviantArt user ccayco — self-hosted now (`backgrounds/hub.jpg`) |

The Gigantamax badge and the alpha badge are still DeviantArt links with a time-limited access token baked in, so unlike a plain hotlink these could stop working on their own even if nothing else changes. Same fix as anything else here still hotlinked: download it, point `public/` at the local copy.

## License

The code itself is MIT-licensed — see `LICENSE`. That covers this project's own code only; it doesn't extend to Pokémon itself (see the disclaimer up top) or to any of the sprites/artwork above, which stay under whatever terms their original sources use.
