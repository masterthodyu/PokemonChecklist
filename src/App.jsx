import { useState, useEffect, useMemo } from 'react'
import pokemonData from './data/pokemon.json'
import PokemonCard from './PokemonCard.jsx'

const STORAGE_KEY = 'pokemon-caught-v1'
const BOX_SIZE = 30

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...caughtIds]))
  }, [caughtIds])

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return

    const match = pokemonData.find(p => {
      const matchesName = p.name.toLowerCase().includes(normalizedSearch)
      const matchesDex = String(p.dexid).includes(normalizedSearch)
      return matchesName || matchesDex
    })

    if (match) {
      setBoxIndex(Math.floor((match.dexid - 1) / BOX_SIZE))
    }
  }, [search])

  function toggleCaught(id) {
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

  const currentBox = useMemo(() => {
    return pokemonData.filter(p => p.boxId === currentBoxId)
  }, [currentBoxId])

  const normalizedSearch = search.trim().toLowerCase()

  const visibleList = useMemo(() => {
    return currentBox.filter(p => {
      const matchesSearch =
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        String(p.dexid).includes(normalizedSearch)

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
      </header>

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
        </div>

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
              highlighted={Boolean(normalizedSearch) && (p.name.toLowerCase().includes(normalizedSearch) || String(p.dexid).includes(normalizedSearch))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App