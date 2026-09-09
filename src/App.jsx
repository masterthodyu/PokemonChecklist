import { useState, useEffect, useMemo, useRef } from 'react'
import pokemonData from './data/pokemon.json'
import { GENERATIONS } from './data/generations.js'
import { CATEGORIES } from './data/categories.js'
import PokemonCard from './PokemonCard.jsx'
import GenProgress from './GenProgress.jsx'
import CategoryProgress from './CategoryProgress.jsx'
import { syncEnabled, fetchCaughtIdsFromCloud, pushCaughtIdsToCloud } from './sync.js'

// The name of the "drawer" we use in the browser's storage to remember
// which Pokémon you've caught. If you ever change how caught-data is
// stored, bump this to "pokemon-caught-v2" so old saved data doesn't
// get read in a way that breaks things.
const STORAGE_KEY = 'pokemon-caught-v1'

// How many Pokémon fit in one box (just used for the "#391 - #420" label
// under the box number — the real box boundaries live in each Pokémon's
// own `boxId`, set by scripts/assignBoxes.mjs).
const BOX_SIZE = 30

// The site is locked by default so random clicks don't change your caught
// list. Typing this password unlocks it for the rest of the browser tab.
// The password itself is never written in this file — it comes from:
//   - .env.local on your own computer (for `npm run dev`)
//   - the EDIT_PASSWORD secret in GitHub Actions (for the live site)
// Heads up: since this is a plain static website (no server), someone who
// really wanted to could still dig the password out of the deployed code.
// This is just a "don't touch my stuff by accident" lock, not a vault.
const EDIT_PASSWORD = import.meta.env.VITE_EDIT_PASSWORD

if (!EDIT_PASSWORD) {
  console.warn(
    'VITE_EDIT_PASSWORD is not set — editing will be impossible to unlock. ' +
    'Add it to .env.local for local dev, or as a GitHub Actions secret for deploys.'
  )
}

// Reads your caught-Pokémon list back out of the browser's storage when
// the page first loads. A "Set" is just a list that automatically ignores
// duplicates and makes "have I caught this one?" checks fast.
function loadCaughtIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    // If the saved data is broken/missing for any reason, just start fresh
    // instead of crashing the whole page.
    return new Set()
  }
}

