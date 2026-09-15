import { Link } from 'react-router-dom'
import { HUB_CONFIG } from './hubConfig.js'
import { toCheckedMap } from './engine/sync.js'

// Reads the exact same localStorage key each ChecklistPage writes to, just
// to show a quick "how far along am I" summary. No separate state to keep
// in sync — it's reading straight from the same source of truth, through
// the same toCheckedMap parser ChecklistPage itself uses (so this stays
// correct no matter how the storage format changes in the future).
function readCheckedCount(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? toCheckedMap(JSON.parse(raw)).size : 0
  } catch {
    return 0
  }
}

// Landing page: one row per checklist in the CHECKLISTS registry, stacked
// in a single centered column, each showing its icon, title, and
// progress, linking into that checklist's route.
//
// To add a new checklist's icon: just set `icon` in that checklist's
// config.js (see src/checklists/home/config.js for an example) —
// nothing here needs to change. No icon set? A generic placeholder box
// shows instead, so nothing looks broken while you're still deciding.
function HubPage({ checklists }) {
  const hasBackground = Boolean(HUB_CONFIG.backgroundImage)

  // Overall completion across everything — only counting checklists that
  // are actually finished data sets. A placeholder checklist (USUM's
  // 3-entry stub, say) would drag this number around meaninglessly if it
  // counted toward the total, since its "total" isn't the real dex size.
  const realChecklists = checklists.filter(config => !config.placeholder)
  const overallChecked = realChecklists.reduce((sum, config) => sum + readCheckedCount(config.storageKey), 0)
  const overallTotal = realChecklists.reduce((sum, config) => sum + config.data.length, 0)
  const overallPct = overallTotal > 0 ? Math.round((overallChecked / overallTotal) * 100) : 0

  return (
    <div
      className={`app hub ${hasBackground ? 'hub-has-background' : ''}`}
      style={hasBackground ? { backgroundImage: `url(${HUB_CONFIG.backgroundImage})` } : undefined}
    >
      <header>
        <h1>{HUB_CONFIG.title}</h1>
      </header>

      {overallTotal > 0 && (
        <div className="overall-status">
          {HUB_CONFIG.collectionLabel && (
            <p className="overall-status-label">{HUB_CONFIG.collectionLabel}</p>
          )}
          <div className="overall-status-top">
            <span>Overall completion</span>
            <span className="overall-status-pct">{overallPct}%</span>
          </div>
          <div className="gen-bar-track overall-status-track">
            <div className="overall-status-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="overall-status-count">{overallChecked} / {overallTotal} caught across every finished list</p>
        </div>
      )}

      <div className="hub-list">
        {checklists.map(config => {
          const checked = readCheckedCount(config.storageKey)
          const total = config.data.length
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0

          // Each game keeps its own real-world colors instead of every
          // row sharing one identical bar — falls back to the classic
          // Pokéball red/yellow if a checklist's config doesn't set one.
          const accentFrom = config.accentFrom || '#ee1515'
          const accentTo = config.accentTo || '#ffcb05'

          // Checklists still mid-setup (like USUM's 3-entry starter data)
          // would otherwise show something like "0 / 3 caught (0%)" —
          // reads as broken rather than "not built out yet." This is an
          // explicit flag on the checklist's own config, not a guess from
          // entry count — a genuinely tiny-but-finished list (SoulSilver's
          // intentional single entry) needs to show a real percentage,
          // not get mistaken for one that's still being built.
          const isPlaceholderData = Boolean(config.placeholder)

          return (
            <Link
              key={config.id}
              to={config.path}
              className="hub-row"
              style={{ '--row-accent-from': accentFrom, '--row-accent-to': accentTo }}
            >
              {config.icon ? (
                <img className="hub-row-icon" src={config.icon} alt="" />
              ) : (
                <div className="hub-row-icon hub-row-icon-placeholder">?</div>
              )}

              <div className="hub-row-body">
                <h2>{config.title}</h2>
                {isPlaceholderData ? (
                  <p className="hub-row-count">🚧 Still being built ({total} entries so far)</p>
                ) : (
                  <>
                    <p className="hub-row-count">{checked} / {total} caught</p>
                    <div className="gen-bar-track">
                      <div className="hub-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </>
                )}
              </div>

              {!isPlaceholderData && <div className="hub-row-stat">{pct}%</div>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default HubPage