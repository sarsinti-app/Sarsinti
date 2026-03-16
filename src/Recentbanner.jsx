function timeAgo(timestamp) {
  const mins = Math.floor((Date.now() - timestamp) / 60000)
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hours ago`
  return `${Math.floor(hrs / 24)} days ago`
}

function RecentBanner({ earthquakes }) {
  if (!earthquakes.length) return null

  const recent = [...earthquakes]
    .sort((a, b) => b.properties.time - a.properties.time)[0]

  const mag = recent.properties.mag
  const place = recent.properties.place
  const color = mag >= 4 ? '#ef4444' : mag >= 2 ? '#f97316' : '#eab308'

  return (
    <div style={{
      position: 'absolute', bottom: '30px', left: '16px',
      zIndex: 1000, background: 'rgba(13,17,23,0.9)',
      border: `1px solid ${color}`, borderRadius: '8px',
      padding: '10px 14px', maxWidth: '260px'
    }}>
      <div style={{
        fontSize: '10px', color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: '5px'
      }}>
        Most recent
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: color, color: '#fff', fontWeight: 700,
          fontSize: '14px', padding: '3px 8px', borderRadius: '6px'
        }}>
          M{mag?.toFixed(1)}
        </span>
        <div>
          <div style={{
            fontSize: '12px', color: '#e6edf3', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'
          }}>
            {place}
          </div>
          <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '2px' }}>
            {timeAgo(recent.properties.time)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecentBanner