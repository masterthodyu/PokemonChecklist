import { Link } from 'react-router-dom'
import { HUB_CONFIG } from './hubConfig.js'

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

// Landing page: one row per checklist in the CHECKLISTS registry, stacked
// in a single centered column, each showing its icon, title, and
// progress, linking into that checklist's route.
//
// To add a new checklist's icon: just set `icon` in that checklist's
// config.js (see src/checklists/pokemon/config.js for an example) —
// nothing here needs to change. No icon set? A generic placeholder box
// shows instead, so nothing looks broken while you're still deciding.
function HubPage({ checklists }) {
  const hasBackground = Boolean(HUB_CONFIG.backgroundImage)

  return (
    <div
      className={`app hub ${hasBackground ? 'hub-has-background' : ''}`}
      style={hasBackground ? { backgroundImage: `url(${HUB_CONFIG.backgroundImage})` } : undefined}
    >
      <header>
        <h1>{HUB_CONFIG.title}</h1>
      </header>

      <div className="hub-list">
        {checklists.map(config => {
          const checked = readCheckedCount(config.storageKey)
          const total = config.data.length
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0

          return (
            <Link key={config.id} to={config.path} className="hub-row">
              {config.icon ? (
                <img className="hub-row-icon" src={config.icon} alt="" />
              ) : (
                <div className="hub-row-icon hub-row-icon-placeholder">?</div>
              )}

              <div className="hub-row-body">
                <h2>{config.title}</h2>
                <p>{checked} / {total} ({pct}%)</p>
                <div className="gen-bar-track">
                  <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default HubPage