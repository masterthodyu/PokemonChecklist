import { useState, useEffect, useMemo } from 'react'
import pokemonData from './data/pokemon.json'
import { GENERATIONS } from './data/generations.js'
import PokemonCard from './PokemonCard.jsx'
import GenProgress from './GenProgress.jsx'
import BoxShortcuts from './BoxShortcuts.jsx'

const STORAGE_KEY = 'pokemon-caught-v1'
const BOX_SIZE = 30

// The password lives outside of git — see .env.local (local dev) and the
// EDIT_PASSWORD GitHub Actions secret (deployed site) instead of a hardcoded
// value here. Heads up: since this is a static site (no server), a
// determined person could still dig it out of the deployed JS bundle via
// dev tools. This just stops accidental/casual edits, and keeps it out of
// your public GitHub repo source.
const EDIT_PASSWORD = import.meta.env.VITE_EDIT_PASSWORD

if (!EDIT_PASSWORD) {
  console.warn(
    'VITE_EDIT_PASSWORD is not set — editing will be impossible to unlock. ' +
    'Add it to .env.local for local dev, or as a GitHub Actions secret for deploys.'
  )
}

function loadCaughtIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function App() {
  const [caughtIds, setCaughtIds] = useState(loadCaughtIds)
  const [showOnly, setShowOnly] = useState('all')
  const [boxIndex, setBoxIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...caughtIds]))
  }, [caughtIds])

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return

    const match = pokemonData.find(p => {
      const matchesName = p.name.toLowerCase().includes(normalizedSearch)
      const matchesDex = String(p.dexId).includes(normalizedSearch)
      return matchesName || matchesDex
    })

    if (match) {
      setBoxIndex(match.boxId - 1)
    }
  }, [search])

  function requestUnlock() {
    if (unlocked) return true

    const entered = window.prompt('Enter password to make changes:')
    if (entered === null) return false // they hit cancel

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

  function handleLockButtonClick() {
    if (unlocked) {
      relock()
    } else {
      requestUnlock()
    }
  }

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

  const genStats = useMemo(() => {
    return GENERATIONS.map(g => {
      // Only base forms count toward generation progress — id === dexId
      // filters out alternate forms/genders/costumes, which get their own
      // categories later.
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

  const currentBox = useMemo(() => {
    return pokemonData.filter(p => p.boxId === currentBoxId)
  }, [currentBoxId])

  const normalizedSearch = search.trim().toLowerCase()

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
      </header>

      <div className="layout">
        <aside className="sidebar sidebar-left">
          <GenProgress generations={genStats} onSelect={jumpToGen} />
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
                #{String(currentBoxId * 30 - 29).padStart(3, '0')} - #{String(currentBoxId * 30).padStart(3, '0')}
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
                  highlighted={Boolean(normalizedSearch) && (p.name.toLowerCase().includes(normalizedSearch) || String(p.dexId).includes(normalizedSearch))}
                />
              ))}
            </div>
          </div>
        </main>

        <aside className="sidebar sidebar-right">
          <BoxShortcuts
            generations={genStats}
            currentBoxId={currentBoxId}
            onSelect={n => setBoxIndex(n - 1)}
          />
        </aside>
      </div>
    </div>
  )
}

export default App