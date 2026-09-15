// sync.js reads VITE_FIREBASE_DB_URL as a top-level const the moment the
// module is first imported, so most of these tests stub the env var with
// vi.stubEnv(...) and then vi.resetModules() + a fresh dynamic import()
// to get a copy of the module that actually sees that value. Plain
// `import { x } from './sync.js'` at the top of the file would only ever
// see whatever was set (or not set) the first time any test file loads
// sync.js, which is exactly the kind of test that looks right and then
// silently stops meaning anything.

import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('toCheckedMap / fromCheckedMap', () => {
  it('returns an empty Map for null or undefined (nothing saved yet)', async () => {
    const { toCheckedMap } = await import('./sync.js')
    expect(toCheckedMap(null).size).toBe(0)
    expect(toCheckedMap(undefined).size).toBe(0)
  })

  it('fails safe to an empty Map for an unexpected (non-array) shape', async () => {
    const { toCheckedMap } = await import('./sync.js')
    expect(toCheckedMap({ not: 'an array' }).size).toBe(0)
  })

  it('parses the current {id, date} record format', async () => {
    const { toCheckedMap } = await import('./sync.js')
    const map = toCheckedMap([{ id: 25, date: '2026-01-01T00:00:00.000Z' }])
    expect(map.get(25)).toBe('2026-01-01T00:00:00.000Z')
  })

  it('parses the old bare-id array format, with a null date', async () => {
    const { toCheckedMap } = await import('./sync.js')
    const map = toCheckedMap([1, 2, 3])
    expect(map.get(1)).toBeNull()
    expect(map.get(2)).toBeNull()
    expect(map.get(3)).toBeNull()
  })

  it('treats a record with no date field the same as an explicit null', async () => {
    const { toCheckedMap } = await import('./sync.js')
    const map = toCheckedMap([{ id: 9 }])
    expect(map.get(9)).toBeNull()
  })

  it('round-trips through fromCheckedMap unchanged', async () => {
    const { toCheckedMap, fromCheckedMap } = await import('./sync.js')
    const original = [
      { id: 1, date: '2026-01-01T00:00:00.000Z' },
      { id: 2, date: null },
    ]
    expect(fromCheckedMap(toCheckedMap(original))).toEqual(original)
  })
})

describe('isSyncEnabled', () => {
  it('is false with no database URL configured at all', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', '')
    vi.resetModules()
    const { isSyncEnabled } = await import('./sync.js')
    expect(isSyncEnabled('home')).toBe(false)
  })

  it('is false with a database URL but no syncId for this checklist', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { isSyncEnabled } = await import('./sync.js')
    expect(isSyncEnabled(undefined)).toBe(false)
  })

  it('is true once both a database URL and a syncId are present', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { isSyncEnabled } = await import('./sync.js')
    expect(isSyncEnabled('home')).toBe(true)
  })
})

describe('fetchIdsFromCloud', () => {
  it('returns null instead of throwing when the network request fails', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { fetchIdsFromCloud } = await import('./sync.js')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    await expect(fetchIdsFromCloud('home')).resolves.toBeNull()
  })

  it('returns null instead of throwing on a non-2xx response', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { fetchIdsFromCloud } = await import('./sync.js')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchIdsFromCloud('home')).resolves.toBeNull()
  })

  it('parses a successful response body into a checked-id Map', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { fetchIdsFromCloud } = await import('./sync.js')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 7, date: '2026-02-01T00:00:00.000Z' }],
      })
    )
    const result = await fetchIdsFromCloud('home')
    expect(result.get(7)).toBe('2026-02-01T00:00:00.000Z')
  })

  it('returns null (sync effectively off) when sync is not enabled, without calling fetch at all', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', '')
    vi.resetModules()
    const { fetchIdsFromCloud } = await import('./sync.js')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await fetchIdsFromCloud('home')
    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('pushIdsToCloud', () => {
  it('returns false instead of throwing when the write fails', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { pushIdsToCloud } = await import('./sync.js')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(pushIdsToCloud('home', new Map([[1, null]]))).resolves.toBe(false)
  })

  it('returns true and PUTs the checked-id list as a plain array (not an id-keyed object)', async () => {
    vi.stubEnv('VITE_FIREBASE_DB_URL', 'https://example-default-rtdb.firebaseio.com')
    vi.resetModules()
    const { pushIdsToCloud } = await import('./sync.js')
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    const map = new Map([[1, '2026-01-01T00:00:00.000Z'], [2, null]])
    await expect(pushIdsToCloud('home', map)).resolves.toBe(true)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://example-default-rtdb.firebaseio.com/checklists/home/checkedIds.json')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual([
      { id: 1, date: '2026-01-01T00:00:00.000Z' },
      { id: 2, date: null },
    ])
  })
})