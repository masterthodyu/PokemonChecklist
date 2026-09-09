import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChecklistPage from './engine/ChecklistPage.jsx'
import HubPage from './HubPage.jsx'
import { CHECKLISTS } from './home/index.js'
// App.jsx no longer knows anything about Pokémon specifically — it just
// wires up one route per checklist in the registry, plus a hub route.
// Adding a checklist means adding one line to src/checklists/index.js;
// nothing here needs to change.
function App() {
  return (
    <BrowserRouter basename="/checklists">
      <Routes>
        <Route path="/" element={<HubPage checklists={CHECKLISTS} />} />
        {CHECKLISTS.map(config => (
          <Route
            key={config.id}
            path={config.path}
            element={<ChecklistPage config={config} />}
          />
        ))}
      </Routes>
    </BrowserRouter>
  )
}

export default App
