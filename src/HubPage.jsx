import { Link } from 'react-router-dom'

// Reads the exact same localStorage key each ChecklistPage writes to, just
// to show a quick "how far along am I" summary. No separate state to keep
// in sync — it's reading straight from the same source of truth.
function readCheckedCount(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    const checkedIds = raw ? new Set(JSON.parse(raw)) : new Set()
    return checkedIds.size
  } catch {
    return 0
  }
}

// Landing page: one card per checklist in the CHECKLISTS registry, each
// showing its title and progress, linking into that checklist's route.
function HubPage({ checklists }) {
  return (
    <div className="app hub">
      <header>
        <h1>My Checklists</h1>
      </header>

      <div className="hub-grid">
        {checklists.map(config => {
          const checked = readCheckedCount(config.storageKey)
          const total = config.data.length
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0

          return (
            <Link key={config.id} to={config.path} className="hub-card">
              <h2>{config.title}</h2>
              <p>{checked} / {total} ({pct}%)</p>
              <div className="gen-bar-track">
                <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default HubPage
