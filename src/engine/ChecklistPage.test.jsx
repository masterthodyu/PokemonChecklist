// The "Checklist.test.js" the README's Still-to-do list has been asking
// for. ChecklistPage is the biggest file in the project and the one every
// checklist renders through, so this covers the behaviours the README's
// "What it does" section promises: box navigation, search, the All/Caught/
// Not Caught filters, the password lock, Select All / Unselect All + Undo,
// and that progress survives a reload via localStorage.
//
// Like HubPage.test.jsx, this builds small fake checklists rather than
// importing the real data.json files — that keeps these fast and stops a
// test failing just because a real list gained an entry. registry.test.js
// and shadow.test.js are where the real data gets checked.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChecklistPage from './ChecklistPage.jsx'

// The real lock reads VITE_EDIT_PASSWORD, which isn't set under `npm test`
// (and shouldn't be — the real password has no business being in the test
// environment). Mocking it gives a known password to type instead.
vi.mock('./lock.js', () => ({
  checkPassword: entered => entered === 'correct-horse',
}))

// isSyncEnabled reads VITE_FIREBASE_DB_URL. Unlike .env.local, a plain
// .env file IS loaded by Vite in test mode — so whether this test sees
// sync as "on" or "off" would otherwise depend on whether whoever is
// running the suite happens to have cloud sync configured for the real
// site. Forcing it off here tests the actual behavior (no cloud UI when
// sync is disabled) instead of testing the runner's own .env file.
// toCheckedMap/fromCheckedMap are kept real — ChecklistPage uses them for
// every localStorage read/write, not just the sync path.
vi.mock('./sync.js', async importOriginal => {
  const actual = await importOriginal()
  return { ...actual, isSyncEnabled: () => false }
})

const PASSWORD = 'correct-horse'

// 35 entries over two boxes of 30, so box navigation has somewhere to go.
function makeItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    dexId: i + 1,
    name: `Testmon${i + 1}`,
    spriteUrl: `/sprites/test/${i + 1}.png`,
    boxId: Math.floor(i / 30) + 1,
    category: i === 0 ? 'shadow' : 'base',
  }))
}

const boxedConfig = {
  id: 'test-boxed',
  title: 'Test Boxed Checklist',
  path: '/test-boxed',
  data: makeItems(35),
  boxSize: 30,
  storageKey: 'test-boxed-key',
  syncId: 'test-boxed',
  groupSets: [],
}

// No boxSize at all -> flat list mode, the way Pokémon GO works.
const boxlessConfig = {
  ...boxedConfig,
  id: 'test-boxless',
  title: 'Test Boxless Checklist',
  path: '/test-boxless',
  boxSize: undefined,
  storageKey: 'test-boxless-key',
  syncId: 'test-boxless',
  data: makeItems(5).map(({ boxId, ...rest }) => rest),
}

const groupedConfig = {
  ...boxedConfig,
  id: 'test-grouped',
  storageKey: 'test-grouped-key',
  syncId: 'test-grouped',
  groupSets: [
    {
      label: 'Category',
      groups: [
        { key: 'shadow', label: 'Shadow' },
        { key: 'base', label: 'Base' },
      ],
      filter: () => true,
      matches: (item, g) => item.category === g.key,
      displayLabel: g => g.label,
    },
  ],
}

function renderPage(config = boxedConfig) {
  return render(
    <MemoryRouter>
      <ChecklistPage config={config} />
    </MemoryRouter>
  )
}

// Types the right password into the next window.prompt.
function unlock() {
  window.prompt = vi.fn(() => PASSWORD)
}

