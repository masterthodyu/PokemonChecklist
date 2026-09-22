// Uses small hand-built fake checklists rather than the real data.json
// files, so these stay fast and independent of exactly how many Pokémon
// are in any real checklist. registry.test.js covers the real data;
// this file covers HubPage's own rendering logic.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HubPage from './HubPage.jsx'

// The real hubConfig.js currently sets collectionLabel to '' (hidden) —
// see that file's own comment — so there's nothing for the test below to
// find without a stub. This mock supplies a real value just for this file.
vi.mock('./hubConfig.js', () => ({
  HUB_CONFIG: {
    title: 'Test Hub',
    collectionLabel: 'Test Collection Label',
    backgroundImage: null,
  },
}))

const finishedChecklist = {
  id: 'test-finished',
  title: 'Test Finished Checklist',
  path: '/test-finished',
  icon: null,
  data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
  storageKey: 'test-finished-key',
  syncId: 'test-finished',
}

const placeholderChecklist = {
  id: 'test-placeholder',
  title: 'Test Placeholder Checklist',
  path: '/test-placeholder',
  icon: null,
  placeholder: true,
  data: [{ id: 1 }, { id: 2 }],
  storageKey: 'test-placeholder-key',
  syncId: 'test-placeholder',
}

function renderHub(checklists) {
  return render(
    <MemoryRouter>
      <HubPage checklists={checklists} />
    </MemoryRouter>
  )
}

describe('HubPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the collection label above the overall progress bar', () => {
    renderHub([finishedChecklist])
    // This is the exact regression this test exists for: the label used
    // to be missing, then the card it sits in was too faint to see.
    expect(screen.getByText('Test Collection Label')).toBeInTheDocument()
    expect(screen.getByText('Overall completion')).toBeInTheDocument()
  })

  it('excludes placeholder checklists from the overall total', () => {
    const { container } = renderHub([finishedChecklist, placeholderChecklist])
    const overallCard = container.querySelector('.overall-status')
    // finishedChecklist has 4 entries; placeholderChecklist's 2 should
    // NOT be added in, or this would read "0 / 6".
    expect(within(overallCard).getByText(/0 \/ 4 caught/)).toBeInTheDocument()
  })

  it('shows "Still being built" instead of a percentage for a placeholder checklist', () => {
    renderHub([placeholderChecklist])
    expect(screen.getByText(/Still being built/)).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  it('does not render the overall progress card at all when every checklist is empty', () => {
    const emptyChecklist = { ...finishedChecklist, data: [] }
    const { container } = renderHub([emptyChecklist])
    expect(container.querySelector('.overall-status')).toBeNull()
  })

  it('reads already-checked counts from localStorage and reflects them in both the row and the overall bar', () => {
    localStorage.setItem(
      finishedChecklist.storageKey,
      JSON.stringify([
        { id: 1, date: '2026-01-01T00:00:00.000Z' },
        { id: 2, date: null },
      ])
    )
    const { container } = renderHub([finishedChecklist])

    const overallCard = container.querySelector('.overall-status')
    expect(within(overallCard).getByText('50%')).toBeInTheDocument()
    expect(within(overallCard).getByText(/2 \/ 4 caught/)).toBeInTheDocument()

    const row = screen.getByText('Test Finished Checklist').closest('.hub-row')
    expect(within(row).getByText('2 / 4 caught')).toBeInTheDocument()
  })

  it('ignores unparseable localStorage data instead of crashing the page', () => {
    localStorage.setItem(finishedChecklist.storageKey, '{not valid json')
    // Scoped to the overall card specifically — both it and the per-game
    // row below render a "0 / 4 caught"-shaped string, so an unscoped
    // getByText here would ambiguously match both.
    const { container } = renderHub([finishedChecklist])
    const overallCard = container.querySelector('.overall-status')
    expect(within(overallCard).getByText(/0 \/ 4 caught/)).toBeInTheDocument()
  })
})