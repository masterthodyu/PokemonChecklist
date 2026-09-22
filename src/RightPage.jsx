import { Link } from 'react-router-dom'
import { HUB_CONFIG } from './hubConfig.js'

// The page reachable via the hub's right arrow. Genuinely its own file,
// not a shared component with LeftPage.jsx — build out whatever this
// ends up being without needing to think about the left page at all.
function RightPage() {
  const hasBackground = Boolean(HUB_CONFIG.backgroundImage)

  return (
    <div
      className={`app hub extra-hub-page ${hasBackground ? 'hub-has-background' : ''} slide-from-right`}
      style={hasBackground ? { backgroundImage: `url(${HUB_CONFIG.backgroundImage})` } : undefined}
    >
      {/* Points back toward the hub, which sits to this page's left. */}
      <Link to="/" className="hub-arrow hub-arrow-left" aria-label="Back to the main hub">
        ←
      </Link>
      {/* Further right has nowhere to go yet — shown disabled rather than
          missing, so this page still looks like the hub (both arrows
          always present) even before there's a page out here. */}
      <span className="hub-arrow hub-arrow-disabled hub-arrow-right" aria-label="Not built yet" title="Not built yet">
        →
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

export default RightPage