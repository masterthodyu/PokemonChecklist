// Talks to JSONBin.io (a free "just store some JSON somewhere" service) so
// your caught-Pokémon list can follow you between browsers and devices,
// instead of being stuck in just one browser's localStorage.
//
// SETUP (one-time, by hand):
//   1. Make a free account at https://jsonbin.io
//   2. On the API Keys page, copy your "X-Master-Key"
//   3. Create one bin (from the dashboard, "Create Bin") with this content:
//        {"caughtIds": []}
//      Copy the Bin ID shown for it.
//   4. Put both values in .env.local for local dev:
//        VITE_JSONBIN_KEY=your-master-key
//        VITE_JSONBIN_BIN_ID=your-bin-id
//      ...and as GitHub Actions secrets (same names) for the deployed site.
//
// If either value is missing, sync just quietly turns itself off and the
// app falls back to saving in this browser only (same as before) — nothing
// breaks.
//
// Heads up: same story as the edit password — this key has to live in the
// browser's code for this to work with no backend server, so a determined
// person could technically find it and mess with your saved data. Since
// this is just a personal Pokémon checklist and not sensitive info, that's
// a trade-off worth making for the convenience. If that ever changes,
// swapping this out for a real backend is the fix.

const JSONBIN_KEY = import.meta.env.VITE_JSONBIN_KEY
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID
const BIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`

export const syncEnabled = Boolean(JSONBIN_KEY && JSONBIN_BIN_ID)

// Gets the caught-list currently saved in the cloud.
// Returns an array of ids, or null if something went wrong (sync is off,
// no internet, JSONBin is down, etc) — the caller should just keep using
// whatever's saved locally in that case.
export async function fetchCaughtIdsFromCloud() {
  if (!syncEnabled) return null

  try {
    const res = await fetch(`${BIN_URL}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY },
    })
    if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`)

    const data = await res.json()
    return Array.isArray(data.record.caughtIds) ? data.record.caughtIds : []
  } catch (err) {
    console.warn('Could not load your cloud save — using the local save instead.', err)
    return null
  }
}

// Pushes the current caught-list up to the cloud. Doesn't throw — if it
// fails, your progress is still safe in localStorage, it just won't be
// on other devices until the next successful sync.
export async function pushCaughtIdsToCloud(caughtIds) {
  if (!syncEnabled) return false

  try {
    const res = await fetch(BIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
      },
      body: JSON.stringify({ caughtIds: [...caughtIds] }),
    })
    if (!res.ok) throw new Error(`JSONBin update failed: ${res.status}`)
    return true
  } catch (err) {
    console.warn('Could not save to the cloud — your progress is still saved locally.', err)
    return false
  }
}