beforeEach(() => {
  localStorage.clear()
  window.prompt = vi.fn(() => null) // "Cancel" unless a test says otherwise
  window.alert = vi.fn()
  window.confirm = vi.fn(() => true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChecklistPage - header and progress', () => {
  it('shows the checklist title and a 0% starting progress line', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Test Boxed Checklist' })).toBeInTheDocument()
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('starts locked', () => {
    renderPage()
    expect(screen.getByText(/Locked — tap to unlock editing/)).toBeInTheDocument()
  })

  it('has a link back to the hub', () => {
    renderPage()
    expect(screen.getByText(/Back to checklists/)).toBeInTheDocument()
  })
})

describe('ChecklistPage - the password lock', () => {
  it('does not toggle an item while locked and the prompt is cancelled', () => {
    const { container } = renderPage()
    fireEvent.click(container.querySelector('.card'))
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('warns and changes nothing when the wrong password is typed', () => {
    window.prompt = vi.fn(() => 'hunter2')
    const { container } = renderPage()
    fireEvent.click(container.querySelector('.card'))
    expect(window.alert).toHaveBeenCalledWith('Incorrect password.')
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('unlocks with the right password and then toggles the item', () => {
    unlock()
    const { container } = renderPage()
    fireEvent.click(container.querySelector('.card'))
    expect(screen.getByText('1 / 35 caught (3%)')).toBeInTheDocument()
    expect(screen.getByText(/Editing unlocked — tap to relock/)).toBeInTheDocument()
  })

  it('only asks for the password once, not on every single click', () => {
    unlock()
    const { container } = renderPage()
    const cards = container.querySelectorAll('.card')
    fireEvent.click(cards[0])
    fireEvent.click(cards[1])
    fireEvent.click(cards[2])
    expect(window.prompt).toHaveBeenCalledTimes(1)
    expect(screen.getByText('3 / 35 caught (9%)')).toBeInTheDocument()
  })

  it('relocks when the lock button is clicked again', () => {
    unlock()
    renderPage()
    fireEvent.click(screen.getByText(/Locked — tap to unlock editing/))
    expect(screen.getByText(/Editing unlocked/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Editing unlocked/))
    expect(screen.getByText(/Locked — tap to unlock editing/)).toBeInTheDocument()
  })
})

describe('ChecklistPage - saving progress', () => {
  it('writes checked items to localStorage under the config storage key', () => {
    unlock()
    const { container } = renderPage()
    fireEvent.click(container.querySelector('.card'))

    const saved = JSON.parse(localStorage.getItem('test-boxed-key'))
    expect(saved).toHaveLength(1)
    expect(saved[0].id).toBe(1)
    expect(saved[0].date).toEqual(expect.any(String))
  })

  it('reads existing progress back on load', () => {
    localStorage.setItem(
      'test-boxed-key',
      JSON.stringify([{ id: 1, date: '2026-01-01T00:00:00.000Z' }, { id: 2, date: null }])
    )
    renderPage()
    expect(screen.getByText('2 / 35 caught (6%)')).toBeInTheDocument()
  })

  it('starts empty rather than crashing when the saved data is corrupt', () => {
    localStorage.setItem('test-boxed-key', '{not valid json')
    renderPage()
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('keeps each checklist progress under its own key', () => {
    localStorage.setItem('test-boxed-key', JSON.stringify([{ id: 1, date: null }]))
    renderPage(boxlessConfig)
    expect(screen.getByText('0 / 5 caught (0%)')).toBeInTheDocument()
  })
})

describe('ChecklistPage - box navigation (boxed checklists)', () => {
  it('opens on box 1 with Previous disabled', () => {
    renderPage()
    expect(screen.getByText('Box 1', { selector: '.box-label' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous box' })).toBeDisabled()
  })

  it('moves to box 2 and disables Next once there are no more boxes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Next box' }))
    expect(screen.getByText('Box 2', { selector: '.box-label' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next box' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous box' })).toBeEnabled()
  })

  it('shows only that box worth of items at a time', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('.card')).toHaveLength(30)
    fireEvent.click(screen.getByRole('button', { name: 'Next box' }))
    expect(container.querySelectorAll('.card')).toHaveLength(5)
  })

  it('clamps the jump-to-box field instead of landing on a box that does not exist', () => {
    renderPage()
    const jump = screen.getByRole('spinbutton')
    fireEvent.change(jump, { target: { value: '99' } })
    expect(screen.getByText('Box 2', { selector: '.box-label' })).toBeInTheDocument()
  })

  it('renders no box controls at all for a boxless checklist', () => {
    renderPage(boxlessConfig)
    expect(screen.queryByRole('button', { name: 'Next box' })).toBeNull()
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })
})

describe('ChecklistPage - search', () => {
  it('narrows the visible cards to the matching name', () => {
    const { container } = renderPage()
    fireEvent.change(screen.getByPlaceholderText(/Search by name or number/), {
      target: { value: 'Testmon7' },
    })
    expect(container.querySelectorAll('.card')).toHaveLength(1)
    expect(screen.getByText('Testmon7')).toBeInTheDocument()
  })

  it('jumps to the box the match lives in', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText(/Search by name or number/), {
      target: { value: 'Testmon33' },
    })
    expect(screen.getByText('Box 2', { selector: '.box-label' })).toBeInTheDocument()
  })

  it('clears with the × button', () => {
    const { container } = renderPage()
    const input = screen.getByPlaceholderText(/Search by name or number/)
    fireEvent.change(input, { target: { value: 'Testmon7' } })
    fireEvent.click(screen.getByLabelText('Clear search'))
    expect(input.value).toBe('')
    expect(container.querySelectorAll('.card')).toHaveLength(30)
  })

  it('clears on Escape too', () => {
    renderPage()
    const input = screen.getByPlaceholderText(/Search by name or number/)
    fireEvent.change(input, { target: { value: 'Testmon7' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.value).toBe('')
  })

  it('explains itself when nothing matches instead of going blank', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText(/Search by name or number/), {
      target: { value: 'Mewtwo' },
    })
    expect(screen.getByText('No matches for that search.')).toBeInTheDocument()
  })
})

describe('ChecklistPage - All / Caught / Not Caught filters', () => {
  it('shows only caught items under Caught', () => {
    localStorage.setItem('test-boxed-key', JSON.stringify([{ id: 1, date: null }]))
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Caught' }))
    expect(container.querySelectorAll('.card')).toHaveLength(1)
  })

  it('shows everything else under Not Caught', () => {
    localStorage.setItem('test-boxed-key', JSON.stringify([{ id: 1, date: null }]))
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Not Caught' }))
    expect(container.querySelectorAll('.card')).toHaveLength(29)
  })

  it('says so when a box has nothing caught yet', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Caught' }))
    expect(screen.getByText('Nothing caught here yet.')).toBeInTheDocument()
  })
})

describe('ChecklistPage - Select All / Unselect All / Undo', () => {
  it('marks the whole visible box after confirming', () => {
    unlock()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(window.confirm).toHaveBeenCalledWith('Mark 30 Pokémon as caught?')
    expect(screen.getByText('30 / 35 caught (86%)')).toBeInTheDocument()
  })

  it('changes nothing if the confirm is dismissed', () => {
    unlock()
    window.confirm = vi.fn(() => false)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('offers an Undo that puts things back exactly as they were', () => {
    unlock()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(screen.getByText('Marked 30 Pokémon as caught.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })

  it('drops the Undo banner as soon as any other change is made, so it can never revert the wrong thing', () => {
    unlock()
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    fireEvent.click(container.querySelector('.card')) // unrelated single toggle
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })

  it('unselects the visible box and warns that the dates go with it', () => {
    unlock()
    localStorage.setItem(
      'test-boxed-key',
      JSON.stringify([{ id: 1, date: null }, { id: 2, date: null }])
    )
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Unselect All' }))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Unmark 2 Pokémon'))
    expect(screen.getByText('0 / 35 caught (0%)')).toBeInTheDocument()
  })

  it('disables Select All once everything visible is already caught', () => {
    unlock()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(screen.getByRole('button', { name: 'Select All' })).toBeDisabled()
  })

  it('disables Unselect All when there is nothing caught to unselect', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Unselect All' })).toBeDisabled()
  })
})

describe('ChecklistPage - the group sidebar', () => {
  it('is left out entirely for a checklist with no groupSets', () => {
    const { container } = renderPage()
    expect(container.querySelector('.sidebar-left')).toBeNull()
    expect(container.querySelector('.layout-no-sidebar')).not.toBeNull()
  })

  it('renders one progress row per group, with that group real totals', () => {
    const { container } = renderPage(groupedConfig)
    const sidebar = container.querySelector('.sidebar-left')
    expect(sidebar).not.toBeNull()
    // makeItems tags exactly one entry 'shadow' and the other 34 'base'.
    expect(within(sidebar).getByText('0/1')).toBeInTheDocument()
    expect(within(sidebar).getByText('0/34')).toBeInTheDocument()
  })

  it('jumps to the box a group starts in when its row is clicked', () => {
    const { container } = renderPage(groupedConfig)
    const sidebar = container.querySelector('.sidebar-left')
    // 'base' starts at Testmon2 (box 1), so send it to a group that does
    // move: switch to box 2 first, then click back to Shadow (box 1).
    fireEvent.click(screen.getByRole('button', { name: 'Next box' }))
    expect(screen.getByText('Box 2', { selector: '.box-label' })).toBeInTheDocument()

    fireEvent.click(within(sidebar).getByText('Shadow'))
    expect(screen.getByText('Box 1', { selector: '.box-label' })).toBeInTheDocument()
  })
})

describe('ChecklistPage - sync status', () => {
  it('shows no cloud status line when Firebase is not configured', () => {
    // isSyncEnabled() is mocked to false above, so the whole sync block
    // should stay out of the DOM rather than showing a permanently-
    // loading spinner.
    const { container } = renderPage()
    expect(container.querySelector('.sync-status')).toBeNull()
  })
})