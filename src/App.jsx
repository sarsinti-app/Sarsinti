import { useState } from 'react'
import EqMap from './Map'
import Header from './Header'
import Sidebar from './Sidebar'
import useEarthquakes from './useEarthquakes'

function App() {
  const { earthquakes, loading } = useEarthquakes()
  const [minMag, setMinMag] = useState(0)
  const [selected, setSelected] = useState(null)
  const [simActive, setSimActive] = useState(false)
  const [simLocation, setSimLocation] = useState(null)
  const [lang, setLang] = useState('en')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filtered = earthquakes.filter(q => q.properties.mag >= minMag)

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <Header
        count={filtered.length}
        simActive={simActive}
        setSimActive={setSimActive}
        lang={lang}
        setLang={setLang}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="sidebar-desktop">
        <Sidebar
          earthquakes={filtered}
          minMag={minMag}
          setMinMag={setMinMag}
          selected={selected}
          setSelected={setSelected}
          lang={lang}
        />
      </div>

      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.6)'
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxHeight: '80vh', background: '#0d1117',
              borderRadius: '16px 16px 0 0', overflow: 'hidden'
            }}
          >
            <Sidebar
              earthquakes={filtered}
              minMag={minMag}
              setMinMag={setMinMag}
              selected={selected}
              setSelected={quake => {
                setSelected(quake)
                setSidebarOpen(false)
              }}
              lang={lang}
            />
          </div>
        </div>
      )}

      <div
        className="map-wrapper"
        style={{ paddingTop: '56px', paddingLeft: '300px' }}
      >
        <EqMap
          earthquakes={filtered}
          loading={loading}
          selected={selected}
          setSelected={setSelected}
          simActive={simActive}
          setSimActive={setSimActive}
          simLocation={simLocation}
          setSimLocation={setSimLocation}
        />
      </div>
    </div>
  )
}

export default App