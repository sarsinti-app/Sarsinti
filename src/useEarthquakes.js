import { useState, useEffect } from 'react'

const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=NOW-30DAYS&minlatitude=36&maxlatitude=42&minlongitude=26&maxlongitude=45&minmagnitude=0'
function useEarthquakes() {
  const [earthquakes, setEarthquakes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(USGS_URL)
      .then(res => res.json())
      .then(data => {
        console.log('Earthquakes loaded:', data.features.length)
        setEarthquakes(data.features)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fetch failed:', err)
        setLoading(false)
      })
  }, [])

  return { earthquakes, loading }
}

export default useEarthquakes