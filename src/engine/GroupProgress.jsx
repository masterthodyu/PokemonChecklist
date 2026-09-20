// One progress-bar list, reused for every "group set" a checklist defines
// (Pokémon's Generation and Category sidebars were two near-identical
// copies of this same component — this is the merged version). `title`
// and `groups` come from ChecklistPage, already computed from the
// checklist's config — this component just displays them. `isBoxed` only
// changes the tooltip wording: a boxed checklist jumps to a box when you
// click a group, a boxless one narrows the list instead. `boxNumberOffset`
// (default 0) keeps that tooltip's box number consistent with whatever
// the rest of the page shows.
function GroupProgress({ title, groups, onSelect, isBoxed, boxNumberOffset = 0 }) {
  return (
    <div className="sidebar-inner">
      <h2>{title}</h2>
      {groups.map(g => {
        const pct = g.total > 0 ? Math.round((g.caught / g.total) * 100) : 0
        const tooltip = g.total === 0
          ? 'Nothing in this group yet'
          : isBoxed
            ? `Jump to Box ${g.startBox + boxNumberOffset}`
            : 'Show just this group (click again to clear)'

        return (
          <button
            key={g.key ?? g.gen}
            className="gen-row"
            onClick={() => onSelect(g)}
            title={tooltip}
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