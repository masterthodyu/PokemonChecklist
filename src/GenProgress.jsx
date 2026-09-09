// The left sidebar list of progress bars, one per generation.
// `generations` is already-computed data from App.jsx — this file just
// displays it, it doesn't do any counting itself.
function GenProgress({ generations, onSelect }) {
  return (
    <div className="sidebar-inner">
      <h2>Generation</h2>
      {generations.map(g => {
        const percentDone = g.total > 0 ? Math.round((g.caught / g.total) * 100) : 0

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
              <div className="gen-bar-fill" style={{ width: `${percentDone}%` }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default GenProgress