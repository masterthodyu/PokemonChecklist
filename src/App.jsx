import { useState, useEffect, useMemo } from 'react'
import pokemonData from './data/pokemon.json'
import PokemonCard from './PokemonCard.jsx'

const STORAGE_KEY = 'pokemon-caught-v1'

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
  const [search, setSearch] = useState('')
  const [showOnly, setShowOnly] = useState('all') // 'all' | 'caught' | 'uncaught'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...caughtIds]))
  }, [caughtIds])

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

  const filteredList = useMemo(() => {
    return pokemonData.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const isCaught = caughtIds.has(p.id)
      const matchesFilter =
        showOnly === 'all' ||
        (showOnly === 'caught' && isCaught) ||
        (showOnly === 'uncaught' && !isCaught)
      return matchesSearch && matchesFilter
    })
  }, [search, showOnly, caughtIds])

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
          placeholder="Search Pokémon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
      </div>

      <div className="grid">
        {filteredList.map(p => (
          <PokemonCard
            key={p.id}
            pokemon={p}
            caught={caughtIds.has(p.id)}
            onToggle={() => toggleCaught(p.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default App