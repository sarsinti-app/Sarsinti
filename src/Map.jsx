import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import useEarthquakes from './useEarthquakes'

function getColor(mag) {
  if (mag >= 4) return '#ef4444'   // red — strong
  if (mag >= 2) return '#f97316'   // orange — moderate
  return '#eab308'                 // yellow — small
}

const legendStyle = {
  position: 'absolute',
  bottom: '30px',
  right: '10px',
  zIndex: 1000,
  background: 'rgba(0,0,0,0.75)',
  color: '#fff',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  lineHeight: '1.8',
  pointerEvents: 'none',
}

const dotStyle = (color) => ({
  display: 'inline-block',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: color,
  marginRight: '8px',
  verticalAlign: 'middle',
})

function Legend() {
  return (
    <div style={legendStyle}>
      <div style={{ fontWeight: 600, marginBottom: '6px' }}>Magnitude</div>
      <div><span style={dotStyle('#ef4444')}></span> 4.0+ Strong</div>
      <div><span style={dotStyle('#f97316')}></span> 2.0–3.9 Moderate</div>
      <div><span style={dotStyle('#eab308')}></span> Below 2.0 Minor</div>
    </div>
  )
}

function SarsıntiMap() {
  const { earthquakes, loading } = useEarthquakes()

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <p style={{ position: 'absolute', zIndex: 999, padding: '8px 16px', background: '#000', color: '#fff' }}>
          Loading earthquakes...
        </p>
      )}

      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        maxZoom={19}
        style={{ width: '100%', height: '100vh' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
          maxZoom={19}
        />

        {earthquakes.map(quake => {
          const [lng, lat] = quake.geometry.coordinates
          const mag = quake.properties.mag
          const place = quake.properties.place
          const time = new Date(quake.properties.time).toLocaleString()

          return (
            <CircleMarker
              key={quake.id}
              center={[lat, lng]}
              radius={mag * 3}
              color={getColor(mag)}
              fillColor={getColor(mag)}
              fillOpacity={0.7}
            >
              <Popup>
                <strong>M{mag}</strong> — {place}<br />
                {time}
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <Legend />
    </div>
  )
}

export default SarsıntiMap