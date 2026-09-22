import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HUB_CONFIG } from './hubConfig.js'
import { toCheckedMap, fromCheckedMap, isSyncEnabled, fetchIdsFromCloud, mergeCheckedMaps } from './engine/sync.js'

// Reads the exact same localStorage key each ChecklistPage writes to,
// through the same toCheckedMap parser ChecklistPage itself uses (so this
// stays correct no matter how the storage format changes in the future).
function readLocalCheckedMap(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? toCheckedMap(JSON.parse(raw)) : new Map()
  } catch {
    return new Map()
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

  // Checked-item counts per checklist, keyed by storageKey. Starts from
  // whatever's already saved locally — same as before, so there's no
  // flash of "0" on a device that's already opened these lists — and
  // then gets refreshed in the effect below as each checklist's cloud
  // data comes back in.
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(
      checklists.map(config => [config.storageKey, readLocalCheckedMap(config.storageKey).size])
    )
  )

  // Previously, the hub only ever read localStorage directly, and the
  // cloud fetch+merge (see mergeCheckedMaps in sync.js) only ever ran
  // inside ChecklistPage's own effect. That meant a checklist's progress
  // bar stayed at 0 — or stale — on any device that hadn't actually
  // opened that specific checklist page at least once, since nothing had
  // ever pulled its cloud data down yet. This mirrors that same
  // fetch+merge here, once per synced checklist on mount, so the hub's
  // numbers are right the first time you land here rather than only
  // after clicking into each list. The merged result also gets written
  // back to localStorage, same as ChecklistPage would, so the numbers
  // stay correct even without a network connection next time.
  //
  // Skips placeholder checklists (their progress line isn't shown at all,
  // just an entry count) and anything without cloud sync configured —
  // isSyncEnabled itself already returns false with no VITE_FIREBASE_DB_URL
  // set, same guard ChecklistPage uses.
  useEffect(() => {
    let cancelled = false

    for (const config of checklists) {
      if (config.placeholder || !isSyncEnabled(config.syncId)) continue

      fetchIdsFromCloud(config.syncId).then(cloudMap => {
        if (cancelled || cloudMap === null) return

        const merged = mergeCheckedMaps(readLocalCheckedMap(config.storageKey), cloudMap)
        localStorage.setItem(config.storageKey, JSON.stringify(fromCheckedMap(merged)))
        setCounts(prev => ({ ...prev, [config.storageKey]: merged.size }))
      })
    }

    return () => {
      cancelled = true
    }
    // Only re-run if the actual list of checklists changes, not on every
    // render — and specifically not when `counts` changes, since this
    // effect is what updates `counts` in the first place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklists])

  const checkedCount = config => counts[config.storageKey] ?? 0

  // Overall completion across everything — only counting checklists that
  // are actually finished data sets, and not the "bonus" ones. A
  // placeholder (USUM's 3-entry stub) would drag this number around
  // meaninglessly since its "total" isn't the real dex size. A bonus
  // checklist (Master Dex) is deliberately outside "did you catch every
  // species" entirely — it's specific shinies/events/forms on top of the
  // real dex, not part of it, so it's excluded the same way.
  const realChecklists = checklists.filter(config => !config.placeholder && !config.bonus)
  const overallChecked = realChecklists.reduce((sum, config) => sum + checkedCount(config), 0)
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
          const checked = checkedCount(config)
          const total = config.data.length
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0

          // Each game keeps its own real-world colors instead of every
          // row sharing one identical bar — falls back to the classic
          // Pokéball red/yellow if a checklist's config doesn't set one.
          const accentFrom = config.accentFrom || '#ee1515'
          const accentTo = config.accentTo || '#ffcb05'

          // Checklists still mid-setup (a placeholder with only a
          // handful of entries so far) would otherwise show something like "0 / 3 caught (0%)" —
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
                <img
                  className="hub-row-icon"
                  src={config.icon.startsWith('http') ? config.icon : `${import.meta.env.BASE_URL}${config.icon}`}
                  alt=""
                />
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