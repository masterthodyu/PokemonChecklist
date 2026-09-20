// Talks to Firebase's Realtime Database over its REST API — no SDK, just
// fetch calls to URLs ending in ".json" (GET reads a path, PUT
// overwrites it).
//
// SETUP:
//   1. console.firebase.google.com -> new project (free Spark plan)
//   2. Build -> Realtime Database -> Create Database (any region)
//   3. Copy the database URL (https://your-project-default-rtdb.firebaseio.com)
//      into .env.local as VITE_FIREBASE_DB_URL, and as a FIREBASE_DB_URL
//      secret in GitHub Actions for the deployed site
//   4. Rules tab, paste: { "rules": { ".read": true, ".write": true } }
//      Wide open on purpose — personal checklist, nothing sensitive.
//      Anyone with the URL could read/write it, so tighten this later if
//      that stops being fine.
//
// Each checklist gets its own path under the database (config.syncId).
//
// Checked items are stored as {id, date} records in a plain JSON array,
// not as an object keyed by id — Firebase's REST API can silently turn
// certain object shapes into arrays (when keys look like array indices),
// which would scramble a keyed structure. A plain array has no such
// ambiguity.

const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL

export function isSyncEnabled(syncId) {
  return Boolean(DB_URL && syncId)
}

// Turns whatever came back from Firebase (or localStorage) into a Map of
// id -> date checked, or id -> null if unknown. Handles the old
// bare-array-of-ids format too. Exported so ChecklistPage/HubPage share
// this one parser instead of drifting apart.
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

// Merges a local checked-id Map with one from the cloud. Never removes
// anything either side has. When both have the same item with different
// dates, keeps the earlier one (the actual first time it was checked).
export function mergeCheckedMaps(localMap, cloudMap) {
  const merged = new Map(localMap)
  for (const [id, cloudDate] of cloudMap) {
    const localDate = merged.get(id)
    if (!merged.has(id)) {
      merged.set(id, cloudDate)
    } else if (localDate == null && cloudDate != null) {
      merged.set(id, cloudDate)
    } else if (localDate != null && cloudDate != null && cloudDate < localDate) {
      merged.set(id, cloudDate)
    }
    // else: keep the local value as-is
  }
  return merged
}

// Gets the checked-item Map for one checklist from the cloud. Returns
// null on failure (sync off, no internet, Firebase down) — caller should
// fall back to local data.
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