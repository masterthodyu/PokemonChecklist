function GenProgress({ generations, onSelect }) {
  return (
    <div className="sidebar-inner">
      <h2>By Generation</h2>
      {generations.map(g => {
        const pct = g.total > 0 ? Math.round((g.caught / g.total) * 100) : 0
        return (
          <button
            key={g.gen}
            className="gen-row"
            onClick={() => onSelect(g)}
            title={`Jump to Gen ${g.gen}`}
          >
            <div className="gen-row-top">
              <span className="gen-name">Gen {g.gen} · {g.label}</span>
              <span className="gen-count">{g.caught}/{g.total}</span>
            </div>
            <div className="gen-bar-track">
              <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default GenProgress