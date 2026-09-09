// Talks to JSONBin.io (a free "just store some JSON somewhere" service) so
// a checklist's progress can follow you between browsers and devices,
// instead of being stuck in just one browser's localStorage.
//
// One JSONBin account can hold one bin per checklist — each checklist's
// own bin id comes in through its config (config.jsonBinId), so adding a
// new checklist just means creating one more bin, not more code here.
//
// SETUP (one-time, by hand, per checklist):
//   1. Make a free account at https://jsonbin.io
//   2. On the API Keys page, copy your "X-Master-Key"
//   3. Create one bin per checklist (from the dashboard, "Create Bin")
//      with this content: {"caughtIds": []}
//      Copy the Bin ID shown for it into that checklist's config.js.
//   4. Put the key in .env.local for local dev:
//        VITE_JSONBIN_KEY=your-master-key
//      ...and as a GitHub Actions secret (same name) for the deployed site.
//
// If the key or a checklist's bin id is missing, sync just quietly turns
// itself off for that checklist and it falls back to saving in this
// browser only — nothing breaks.
//
// Heads up: same story as the edit password — this key has to live in the
// browser's code for this to work with no backend server, so a determined
// person could technically find it and mess with saved data. Since this is
// just personal checklists and not sensitive info, that's a trade-off
// worth making for the convenience. If that ever changes, swapping this
// out for a real backend is the fix.

const JSONBIN_KEY = import.meta.env.VITE_JSONBIN_KEY

export function isSyncEnabled(jsonBinId) {
  return Boolean(JSONBIN_KEY && jsonBinId)
}

// Gets the checked-item list currently saved in the cloud for one
// checklist's bin. Returns an array of ids, or null if something went
// wrong (sync is off, no internet, JSONBin is down, etc) — the caller
// should just keep using whatever's saved locally in that case.
export async function fetchIdsFromCloud(jsonBinId) {
  if (!isSyncEnabled(jsonBinId)) return null

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY },
    })
    if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`)

    const data = await res.json()
    return Array.isArray(data.record.caughtIds) ? data.record.caughtIds : []
  } catch (err) {
    console.warn('Could not load the cloud save — using the local save instead.', err)
    return null
  }
}

// Pushes the current checked-item list up to a checklist's cloud bin.
// Doesn't throw — if it fails, progress is still safe in localStorage, it
// just won't be on other devices until the next successful sync.
export async function pushIdsToCloud(jsonBinId, ids) {
  if (!isSyncEnabled(jsonBinId)) return false

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
      },
      body: JSON.stringify({ caughtIds: [...ids] }),
    })
    if (!res.ok) throw new Error(`JSONBin update failed: ${res.status}`)
    return true
  } catch (err) {
    console.warn('Could not save to the cloud — progress is still saved locally.', err)
    return false
  }
}
