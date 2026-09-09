# Pokémon Checklist

A website where I can check off every Pokémon I've caught. Made because I couldn't find one that did exactly what I wanted, so I built my own with a lot of help from AI along the way (Copilot and Claude, mostly — I'm still learning to code, so if something looks messy, that's why).

Right now it tracks 1340 Pokémon total across 46 boxes, sorted by dex number with a few forced breaks so things stay organized by generation and category.

## What it does

- Every Pokémon shows up as a card you can click to mark caught/not caught
- Boxes hold 30 Pokémon each, same as the games
- Search bar jumps straight to whatever you type (name or dex number)
- Filter by All / Caught / Not Caught
- Left sidebar shows progress bars by generation, and by category (gender variants, form differences, regional forms, etc.)
- Right sidebar lets you jump straight to any generation's box
- Locked by default so I don't accidentally mess up my own progress — there's a password to unlock editing
- Saves your progress in the browser, and (if I ever get around to setting it up) can sync across devices too

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

Editing is locked until you type a password in. It's not real security — since this is just a static site with no backend, a determined person could still dig the password out of the code if they really wanted to. It's mainly there so I don't accidentally uncheck something by clicking around.

To set your own password:
- Local dev: copy `.env.local.example` to `.env.local` and fill it in
- Live site: add it as a `PASSWORD` secret in the repo's GitHub Actions settings

## How the boxes are organized

Every Pokémon in `src/data/pokemon.json` has a `boxId` already baked in. If I ever want to change where a box starts (like keeping a generation's last few Pokémon from spilling into the next box), I don't edit all 1340 entries by hand — I just add a break point to `scripts/assignBoxes.mjs` and run:

```
node scripts/assignBoxes.mjs
```

Same idea for categories (gender, form differences, regional forms, etc.) — each Pokémon has a `category` field, and `scripts/assignCategories.mjs` figures it out automatically based on the name. The comment at the top of that file explains exactly how to name new entries so it tags them right.

## Why it's built this way

It's a Vite + React app, hosted for free on GitHub Pages. No backend, no database (yet) — just a JSON file with every Pokémon in it, and your progress saved in your browser. Simple on purpose, since it's just for me.

## Still to do

- Fill in the Alolan, Hisuian, Totem, and Gigantamax entries (categories are ready for them, the actual Pokémon just aren't added yet)
- Decide on a permanent place to store progress instead of the temporary cloud setup
- Probably clean up more code as I understand it better