import { useState, useEffect, useRef } from 'react'
import { Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

function estimateAffected(radiusKm) {
  const base = 500
  const perKm = 8000
  return Math.min(Math.round(base + radiusKm * perKm), 80000000)
}

function formatPop(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return n.toString()
}

function FlyToLocation({ location }) {
  const map = useMap()
  const prevLocation = useRef(null)

  useEffect(() => {
    if (!map || !location) return
    const prev = prevLocation.current
    const isNew = !prev ||
      prev.lat !== location.lat ||
      prev.lng !== location.lng
    if (isNew) {
      map.flyTo([location.lat, location.lng], 8, { duration: 1.5 })
      prevLocation.current = location
    }
  }, [location, map])

  return null
}

function ClickToPlace({ active, onPlace }) {
  useMapEvents({
    click(e) {
      if (!active) return
      if (typeof onPlace !== 'function') return
      const target = e.originalEvent?.target
      if (target && (
        target.closest?.('.sim-panel') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON'
      )) return
      onPlace({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        name: `${e.latlng.lat.toFixed(2)}N, ${e.latlng.lng.toFixed(2)}E`
      })
    }
  })
  return null
}

function EpicenterMarker({ location, active }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    if (markerRef.current) {
      try { markerRef.current.remove() } catch (e) {}
      markerRef.current = null
    }
    if (!active || !location) return

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#ef4444;border:3px solid #fff;
        box-shadow:0 0 12px #ef4444;
        transform:translate(-50%,-50%);
        position:absolute;
      "></div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })

    try {
      const marker = L.marker([location.lat, location.lng], {
        icon, interactive: false, zIndexOffset: 2000
      })
      marker.addTo(map)
      markerRef.current = marker
    } catch (e) {}

    return () => {
      if (markerRef.current) {
        try { markerRef.current.remove() } catch (e) {}
        markerRef.current = null
      }
    }
  }, [location, active, map])

  return null
}

function SimulatorRings({ mag, location, active }) {
  if (!active || !location) return null
  const center = [location.lat, location.lng]
  const strongR = Math.round(Math.pow(10, 0.43 * mag - 0.8) * 1000)
  const modR = Math.round(Math.pow(10, 0.5 * mag - 0.5) * 1000)
  const feltR = Math.round(Math.pow(10, 0.5 * mag) * 1000)

  return (
    <>
      <Circle center={center} radius={feltR}
        pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.04, weight: 1, dashArray: '5 5', interactive: false }} />
      <Circle center={center} radius={modR}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1, dashArray: '4 4', interactive: false }} />
      <Circle center={center} radius={strongR}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.18, weight: 1.5, interactive: false }} />
    </>
  )
}

function CitySearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const timer = setTimeout(() => {
      setSearching(true)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(r => r.json())
        .then(data => { setResults(data); setSearching(false) })
        .catch(() => setSearching(false))
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(r) {
    const loc = {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      name: r.display_name.split(',').slice(0, 2).join(',')
    }
    onSelect(loc)
    setQuery('')
    setResults([])
  }

  return (
    <div
      style={{ position: 'relative', marginBottom: '10px' }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Search any city..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: '6px',
          border: '1px solid #30363d', background: '#161b22',
          color: '#e6edf3', fontSize: '12px', outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {searching && (
        <div style={{ fontSize: '11px', color: '#8b949e', padding: '4px 2px' }}>
          Searching...
        </div>
      )}
      {results.length > 0 && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            zIndex: 99999, background: '#161b22',
            border: '1px solid #30363d', borderRadius: '6px',
            marginTop: '2px', overflow: 'hidden'
          }}
        >
          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={e => {
                e.stopPropagation()
                e.preventDefault()
                handleSelect(r)
              }}
              style={{
                padding: '8px 10px', fontSize: '12px', color: '#e6edf3',
                cursor: 'pointer', borderBottom: '1px solid #21262d',
                userSelect: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {r.display_name.split(',').slice(0, 2).join(',')}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Simulator({ active, setActive, location, setLocation }) {
  const [mag, setMag] = useState(7.0)
  const strongR = Math.round(Math.pow(10, 0.43 * mag - 0.8))
  const feltR = Math.round(Math.pow(10, 0.5 * mag))
  const affected = estimateAffected(feltR)

  return (
    <>
      {location && <FlyToLocation location={location} />}
      <SimulatorRings mag={mag} location={location} active={active} />
      <EpicenterMarker location={location} active={active} />
      <ClickToPlace active={active} onPlace={setLocation} />

      <div
        className="sim-panel"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: '70px', right: '10px', zIndex: 1000,
          background: 'rgba(13,17,23,0.95)', border: '1px solid #30363d',
          borderRadius: '10px', padding: '14px 16px', width: '250px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8b949e' }}>
            Scenario simulator
          </span>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setActive(!active) }}
            style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 10px',
              borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: active ? '#ef4444' : '#21262d',
              color: active ? '#fff' : '#8b949e'
            }}
          >
            {active ? 'ON' : 'OFF'}
          </button>
        </div>

        {!active && (
          <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.6 }}>
            Simulate an earthquake at any location. Search a city or click anywhere on the map.
          </div>
        )}

        {active && (
          <div>
            <CitySearch onSelect={loc => {
              if (typeof setLocation === 'function') setLocation(loc)
            }} />

            <div style={{
              fontSize: '11px', color: '#8b949e', marginBottom: '10px',
              padding: '6px 8px', background: '#161b22', borderRadius: '6px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {location ? location.name : 'Search a city or click the map'}
            </div>

            {!location && (
              <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '8px', lineHeight: 1.5 }}>
                No location selected yet. Search above or click anywhere on the map to place the epicentre.
              </div>
            )}

            {location && (
              <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '8px' }}>
                Click anywhere on the map to move the epicentre
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>Magnitude</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
                  M{mag.toFixed(1)}
                </span>
              </div>
              <input
                type="range" min="5" max="8" step="0.1"
                value={mag}
                onChange={e => setMag(parseFloat(e.target.value))}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8b949e', marginTop: '2px' }}>
                <span>M5.0</span><span>M8.0</span>
              </div>
            </div>

            {location && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  background: '#161b22', borderRadius: '6px', padding: '8px 10px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#8b949e' }}>Est. affected</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>
                      {formatPop(affected)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8b949e' }}>Felt radius</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>
                      {feltR} km
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '5px' }}>
                  {[
                    ['#ef4444', 'Strong', strongR + ' km'],
                    ['#f97316', 'Moderate', ''],
                    ['#eab308', 'Felt', feltR + ' km']
                  ].map(([color, label, val]) => (
                    <div key={label} style={{
                      flex: 1, background: '#161b22', borderRadius: '6px',
                      padding: '6px 8px', borderTop: `2px solid ${color}`
                    }}>
                      <div style={{ fontSize: '10px', color: '#8b949e' }}>{label}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e6edf3', marginTop: '2px' }}>
                        {val || '—'}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '2px', lineHeight: 1.5 }}>
                  Scenario only — not a prediction.<br />Based on USGS attenuation models.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Simulator