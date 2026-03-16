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

  const filtered = earthquakes.filter(q => q.properties.mag >= minMag)

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <Header
        count={filtered.length}
        simActive={simActive}
        setSimActive={setSimActive}
      />
      <Sidebar
        earthquakes={filtered}
        minMag={minMag}
        setMinMag={setMinMag}
        selected={selected}
        setSelected={setSelected}
      />
      <div style={{ paddingTop: '56px', paddingLeft: '300px' }}>
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