function App() {
  // --- All of the app's "memory" lives here as state ---
  const [caughtIds, setCaughtIds] = useState(loadCaughtIds) // which Pokémon are checked off
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

  // On first load: pull down whatever's saved in the cloud and MERGE it
  // with what's already saved locally (never remove anything either way —
  // simple, but it means an "uncheck" on one device might not always
  // stick if another device still has that Pokémon checked. Good enough
  // for a personal checklist; a smarter merge is a job for a real backend
  // later on).
  useEffect(() => {
    if (!syncEnabled) return

    let cancelled = false
    fetchCaughtIdsFromCloud().then(cloudIds => {
      if (cancelled) return
      if (cloudIds !== null) {
        setCaughtIds(prevLocal => new Set([...prevLocal, ...cloudIds]))
        setSyncStatus('synced')
      } else {
        setSyncStatus('error')
      }
      hasLoadedCloud.current = true
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Every time caughtIds changes, save it to this browser right away...
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...caughtIds]))
  }, [caughtIds])

  // ...and also push it up to the cloud a moment later (if sync is set
  // up). The short delay just avoids firing an API call on every single
  // click if you're checking off a bunch of Pokémon in a row.
  useEffect(() => {
    if (!syncEnabled || !hasLoadedCloud.current) return

    const timeoutId = setTimeout(() => {
      pushCaughtIdsToCloud(caughtIds).then(success => {
        setSyncStatus(success ? 'synced' : 'error')
      })
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [caughtIds])

  // Every time the search box changes, look for a matching Pokémon and
  // jump straight to the box it's in.
  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return

    const match = pokemonData.find(p => {
      const matchesName = p.name.toLowerCase().includes(normalizedSearch)
      const matchesDex = String(p.dexId).includes(normalizedSearch)
      return matchesName || matchesDex
    })

    if (match) {
      setBoxIndex(match.boxId - 1) // boxId counts from 1, boxIndex counts from 0
    }
  }, [search])

  // Asks for the password (if not already unlocked) and returns true/false
  // for whether we're allowed to make a change right now.
  function requestUnlock() {
    if (unlocked) return true

    const entered = window.prompt('Enter password to make changes:')
    if (entered === null) return false // they clicked "Cancel"

    if (entered === EDIT_PASSWORD) {
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

  // Checks/unchecks one Pokémon as caught. Won't do anything unless
  // editing is unlocked.
  function toggleCaught(id) {
    if (!requestUnlock()) return

    setCaughtIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const totalBoxes = Math.max(...pokemonData.map(p => p.boxId))
  const currentBoxId = boxIndex + 1

  // --- Left sidebar: progress per generation (Kanto, Johto, etc.) ---
  // useMemo just means "only redo this math when caughtIds actually
  // changes" — it saves recalculating on every little re-render.
  const genStats = useMemo(() => {
    return GENERATIONS.map(g => {
      // Only base-form Pokémon count here (id === dexId rules out
      // genders/forms/etc — those get their own categories below).
      const basePokemon = pokemonData.filter(
        p => p.id === p.dexId && p.dexId >= g.start && p.dexId <= g.end
      )
      const caught = basePokemon.filter(p => caughtIds.has(p.id)).length
      const firstOfGen = pokemonData.find(p => p.id === p.dexId && p.dexId === g.start)
      return { ...g, total: basePokemon.length, caught, startBox: firstOfGen?.boxId ?? 1 }
    })
  }, [caughtIds])

  function jumpToGen(gen) {
    setBoxIndex(gen.startBox - 1)
  }

  // --- Left sidebar: progress per "extra" category (gender, form, etc.) ---
  // Every Pokémon already has a `category` field baked into pokemon.json
  // by scripts/assignCategories.mjs, so this is just a matter of counting.
  const categoryStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const entries = pokemonData.filter(p => p.category === cat.key)
      const caught = entries.filter(p => caughtIds.has(p.id)).length
      // pokemon.json is already in box order, so the first matching entry
      // tells us which box to jump to.
      const firstEntry = entries[0]
      return { ...cat, total: entries.length, caught, startBox: firstEntry?.boxId }
    })
  }, [caughtIds])

  function jumpToCategory(cat) {
    if (cat.startBox) setBoxIndex(cat.startBox - 1)
  }

  // The Pokémon that belong in the box we're currently looking at.
  const currentBox = useMemo(() => {
    return pokemonData.filter(p => p.boxId === currentBoxId)
  }, [currentBoxId])

  const normalizedSearch = search.trim().toLowerCase()

  // The current box's Pokémon, narrowed down by whatever's typed in
  // search and whichever All/Caught/Not Caught filter is selected.
  const visibleList = useMemo(() => {
    return currentBox.filter(p => {
      const matchesSearch =
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        String(p.dexId).includes(normalizedSearch)

      const isCaught = caughtIds.has(p.id)
      const matchesFilter =
        showOnly === 'all' ||
        (showOnly === 'caught' && isCaught) ||
        (showOnly === 'uncaught' && !isCaught)

      return matchesSearch && matchesFilter
    })
  }, [currentBox, caughtIds, normalizedSearch, showOnly])

  const total = pokemonData.length
  const caughtCount = caughtIds.size

  return (
    <div className="app">
      <header>
        <h1>Pokémon Caught Checklist</h1>
        <p className="progress">
          {caughtCount} / {total} caught ({Math.round((caughtCount / total) * 100)}%)
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
        {/* Left sidebar: two stacked lists of progress bars */}
        <aside className="sidebar sidebar-left">
          <GenProgress generations={genStats} onSelect={jumpToGen} />
          <CategoryProgress categories={categoryStats} onSelect={jumpToCategory} />
        </aside>

        <main className="main-content">
          <div className="controls">
            <input
              type="text"
              placeholder="Search Pokémon or dex number..."
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
                #{String(currentBoxId * BOX_SIZE - (BOX_SIZE - 1)).padStart(3, '0')} - #{String(currentBoxId * BOX_SIZE).padStart(3, '0')}
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
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  caught={caughtIds.has(p.id)}
                  onToggle={() => toggleCaught(p.id)}
                  highlighted={
                    Boolean(normalizedSearch) &&
                    (p.name.toLowerCase().includes(normalizedSearch) ||
                      String(p.dexId).includes(normalizedSearch))
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

export default App