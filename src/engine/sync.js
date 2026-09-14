// Talks to Firebase's Realtime Database over its plain REST API — no SDK
// needed, just fetch calls to URLs ending in ".json": a GET reads a path,
// a PUT overwrites it.
//
// SETUP (one-time, by hand):
//   1. console.firebase.google.com -> create a project (free Spark plan).
//   2. Build -> Realtime Database -> Create Database (any region).
//   3. Copy the database URL it gives you (looks like
//      https://your-project-default-rtdb.firebaseio.com) into .env.local
//      as VITE_FIREBASE_DB_URL, and as a FIREBASE_DB_URL secret in GitHub
//      Actions for the deployed site.
//   4. In the Rules tab, paste:
//        { "rules": { ".read": true, ".write": true } }
//      Wide open on purpose — fine for now since this is just a personal
//      checklist with nothing sensitive in it. Anyone with the database
//      URL could read or overwrite it, so this is worth tightening (or
//      moving back to self-hosting) later.
//
// Each checklist gets its own path under the database (config.syncId), so
// adding a checklist needs no new Firebase setup — just a new path under
// the same database.
//
// DATA SHAPE: each checked item is stored as a plain {id, date} record in
// a JSON array — [{"id": 1, "date": "2026-09-13T10:30:00.000Z"}, ...] —
// deliberately NOT as an object keyed by id. Firebase's REST API silently
// turns certain object shapes into arrays on its own (when most of the
// keys look like array indices), which would scramble a keyed structure
// like {"1": "...", "2": "..."} without warning. A plain array of record
// objects has no such ambiguity.

const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL

export function isSyncEnabled(syncId) {
  return Boolean(DB_URL && syncId)
}

// Turns whatever came back from Firebase (or was already in localStorage)
// into a Map of id -> date-it-was-checked (or id -> null if the date
// isn't known, which happens for anything checked before this feature
// existed). Handles the old bare-array-of-ids format too, so nobody's
// existing saved progress breaks when this rolls out. Exported so
// ChecklistPage.jsx can use this same logic for localStorage — one place
// that understands "what shape is this data in," not two.
export function toCheckedMap(raw) {
  if (raw == null) return new Map()
  if (!Array.isArray(raw)) return new Map() // unexpected shape - fail safe to empty

  return new Map(
    raw.map(entry =>
      typeof entry === 'object' && entry !== null
        ? [entry.id, entry.date ?? null]
        : [entry, null] // old format: entry was just a bare id
    )
  )
}

export function fromCheckedMap(map) {
  return [...map].map(([id, date]) => ({ id, date }))
}

// Gets the checked-item list currently saved in the cloud for one
// checklist, as a Map of id -> date. Returns null if something went wrong
// (sync is off, no internet, Firebase is down, etc) — the caller should
// just keep using whatever's saved locally in that case.
export async function fetchIdsFromCloud(syncId) {
  if (!isSyncEnabled(syncId)) return null

  try {
    const res = await fetch(`${DB_URL}/checklists/${syncId}/checkedIds.json`)
    if (!res.ok) throw new Error(`Firebase read failed: ${res.status}`)

    const data = await res.json()
    return toCheckedMap(data)
  } catch (err) {
    console.warn('Could not load the cloud save — using the local save instead.', err)
    return null
  }
}

// Pushes the current checked-item Map up to a checklist's cloud path.
// Doesn't throw — if it fails, progress is still safe in localStorage, it
// just won't be on other devices until the next successful sync.
export async function pushIdsToCloud(syncId, checkedMap) {
  if (!isSyncEnabled(syncId)) return false

  try {
    const res = await fetch(`${DB_URL}/checklists/${syncId}/checkedIds.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fromCheckedMap(checkedMap)),
    })
    if (!res.ok) throw new Error(`Firebase write failed: ${res.status}`)
    return true
  } catch (err) {
    console.warn('Could not save to the cloud — progress is still saved locally.', err)
    return false
  }
}