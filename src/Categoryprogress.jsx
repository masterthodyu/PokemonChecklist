function Categoryprogress({ categories, onSelect }) {
  return (
    <div className="sidebar-inner">
      <h2>Category</h2>
      {categories.map(c => {
        const pct = c.total > 0 ? Math.round((c.caught / c.total) * 100) : 0
        return (
          <button
            key={c.key}
            className="gen-row"
            onClick={() => onSelect(c)}
            title={c.startBox ? `Jump to Box ${c.startBox}` : 'No Pokémon in this category yet'}
            disabled={c.total === 0}
          >
            <div className="gen-row-top">
              <span className="gen-name">{c.label}</span>
              <span className="gen-count">{c.caught}/{c.total}</span>
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

export default Categoryprogress