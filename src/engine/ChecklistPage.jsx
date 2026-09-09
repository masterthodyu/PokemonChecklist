import { useState, useEffect, useMemo, useRef } from 'react'
import ItemCard from './ItemCard.jsx'
import GroupProgress from './GroupProgress.jsx'
import { checkPassword } from './lock.js'
import { isSyncEnabled, fetchIdsFromCloud, pushIdsToCloud } from './sync.js'

// Reads a checklist's checked-item list back out of the browser's storage
// when the page first loads. A "Set" is just a list that automatically
// ignores duplicates and makes "have I checked this one?" checks fast.
function loadCheckedIds(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    // If the saved data is broken/missing for any reason, just start fresh
    // instead of crashing the whole page.
    return new Set()
  }
}

// The generic engine behind every checklist. Takes one checklist's
// `config` (see src/checklists/pokemon/config.js for an example) and
// renders the whole page — box grid, search, filters, sidebars, lock, and
// cloud sync. This file is the direct descendant of the original
// App.jsx; nothing in here should ever need to know it's Pokémon
// specifically — that's all in config.
function ChecklistPage({ config }) {
  const { data, boxSize, storageKey, jsonBinId, groupSets, title } = config
  const syncEnabled = isSyncEnabled(jsonBinId)

  // --- All of this checklist's "memory" lives here as state ---
  const [checkedIds, setCheckedIds] = useState(() => loadCheckedIds(storageKey))
  const [showOnly, setShowOnly] = useState('all')           // 'all' | 'caught' | 'uncaught'
  const [boxIndex, setBoxIndex] = useState(0)                // which box we're looking at (0-based)
  const [search, setSearch] = useState('')                   // what's typed in the search bar
  const [unlocked, setUnlocked] = useState(false)             // is editing unlocked right now?

  // 'off' (no cloud set up), 'loading', 'synced', or 'error'
  const [syncStatus, setSyncStatus] = useState(syncEnabled ? 'loading' : 'off')

  // We don't want to push to the cloud before we've actually pulled the
  // cloud's data down once — otherwise we might overwrite someone else's
  // progress with old data from this device before we've even seen theirs.
  const hasLoadedCloud = useRef(!syncEnabled)

  // If you navigate from one checklist to another (different route, same
  // mounted engine), reset everything to that checklist's own saved state
  // instead of carrying the previous checklist's state over.
  useEffect(() => {
    setCheckedIds(loadCheckedIds(storageKey))
    setShowOnly('all')
    setBoxIndex(0)
    setSearch('')
    setUnlocked(false)
    setSyncStatus(syncEnabled ? 'loading' : 'off')
    hasLoadedCloud.current = !syncEnabled
    // storageKey changing means "this is now a different checklist" — that's
    // the only thing that should re-run this reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // On first load (and whenever we switch checklists): pull down whatever's
  // saved in the cloud and MERGE it with what's already saved locally
  // (never remove anything either way — simple, but it means an "uncheck"
  // on one device might not always stick if another device still has that
  // item checked. Good enough for a personal checklist; a smarter merge is
  // a job for a real backend later on).
  useEffect(() => {
    if (!syncEnabled) return

    let cancelled = false
    fetchIdsFromCloud(jsonBinId).then(cloudIds => {
      if (cancelled) return
      if (cloudIds !== null) {
        setCheckedIds(prevLocal => new Set([...prevLocal, ...cloudIds]))
        setSyncStatus('synced')
      } else {
        setSyncStatus('error')
      }
      hasLoadedCloud.current = true
    })

    return () => {
      cancelled = true
    }
  }, [jsonBinId, syncEnabled])

  // Every time checkedIds changes, save it to this browser right away...
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checkedIds]))
  }, [checkedIds, storageKey])

  // ...and also push it up to the cloud a moment later (if sync is set
  // up). The short delay just avoids firing an API call on every single
  // click if you're checking off a bunch of items in a row.
  useEffect(() => {
    if (!syncEnabled || !hasLoadedCloud.current) return

    const timeoutId = setTimeout(() => {
      pushIdsToCloud(jsonBinId, checkedIds).then(success => {
        setSyncStatus(success ? 'synced' : 'error')
      })
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [checkedIds, jsonBinId, syncEnabled])

  // Every time the search box changes, look for a matching item and jump
  // straight to the box it's in.
  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return

    const match = data.find(p => {
      const matchesName = p.name.toLowerCase().includes(normalizedSearch)
      const matchesNumber = String(p.dexId ?? p.id).includes(normalizedSearch)
      return matchesName || matchesNumber
    })

    if (match) {
      setBoxIndex(match.boxId - 1) // boxId counts from 1, boxIndex counts from 0
    }
  }, [search, data])

  // Asks for the password (if not already unlocked) and returns true/false
  // for whether we're allowed to make a change right now.
  function requestUnlock() {
    if (unlocked) return true

    const entered = window.prompt('Enter password to make changes:')
    if (entered === null) return false // they clicked "Cancel"

    if (checkPassword(entered)) {
      setUnlocked(true)
      return true
    }

    window.alert('Incorrect password.')
    return false
  }

  function relock() {
    setUnlocked(false)
  }

  // The lock button does different things depending on the current state:
  // locked -> ask for the password. unlocked -> relock immediately.
  function handleLockButtonClick() {
    if (unlocked) {
      relock()
    } else {
      requestUnlock()
    }
  }

  // Checks/unchecks one item. Won't do anything unless editing is unlocked.
  function toggleChecked(id) {
    if (!requestUnlock()) return

    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalBoxes = Math.max(...data.map(p => p.boxId))
  const currentBoxId = boxIndex + 1

  // --- Left sidebar: one progress-bar list per group set the config
  // defines (Pokémon has "Generation" and "Category"; a future checklist
  // might only need one, or a different pair entirely). useMemo just means
  // "only redo this math when checkedIds/data actually changes."
  const groupStats = useMemo(() => {
    return groupSets.map(set => {
      const candidates = data.filter(set.filter)
      const groups = set.groups.map(g => {
        const inGroup = candidates.filter(item => set.matches(item, g))
        const checked = inGroup.filter(item => checkedIds.has(item.id)).length
        // data is already in box order, so the first matching entry tells
        // us which box to jump to.
        const first = inGroup[0]
        return {
          ...g,
          label: set.displayLabel(g),
          total: inGroup.length,
          caught: checked,
          startBox: first?.boxId,
        }
      })
      return { label: set.label, groups }
    })
  }, [groupSets, data, checkedIds])

  function jumpToGroup(g) {
    if (g.startBox) setBoxIndex(g.startBox - 1)
  }

  // The items that belong in the box we're currently looking at.
  const currentBox = useMemo(() => {
    return data.filter(p => p.boxId === currentBoxId)
  }, [data, currentBoxId])

  const normalizedSearch = search.trim().toLowerCase()

  // The current box's items, narrowed down by whatever's typed in search
  // and whichever All/Caught/Not Caught filter is selected.
  const visibleList = useMemo(() => {
    return currentBox.filter(p => {
      const matchesSearch =
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        String(p.dexId ?? p.id).includes(normalizedSearch)

      const isChecked = checkedIds.has(p.id)
      const matchesFilter =
        showOnly === 'all' ||
        (showOnly === 'caught' && isChecked) ||
        (showOnly === 'uncaught' && !isChecked)

      return matchesSearch && matchesFilter
    })
  }, [currentBox, checkedIds, normalizedSearch, showOnly])

  const total = data.length
  const checkedCount = checkedIds.size

  return (
    <div className="app">
      <header>
        <h1>{title}</h1>
        <p className="progress">
          {checkedCount} / {total} caught ({Math.round((checkedCount / total) * 100)}%)
        </p>
        <button className="lock-status" onClick={handleLockButtonClick}>
          {unlocked ? '🔓 Editing unlocked — tap to relock' : '🔒 Locked — tap to unlock editing'}
        </button>
        {syncEnabled && (
          <p className="sync-status">
            {syncStatus === 'loading' && '☁️ Loading cloud save…'}
            {syncStatus === 'synced' && '☁️ Synced'}
            {syncStatus === 'error' && '⚠️ Cloud sync failed — saved locally only'}
          </p>
        )}
      </header>

      <div className="layout">
        {/* Left sidebar: one progress-bar list per group set */}
        <aside className="sidebar sidebar-left">
          {groupStats.map(set => (
            <GroupProgress
              key={set.label}
              title={set.label}
              groups={set.groups}
              onSelect={jumpToGroup}
            />
          ))}
        </aside>

        <main className="main-content">
          <div className="controls">
            <input
              type="text"
              placeholder="Search by name or number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="box-controls">
            <button
              className="nav-button"
              onClick={() => setBoxIndex(prev => Math.max(prev - 1, 0))}
              disabled={boxIndex === 0}
            >
              Previous box
            </button>

            <div className="box-meta">
              <span className="box-label">Box {boxIndex + 1}</span>
              <span className="box-range">
                #{String(currentBoxId * boxSize - (boxSize - 1)).padStart(3, '0')} - #{String(currentBoxId * boxSize).padStart(3, '0')}
              </span>
              <label className="box-jump">
                <span>Jump to box</span>
                <input
                  type="number"
                  min="1"
                  max={totalBoxes}
                  value={boxIndex + 1}
                  onChange={e => {
                    const nextBox = Number(e.target.value)
                    if (!Number.isNaN(nextBox)) {
                      setBoxIndex(Math.min(Math.max(nextBox - 1, 0), totalBoxes - 1))
                    }
                  }}
                />
              </label>
            </div>

            <button
              className="nav-button"
              onClick={() => setBoxIndex(prev => Math.min(prev + 1, totalBoxes - 1))}
              disabled={boxIndex === totalBoxes - 1}
            >
              Next box
            </button>
          </div>

          <div className="filter-buttons">
            <button
              className={showOnly === 'all' ? 'active' : ''}
              onClick={() => setShowOnly('all')}
            >
              All
            </button>
            <button
              className={showOnly === 'caught' ? 'active' : ''}
              onClick={() => setShowOnly('caught')}
            >
              Caught
            </button>
            <button
              className={showOnly === 'uncaught' ? 'active' : ''}
              onClick={() => setShowOnly('uncaught')}
            >
              Not Caught
            </button>
          </div>

          <div className="box-panel">
            <div className="box-header">
              <span>Box {boxIndex + 1}</span>
              <span>
                {visibleList.length} / {currentBox.length} shown
              </span>
            </div>

            <div className="grid">
              {visibleList.map(p => (
                <ItemCard
                  key={p.id}
                  item={p}
                  checked={checkedIds.has(p.id)}
                  onToggle={() => toggleChecked(p.id)}
                  highlighted={
                    Boolean(normalizedSearch) &&
                    (p.name.toLowerCase().includes(normalizedSearch) ||
                      String(p.dexId ?? p.id).includes(normalizedSearch))
                  }
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChecklistPage
