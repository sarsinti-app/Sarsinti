import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

function getColor(mag) {
  if (mag >= 4) return '#ef4444'
  if (mag >= 2) return '#f97316'
  return '#eab308'
}

function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: '30px', right: '10px',
      zIndex: 1000, background: 'rgba(13,17,23,0.9)',
      color: '#e6edf3', padding: '12px 16px',
      borderRadius: '8px', fontSize: '13px',
      lineHeight: '1.8', border: '1px solid #30363d'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '6px', color: '#8b949e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Magnitude</div>
      {[['#ef4444', '4.0+  Strong'], ['#f97316', '2.0–3.9  Moderate'], ['#eab308', '<2.0  Minor']].map(([color, label]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }}/>
          {label}
        </div>
      ))}
    </div>
  )
}

function SarsıntiMap({ earthquakes, loading }) {
  return (
    <div style={{ position: 'relative' }}>
      {loading && <p style={{ position: 'absolute', zIndex: 999, padding: '8px 16px', background: '#ef4444', color: '#fff', borderRadius: '4px', top: '10px', left: '50%', transform: 'translateX(-50%)' }}>Loading earthquakes...</p>}
      <MapContainer center={[39.0, 35.0]} zoom={6} maxZoom={19} style={{ width: '100%', height: 'calc(100vh - 56px)' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" maxZoom={19} />
        {earthquakes.map(quake => {
          const [lng, lat] = quake.geometry.coordinates
          const mag = quake.properties.mag
          return (
            <CircleMarker key={quake.id} center={[lat, lng]} radius={mag * 3} color={getColor(mag)} fillColor={getColor(mag)} fillOpacity={0.7}>
              <Popup><strong>M{mag}</strong> — {quake.properties.place}<br/>{new Date(quake.properties.time).toLocaleString()}</Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <Legend />
    </div>
  )
}

export default SarsıntiMap