import SarsıntiMap from './Map'
import Header from './Header'
import Sidebar from './Sidebar'
import useEarthquakes from './useEarthquakes'

function App() {
  const { earthquakes, loading } = useEarthquakes()

  return (
    <div>
      <Header count={earthquakes.length} />
      <Sidebar earthquakes={earthquakes} />
      <div style={{ paddingTop: '56px', paddingLeft: '300px' }}>
        <SarsıntiMap earthquakes={earthquakes} loading={loading} />
      </div>
    </div>
  )
}

export default App