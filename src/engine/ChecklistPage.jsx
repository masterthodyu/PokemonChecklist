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
  const { data, boxSize, storageKey, syncId, groupSets, title, boxNumberOffset = 0, backgroundImage } = config
  // Shifts displayed box numbers (label, jump field, header) without
  // touching boxIndex — lets e.g. Master Dex show "Box 71" instead of
  // "Box 1" when Home already fills 70 boxes. Defaults to 0 everywhere else.
  const isBoxed = Boolean(boxSize)
  const syncEnabled = isSyncEnabled(syncId)
  // Same pattern as the hub's own optional background (see hubConfig.js /
  // HubPage.jsx) — a checklist with no backgroundImage set just keeps the
  // plain dark background every page already has. Nothing to opt into.
  const hasBackground = Boolean(backgroundImage)
  // The dark tint has to be composited into this SAME background-image
  // value, as an extra gradient layer, rather than a separate darkened
  // element stacked on top — .app is `position: relative` (needed below),
  // which makes its own background paint above a plain z-index:-1
  // overlay in the stacking order, silently hiding the tint entirely
  // behind the photo. Baking it into one layered background sidesteps
  // that: a layer always paints over the layers listed after it.
  const backgroundImageUrl = hasBackground
    ? backgroundImage.startsWith('http')
      ? backgroundImage
      : `${import.meta.env.BASE_URL}${backgroundImage}`
    : null

  // --- All of this checklist's "memory" lives here as state ---
  const [checkedIds, setCheckedIds] = useState(() => loadCheckedIds(storageKey))
  const [showOnly, setShowOnly] = useState('all')           // 'all' | 'caught' | 'uncaught'
  const [boxIndex, setBoxIndex] = useState(0)                // which box we're looking at (0-based) — boxed mode only
  const [boxInputValue, setBoxInputValue] = useState('1')     // "Jump to box" field's own text, separate from boxIndex
                                                               // so it only commits on blur/Enter, not every keystroke
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

  // Back-to-top button — only meaningful for a boxless checklist (GO),
  // where the whole thing is one potentially very long scrolling list
  // instead of a paginated box. Shows once you've actually scrolled a
  // bit, not from the top of the page.
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    if (isBoxed) return
    function handleScroll() {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isBoxed])

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

  // Arrow keys / PageUp/PageDown move between boxes, same as the
  // Previous/Next buttons — skipped while typing in an input so it
  // doesn't fight with search or the jump-to-box field.
  useEffect(() => {
    if (!isBoxed) return

    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setBoxIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        setBoxIndex(prev => Math.min(prev + 1, totalBoxes - 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBoxed, totalBoxes])

  // Keeps the jump field in sync when boxIndex changes from anywhere
  // else (Previous/Next, sidebar jump, search landing on a box).
  useEffect(() => {
    setBoxInputValue(String(boxIndex + 1 + boxNumberOffset))
  }, [boxIndex, boxNumberOffset])

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
    <div
      className={`app ${hasBackground ? 'checklist-has-background' : ''}`}
      style={hasBackground ? { backgroundImage: `linear-gradient(rgba(5, 10, 18, 0.72), rgba(5, 10, 18, 0.72)), url(${backgroundImageUrl})` } : undefined}
    >
      <div className={`layout ${groupStats.length > 0 ? '' : 'layout-no-sidebar'}`}>
        {/* First group set (Generation, for Home) gets the left sidebar
            to itself; everything after it (Category, and any further
            sets a future checklist adds) stacks into the right sidebar
            instead — matching the two-asides-either-side-of-content
            layout the CSS grid (.layout's 200px/1fr/200px columns) was
            already set up for, previously left with the right column
            unused. Position is purely "first vs rest," not tied to any
            set's name, so this works for a checklist with only one
            group set (right sidebar just doesn't render) same as one
            with three or more. */}
        {groupStats.length > 0 && (
          <aside className="sidebar sidebar-left">
            <GroupProgress
              title={groupStats[0].label}
              groups={groupStats[0].groups}
              onSelect={g => jumpToGroup(groupStats[0], g)}
              isBoxed={isBoxed}
              boxNumberOffset={boxNumberOffset}
            />
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

          {/* A single box has nowhere to navigate to — Previous/Next would
              both always be disabled and the jump field could only ever
              hold the one valid number, so none of it earns its space. */}
          {isBoxed && totalBoxes > 1 && (
            <div className="box-controls">
              <button
                className="nav-button"
                onClick={() => setBoxIndex(prev => Math.max(prev - 1, 0))}
                disabled={boxIndex === 0}
              >
                Previous box
              </button>

              <div className="box-meta">
                <div className="box-jump">
                  <span className="box-jump-label">Box</span>
                  <input
                    aria-label="Jump to box"
                    type="number"
                    min={1 + boxNumberOffset}
                    max={totalBoxes + boxNumberOffset}
                    value={boxInputValue}
                    onChange={e => {
                      // Just track typing here — committing on every
                      // keystroke was the old "type 2, get 1" bug (an
                      // empty string mid-edit parsed as 0 and clamped).
                      setBoxInputValue(e.target.value)
                    }}
                    onBlur={() => {
                      const nextBox = Number(boxInputValue) - boxNumberOffset
                      if (boxInputValue !== '' && !Number.isNaN(nextBox)) {
                        const clampedIndex = Math.min(Math.max(nextBox - 1, 0), totalBoxes - 1)
                        setBoxIndex(clampedIndex)
                        // Set the field's own display directly, rather than
                        // relying only on the boxIndex-watching effect below
                        // — that effect only re-runs when boxIndex actually
                        // CHANGES. Typing an out-of-range number that clamps
                        // back to the box already showing (e.g. "31" on a
                        // single-box checklist, already on box 1) leaves
                        // boxIndex unchanged, so nothing would otherwise ever
                        // tell the field to stop showing "31".
                        setBoxInputValue(String(clampedIndex + 1 + boxNumberOffset))
                      } else {
                        setBoxInputValue(String(boxIndex + 1 + boxNumberOffset)) // revert on invalid/empty
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.target.blur() // commits via onBlur
                    }}
                  />
                </div>
                <span className="box-range">
                  #{String(currentBoxId * boxSize - (boxSize - 1)).padStart(3, '0')} - #{String(currentBoxId * boxSize).padStart(3, '0')}
                </span>
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

          <div className="box-panel">
            <div className="box-header">
              {/* The checklist title already has its own <h1> above, and
                  box-controls already shows "Box N" for multi-box
                  checklists — repeating either here left the search bar
                  fighting for space it doesn't need to. This only shows
                  up when a sidebar group filter is actually active, since
                  that's not indicated anywhere else and "tap again to
                  clear" is real information, not a repeat of something
                  already on the page. */}
              {activeGroup && (
                <span>{activeGroup.groupLabel} (tap it again in the sidebar to clear)</span>
              )}

              {/* Moved here from its own row above the box controls —
                  living right next to what it's actually filtering
                  (this box's own count and Select All/Unselect All)
                  reads more directly than being separated from it by
                  the All/Caught/Not Caught buttons and the box
                  navigator in between. */}
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

        {/* Sits after <main> in the DOM (not right after the left aside)
            specifically so grid auto-placement lands it in the layout's
            third column, not doubled up in the first. See the comment
            by sidebar-left above for why it's "everything past the
            first set," not a specific named set. */}
        {groupStats.length > 1 && (
          <aside className="sidebar sidebar-right">
            {groupStats.slice(1).map(set => (
              <GroupProgress
                key={set.label}
                title={set.label}
                groups={set.groups}
                onSelect={g => jumpToGroup(set, g)}
                isBoxed={isBoxed}
                boxNumberOffset={boxNumberOffset}
              />
            ))}
          </aside>
        )}
      </div>

      {!isBoxed && showBackToTop && (
        <button
          className="back-to-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑ Top
        </button>
        
      )}
    </div>
  )
}

export default ChecklistPage