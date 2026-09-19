import { Link } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import ItemCard from './ItemCard.jsx'
import GroupProgress from './GroupProgress.jsx'
import { checkPassword } from './lock.js'
import { isSyncEnabled, fetchIdsFromCloud, pushIdsToCloud, toCheckedMap, fromCheckedMap, mergeCheckedMaps } from './sync.js'

// Reads a checklist's checked-item Map out of storage. Map of id -> the
// date it was checked, or null if that's unknown (anything checked
// before dates were tracked).
function loadCheckedIds(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? toCheckedMap(JSON.parse(raw)) : new Map()
  } catch {
    return new Map()
  }
}

// Short "last synced" label — just the time if it was today, otherwise
// the date too.
function formatSyncedAt(date) {
  const isToday = date.toDateString() === new Date().toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return isToday ? time : `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

// The generic engine behind every checklist — takes one config (see
// src/checklists/home/config.js) and renders the box grid or flat list,
// search, filters, sidebars, lock, and sync. Nothing in here should know
// it's Pokémon specifically.
//
// boxSize set -> boxed mode (Previous/Next/Jump-to-box). boxSize
// null/undefined -> boxless, one flat list (e.g. GO, which has no box
// system in-game). Clicking a sidebar group jumps to a box in boxed mode,
// or filters the list in boxless mode.
function ChecklistPage({ config }) {
  const { data, boxSize, storageKey, syncId, groupSets, title } = config
  const isBoxed = Boolean(boxSize)
  const syncEnabled = isSyncEnabled(syncId)

  // --- All of this checklist's "memory" lives here as state ---
  const [checkedIds, setCheckedIds] = useState(() => loadCheckedIds(storageKey))
  const [showOnly, setShowOnly] = useState('all')           // 'all' | 'caught' | 'uncaught'
  const [boxIndex, setBoxIndex] = useState(0)                // which box we're looking at (0-based) — boxed mode only
  const [activeGroup, setActiveGroup] = useState(null)        // which sidebar group is narrowing the list — boxless mode only
  const [search, setSearch] = useState('')                   // what's typed in the search bar
  const [unlocked, setUnlocked] = useState(false)             // is editing unlocked right now?
  const [lastBulkAction, setLastBulkAction] = useState(null)   // { label, previousMap } | null — powers the Undo banner for Select All / Unselect All

  // 'off' (no cloud set up), 'loading', 'synced', or 'error'
  const [syncStatus, setSyncStatus] = useState(syncEnabled ? 'loading' : 'off')
  const [lastSyncedAt, setLastSyncedAt] = useState(null) // Date | null — set on every successful fetch or push

  // Whether this device had zero saved progress the moment this checklist
  // loaded — if so and cloud sync then fails, "0 caught" could mean the
  // sync failed, not that there's genuinely nothing saved. Drives the
  // header's error-state wording below.
  const wasEmptyOnLoad = useRef(checkedIds.size === 0)

  // Don't push to the cloud before pulling it down once — otherwise a
  // stale local state could overwrite real progress from another device.
  const hasLoadedCloud = useRef(!syncEnabled)

  // Switching checklists (different route, same mounted engine) resets
  // everything to that checklist's own saved state.
  useEffect(() => {
    const freshChecked = loadCheckedIds(storageKey)
    setCheckedIds(freshChecked)
    setShowOnly('all')
    setBoxIndex(0)
    setActiveGroup(null)
    setSearch('')
    setUnlocked(false)
    setSyncStatus(syncEnabled ? 'loading' : 'off')
    setLastSyncedAt(null)
    wasEmptyOnLoad.current = freshChecked.size === 0
    hasLoadedCloud.current = !syncEnabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // On load (and on checklist switch): pull cloud data and merge with
  // local via mergeCheckedMaps (see sync.js for the merge rules).
  useEffect(() => {
    if (!syncEnabled) return

    let cancelled = false
    fetchIdsFromCloud(syncId).then(cloudMap => {
      if (cancelled) return
      if (cloudMap !== null) {
        setCheckedIds(prevLocal => mergeCheckedMaps(prevLocal, cloudMap))
        setSyncStatus('synced')
        setLastSyncedAt(new Date())
      } else {
        setSyncStatus('error')
      }
      hasLoadedCloud.current = true
    })

    return () => {
      cancelled = true
    }
  }, [syncId, syncEnabled])

  // Save to localStorage right away on every change.
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(fromCheckedMap(checkedIds)))
  }, [checkedIds, storageKey])

  // Push to the cloud a moment later, if sync is on — delay avoids an API
  // call per click when checking off several items in a row.
  useEffect(() => {
    if (!syncEnabled || !hasLoadedCloud.current) return

    const timeoutId = setTimeout(() => {
      pushIdsToCloud(syncId, checkedIds).then(success => {
        setSyncStatus(success ? 'synced' : 'error')
        if (success) setLastSyncedAt(new Date())
      })
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [checkedIds, syncId, syncEnabled])

  // Manual retry for when the auto-push above failed.
  function retrySync() {
    setSyncStatus('loading')
    pushIdsToCloud(syncId, checkedIds).then(success => {
      setSyncStatus(success ? 'synced' : 'error')
      if (success) setLastSyncedAt(new Date())
    })
  }

  // Search jumps to the matching box (boxed only — boxless just filters
  // the flat list, handled in visibleList below).
  useEffect(() => {
    if (!isBoxed) return

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
  }, [search, data, isBoxed])

  // Prompts for the password if not already unlocked.
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

  // Auto-dismiss the Undo banner after a few seconds if unused.
  useEffect(() => {
    if (!lastBulkAction) return
    const timeoutId = setTimeout(() => setLastBulkAction(null), 8000)
    return () => clearTimeout(timeoutId)
  }, [lastBulkAction])

  // Checking stamps the current date; unchecking removes the entry
  // entirely (no undo history — a database edit is the only way back).
  function toggleChecked(id) {
    if (!requestUnlock()) return

    // Clears any stale Undo banner, since it no longer describes what a
    // click right now would actually revert.
    setLastBulkAction(null)

    setCheckedIds(prev => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, new Date().toISOString())
      }
      return next
    })
  }

  // Checks everything currently visible. Keeps existing dates on anything
  // already checked. Confirms first since this can affect 30+ items.
  function selectAllVisible() {
    const targets = visibleList.filter(item => !checkedIds.has(item.id))
    if (targets.length === 0) return // nothing to do

    if (!requestUnlock()) return
    const confirmed = window.confirm(`Mark ${targets.length} Pokémon as caught?`)
    if (!confirmed) return

    setLastBulkAction({
      label: `Marked ${targets.length} Pokémon as caught`,
      previousMap: new Map(checkedIds),
    })

    const now = new Date().toISOString()
    setCheckedIds(prev => {
      const next = new Map(prev)
      for (const item of targets) next.set(item.id, now)
      return next
    })
  }

  // Unchecks everything visible — the one action that actually loses
  // data (each item's checked date). The Undo banner is the safety net.
  function deselectAllVisible() {
    const targets = visibleList.filter(item => checkedIds.has(item.id))
    if (targets.length === 0) return // nothing to do

    if (!requestUnlock()) return
    const confirmed = window.confirm(
      `Unmark ${targets.length} Pokémon as not caught? This also erases the date each one was checked on — you'll have a few seconds to undo it right after.`
    )
    if (!confirmed) return

    setLastBulkAction({
      label: `Unmarked ${targets.length} Pokémon as not caught`,
      previousMap: new Map(checkedIds),
    })

    setCheckedIds(prev => {
      const next = new Map(prev)
      for (const item of targets) next.delete(item.id)
      return next
    })
  }

  // Reverts the most recent Select/Unselect All. Clears itself on its
  // own, or the moment any other change happens (see toggleChecked).
  function undoLastBulkAction() {
    if (!lastBulkAction) return
    setCheckedIds(lastBulkAction.previousMap)
    setLastBulkAction(null)
  }

  const totalBoxes = isBoxed ? Math.max(...data.map(p => p.boxId)) : 0
  const currentBoxId = boxIndex + 1

  // One progress-bar list per group set (Home has "Generation" and
  // "Category"). Each group keeps its own `matches` fn so boxless
  // checklists can filter the flat list on click.
  const groupStats = useMemo(() => {
    return groupSets.map(set => {
      const candidates = data.filter(set.filter)
      const groups = set.groups.map(g => {
        const inGroup = candidates.filter(item => set.matches(item, g))
        const checked = inGroup.filter(item => checkedIds.has(item.id)).length
        const first = inGroup[0] // box order -> first match's box is the jump target
        return {
          ...g,
          label: set.displayLabel(g),
          total: inGroup.length,
          caught: checked,
          startBox: first?.boxId,
        }
      })
      return { label: set.label, groups, matches: set.matches }
    })
  }, [groupSets, data, checkedIds])

  // Boxed: jumps to the group's starting box. Boxless: toggles a filter
  // on the flat list (click again to clear).
  function jumpToGroup(set, g) {
    if (isBoxed) {
      if (g.startBox) setBoxIndex(g.startBox - 1)
      return
    }

    const groupKey = g.key ?? g.gen
    setActiveGroup(prev =>
      prev && prev.setLabel === set.label && prev.groupKey === groupKey
        ? null
        : { setLabel: set.label, groupKey, groupLabel: g.label, matches: item => set.matches(item, g) }
    )
  }

  // Items in scope before search/filter: the current box (boxed), or the
  // active group filter / everything (boxless). Sorted by id so a
  // boxless checklist's data.json can be edited in any order.
  const scopedList = useMemo(() => {
    const inScope = isBoxed
      ? data.filter(p => p.boxId === currentBoxId)
      : activeGroup
        ? data.filter(activeGroup.matches)
        : data

    return [...inScope].sort((a, b) => a.id - b.id)
  }, [data, isBoxed, currentBoxId, activeGroup])

  const normalizedSearch = search.trim().toLowerCase()

  // The scoped items, narrowed down further by whatever's typed in search
  // and whichever All/Caught/Not Caught filter is selected.
  const visibleList = useMemo(() => {
    return scopedList.filter(p => {
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
  }, [scopedList, checkedIds, normalizedSearch, showOnly])

  const total = data.length
  const checkedCount = checkedIds.size

  return (
    <div className="app">
      <div className={`layout ${groupStats.length > 0 ? '' : 'layout-no-sidebar'}`}>
        {/* Only rendered when the config actually defines groups. */}
        {groupStats.length > 0 && (
          <aside className="sidebar sidebar-left">
            {groupStats.map(set => (
              <GroupProgress
                key={set.label}
                title={set.label}
                groups={set.groups}
                onSelect={g => jumpToGroup(set, g)}
                isBoxed={isBoxed}
              />
            ))}
          </aside>
        )}

        <main className="main-content">
          <header>
            <Link to="/" className="back-link">
              ← Back to checklists
            </Link>
            <h1>{title}</h1>
            <p className="progress">
              {checkedCount} / {total} caught ({Math.round((checkedCount / total) * 100)}%)
            </p>
            <button className="lock-status" onClick={handleLockButtonClick}>
              {unlocked ? '🔓 Editing unlocked — tap to relock' : '🔒 Locked — tap to unlock editing'}
            </button>
            {syncEnabled && (
              <p className={`sync-status ${syncStatus === 'error' && wasEmptyOnLoad.current ? 'sync-status-urgent' : ''}`}>
                {syncStatus === 'loading' && wasEmptyOnLoad.current && '☁️ Checking for saved progress before showing 0…'}
                {syncStatus === 'loading' && !wasEmptyOnLoad.current && '☁️ Loading cloud save…'}
                {syncStatus === 'synced' && (
                  <>☁️ Synced{lastSyncedAt && <span className="sync-status-time"> · last synced {formatSyncedAt(lastSyncedAt)}</span>}</>
                )}
                {syncStatus === 'error' && wasEmptyOnLoad.current && (
                  <>
                    ⚠️ Couldn't reach the cloud save, and this device has no local progress either —
                    this checklist may not actually be starting from 0, it just couldn't check.{' '}
                    <button className="retry-sync-button" onClick={retrySync}>
                      Retry
                    </button>
                  </>
                )}
                {syncStatus === 'error' && !wasEmptyOnLoad.current && (
                  <>
                    ⚠️ Cloud sync failed — saved locally only{' '}
                    <button className="retry-sync-button" onClick={retrySync}>
                      Retry
                    </button>
                  </>
                )}
              </p>
            )}
          </header>

          <div className="controls">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setSearch('')
                }}
              />
              {search && (
                <button
                  className="search-clear-button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isBoxed && (
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
          )}

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
              <span>
                {isBoxed
                  ? `Box ${boxIndex + 1}`
                  : activeGroup
                    ? `${activeGroup.groupLabel} (tap it again in the sidebar to clear)`
                    : title}
              </span>
              <span className="box-header-right">
                {visibleList.length} / {scopedList.length} shown
                <span className="box-header-caught">
                  {scopedList.filter(item => checkedIds.has(item.id)).length} caught
                </span>
                <button
                  className="select-all-button"
                  onClick={selectAllVisible}
                  disabled={visibleList.every(item => checkedIds.has(item.id))}
                >
                  Select All
                </button>
                <button
                  className="select-all-button deselect-all-button"
                  onClick={deselectAllVisible}
                  disabled={visibleList.every(item => !checkedIds.has(item.id))}
                >
                  Unselect All
                </button>
              </span>
            </div>

            {lastBulkAction && (
              <div className="undo-banner">
                <span>{lastBulkAction.label}.</span>
                <button onClick={undoLastBulkAction}>Undo</button>
              </div>
            )}

            {visibleList.length === 0 ? (
              <p className="empty-state">
                {normalizedSearch
                  ? 'No matches for that search.'
                  : scopedList.length === 0
                    ? 'Nothing here.'
                    : showOnly === 'caught'
                      ? 'Nothing caught here yet.'
                      : 'Everything here is already caught.'}
              </p>
            ) : (
              <div className="grid">
                {visibleList.map(p => (
                  <ItemCard
                    key={p.id}
                    item={p}
                    checked={checkedIds.has(p.id)}
                    checkedDate={checkedIds.get(p.id)}
                    onToggle={() => toggleChecked(p.id)}
                    highlighted={
                      Boolean(normalizedSearch) &&
                      (p.name.toLowerCase().includes(normalizedSearch) ||
                        String(p.dexId ?? p.id).includes(normalizedSearch))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChecklistPage