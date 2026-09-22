import { Link } from 'react-router-dom'
import { HUB_CONFIG } from './hubConfig.js'

// The page reachable via the hub's left arrow. Genuinely its own file,
// not a shared component with RightPage.jsx — build out whatever this
// ends up being without needing to think about the right page at all.
function LeftPage() {
  const hasBackground = Boolean(HUB_CONFIG.backgroundImage)

  return (
    <div
      className={`app hub extra-hub-page ${hasBackground ? 'hub-has-background' : ''} slide-from-left`}
      style={hasBackground ? { backgroundImage: `url(${HUB_CONFIG.backgroundImage})` } : undefined}
    >
      {/* Points back toward the hub, which sits to this page's right. */}
      <Link to="/" className="hub-arrow hub-arrow-right" aria-label="Back to the main hub">
        →
      </Link>
      {/* Further left has nowhere to go yet — shown disabled rather than
          missing, so this page still looks like the hub (both arrows
          always present) even before there's a page out here. */}
      <span className="hub-arrow hub-arrow-disabled hub-arrow-left" aria-label="Not built yet" title="Not built yet">
        ←
      </span>

      <header>
        <h1>{HUB_CONFIG.title}</h1>
      </header>

      <div className="extra-hub-placeholder">
        <p>🚧 Nothing here yet</p>
      </div>
    </div>
  )
}

export default LeftPage