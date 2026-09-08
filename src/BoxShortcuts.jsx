function BoxShortcuts({ generations, currentBoxId, onSelect }) {
  return (
    <div className="sidebar-inner">
      <h2>Jump to Gen</h2>
      {generations.map(g => (
        <button
          key={g.gen}
          className={`box-shortcut-row ${g.startBox === currentBoxId ? 'active' : ''}`}
          onClick={() => onSelect(g.startBox)}
          title={`Jump to Box ${g.startBox}`}
        >
          <span className="gen-name">Gen {g.gen} · {g.label}</span>
          <span className="box-shortcut-value">Box {g.startBox}</span>
        </button>
      ))}
    </div>
  )
}

export default BoxShortcuts