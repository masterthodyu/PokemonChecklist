// One progress-bar list, reused for every "group set" a checklist defines
// (Pokémon's Generation and Category sidebars were two near-identical
// copies of this same component — this is the merged version). `title`
// and `groups` come from ChecklistPage, already computed from the
// checklist's config — this component just displays them.
function GroupProgress({ title, groups, onSelect }) {
  return (
    <div className="sidebar-inner">
      <h2>{title}</h2>
      {groups.map(g => {
        const pct = g.total > 0 ? Math.round((g.caught / g.total) * 100) : 0

        return (
          <button
            key={g.key ?? g.gen}
            className="gen-row"
            onClick={() => onSelect(g)}
            title={g.startBox ? `Jump to Box ${g.startBox}` : 'Nothing in this group yet'}
            disabled={g.total === 0}
          >
            <div className="gen-row-top">
              <span className="gen-name">{g.label}</span>
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

export default GroupProgress
