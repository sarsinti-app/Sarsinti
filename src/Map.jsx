import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import RecentBanner from './RecentBanner'
import Simulator from './Simulator'

function getColor(mag) {
  if (mag >= 5) return '#ef4444'
  if (mag >= 3) return '#f97316'
  return '#eab308'
}

function feltRadius(mag) {
  return Math.round(Math.pow(10, 0.5 * mag) * 1000)
}

function FlyTo({ selected }) {
  const map = useMap()
  useEffect(() => {
    if (!selected) return
    const [lng, lat] = selected.geometry.coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') return
    map.flyTo([lat, lng], 8, { duration: 1.5 })
  }, [selected, map])
  return null
}

function PulseOverlay({ selected }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    if (markerRef.current) {
      try { markerRef.current.remove() } catch (e) {}
      markerRef.current = null
    }

    if (!selected) return

    const coords = selected?.geometry?.coordinates
    if (!coords || coords.length < 2) return
    const [lng, lat] = coords
    if (typeof lat !== 'number' || typeof lng !== 'number') return

    const mag = selected.properties.mag
    const color = getColor(mag)

    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:0;height:0">
        <div class="sonar-wrapper">
          <div class="sonar-ring sonar-ring-1" style="--color:${color}"></div>
          <div class="sonar-ring sonar-ring-2" style="--color:${color}"></div>
          <div class="sonar-ring sonar-ring-3" style="--color:${color}"></div>
        </div>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })

    try {
      const marker = L.marker([lat, lng], {
        icon,
        interactive: false,
        zIndexOffset: -1000
      })
      marker.addTo(map)
      markerRef.current = marker
    } catch (e) {
      console.error('PulseOverlay error:', e)
    }

    return () => {
      if (markerRef.current) {
        try { markerRef.current.remove() } catch (e) {}
        markerRef.current = null
      }
    }
  }, [selected, map])

  return null
}

function ImpactZones({ selected }) {
  if (!selected) return null
  const coords = selected?.geometry?.coordinates
  if (!coords || coords.length < 2) return null
  const [lng, lat] = coords
  const mag = selected.properties.mag
  const color = getColor(mag)
  const radius = feltRadius(mag)

  return (
    <>
      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{
          color, fillColor: color,
          fillOpacity: 0.05, weight: 1,
          dashArray: '6 5', interactive: false
        }}
      />
      <Circle
        center={[lat, lng]}
        radius={radius * 0.6}
        pathOptions={{
          color, fillColor: color,
          fillOpacity: 0.08, weight: 0.5,
          dashArray: '3 4', interactive: false
        }}
      />
      <Circle
        center={[lat, lng]}
        radius={radius * 0.25}
        pathOptions={{
          color, fillColor: color,
          fillOpacity: 0.15, weight: 0.5,
          interactive: false
        }}
      />
    </>
  )
}

function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: '30px', right: '10px', zIndex: 1000,
      background: 'rgba(13,17,23,0.92)', color: '#e6edf3',
      padding: '12px 16px', borderRadius: '8px', fontSize: '13px',
      lineHeight: '1.8', border: '1px solid #30363d'
    }}>
      <div style={{
        fontWeight: 600, marginBottom: '6px', color: '#8b949e',
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        Magnitude
      </div>
      {[
        ['#ef4444', '5.0+  Strong'],
        ['#f97316', '3.0 - 4.9  Moderate'],
        ['#eab308', 'Below 3.0  Minor']
      ].map(([color, label]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: color, display: 'inline-block', flexShrink: 0
          }} />
          {label}
        </div>
      ))}
      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '1px solid #30363d',
        fontSize: '11px', color: '#8b949e', lineHeight: 1.5
      }}>
        Click any dot to see<br />estimated impact zone
      </div>
    </div>
  )
}

function EqMap({ earthquakes, loading, selected, setSelected, simActive, setSimActive, simLocation, setSimLocation }) {
  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <p style={{ position: 'absolute', zIndex: 999, padding: '8px 16px', background: '#ef4444', color: '#fff', borderRadius: '4px', top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
          Loading...
        </p>
      )}
      <MapContainer center={[39.0, 35.0]} zoom={6} maxZoom={19} style={{ width: '100%', height: 'calc(100vh - 56px)' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap © CARTO"
          maxZoom={19}
        />
        <FlyTo selected={selected} />
        <ImpactZones selected={selected} />
        <PulseOverlay selected={selected} />
       <Simulator
  active={simActive}
  setActive={setSimActive}
  location={simLocation}
  setLocation={setSimLocation}
/>
        {earthquakes.map(quake => {
          const coords = quake?.geometry?.coordinates
          if (!coords || coords.length < 2) return null
          const [lng, lat] = coords
          const mag = quake.properties.mag
          const color = getColor(mag)
          const radius = feltRadius(mag)
          const isSelected = selected?.id === quake.id
          return (
            <CircleMarker
              key={quake.id}
              center={[lat, lng]}
              radius={isSelected ? Math.max(mag * 5, 8) : Math.max(mag * 3, 5)}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isSelected ? 2.5 : 1
              }}
              eventHandlers={{
                click: () => {
                  if (typeof setSelected === 'function') setSelected(quake)
                }
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Segoe UI, sans-serif', minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ background: color, color: '#fff', fontWeight: 700, fontSize: '15px', padding: '4px 10px', borderRadius: '6px' }}>
                      M{mag?.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(quake.properties.time).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                    {quake.properties.place}
                  </div>
                  <div style={{ fontSize: '12px', background: '#f8f8f8', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '6px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Felt radius</span>
                      <strong>{(radius / 1000).toFixed(0)} km</strong>
                    </div>
                    <div style={{ padding: '6px 10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Depth</span>
                      <strong>{quake.geometry.coordinates[2]?.toFixed(1)} km</strong>
                    </div>
                    <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Intensity</span>
                      <strong style={{ color }}>{mag >= 5 ? 'Strong' : mag >= 3 ? 'Moderate' : 'Minor'}</strong>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <Legend />
      <RecentBanner earthquakes={earthquakes} />
    </div>
  )
}

export default EqMap