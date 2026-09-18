import homeConfig from './home/config.js'
import goConfig from './go/config.js'
import usumConfig from './usum/config.js'
import hgssConfig from './hgss/config.js'
import colosseumConfig from './colosseum/config.js'
import xdConfig from './xd/config.js'
import svConfig from './sv/config.js'
import laConfig from './legends_arceus/config.js'
import swshConfig from './swsh/config.js'

// Add each new checklist's config here once it exists — this list drives
// both the routes in App.jsx and the summary cards on HubPage.jsx.
// To add a checklist: copy the home/ folder's shape (config.js +
// data.json + optional scripts/), then add its config import + entry here.
export const CHECKLISTS = [
  homeConfig,
  goConfig,
  usumConfig,
  hgssConfig,
  colosseumConfig,
  xdConfig,
  svConfig,
  laConfig,
  swshConfig,
]