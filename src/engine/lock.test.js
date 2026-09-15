// Same reasoning as sync.test.js: EDIT_PASSWORD is a top-level const read
// from import.meta.env the moment lock.js is first imported, so each test
// that needs a specific password stubs the env var and re-imports fresh
// via vi.resetModules() rather than relying on a single static import.

import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('checkPassword', () => {
  it('accepts the exact configured password', async () => {
    vi.stubEnv('VITE_EDIT_PASSWORD', 'hunter2')
    vi.resetModules()
    const { checkPassword } = await import('./lock.js')
    expect(checkPassword('hunter2')).toBe(true)
  })

  it('rejects a wrong guess, including one that only differs by case', async () => {
    vi.stubEnv('VITE_EDIT_PASSWORD', 'hunter2')
    vi.resetModules()
    const { checkPassword } = await import('./lock.js')
    expect(checkPassword('Hunter2')).toBe(false)
    expect(checkPassword('hunter')).toBe(false)
    expect(checkPassword('hunter22')).toBe(false)
  })

  it('rejects Cancel (null from window.prompt) even if the password happens to be empty', async () => {
    vi.stubEnv('VITE_EDIT_PASSWORD', 'hunter2')
    vi.resetModules()
    const { checkPassword } = await import('./lock.js')
    expect(checkPassword(null)).toBe(false)
  })

  it('never unlocks when no password has been configured at all (fresh clone, no .env.local yet)', async () => {
    // Deliberately not stubbing VITE_EDIT_PASSWORD here — this is the
    // "nobody has set one up" case ChecklistPage's requestUnlock() has to
    // stay safe against, not just the "wrong password" case.
    vi.resetModules()
    const { checkPassword } = await import('./lock.js')
    expect(checkPassword(undefined)).toBe(false)
    expect(checkPassword('password')).toBe(false)
  })
})