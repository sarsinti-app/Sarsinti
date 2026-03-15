function MagBadge({ mag }) {
  const color = mag >= 4 ? '#ef4444' : mag >= 2 ? '#f97316' : '#eab308'
  return (
    <div style={{
      background: color, color: '#fff', fontWeight: 700,
      fontSize: '13px', width: '42px', height: '42px',
      borderRadius: '8px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0
    }}>
      {mag?.toFixed(1)}
    </div>
  )
}

function Sidebar({ earthquakes }) {
  const sorted = [...earthquakes].sort((a, b) => b.properties.mag - a.properties.mag)

  return (
    <div style={{
      position: 'fixed', top: '56px', left: 0,
      width: '300px', height: 'calc(100vh - 56px)',
      background: '#0d1117', borderRight: '1px solid #30363d',
      overflowY: 'auto', zIndex: 1000
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #30363d', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
        Recent earthquakes
      </div>

      {sorted.map(quake => {
        const mag = quake.properties.mag
        const place = quake.properties.place
        const time = new Date(quake.properties.time).toLocaleDateString()
        return (
          <div key={quake.id} style={{
            display: 'flex', gap: '12px', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #21262d',
            cursor: 'pointer', transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#161b22'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MagBadge mag={mag} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {place}
              </div>
              <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '3px' }}>{time}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Sidebar