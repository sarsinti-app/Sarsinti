function Header({ count }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2000,
      background: 'rgba(13,17,23,0.95)',
      borderBottom: '1px solid #30363d',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '10px', height: '10px',
          borderRadius: '50%', background: '#ef4444',
          boxShadow: '0 0 8px #ef4444',
          animation: 'pulse 2s infinite'
        }}/>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.5px' }}>
          Sarsıntı
        </span>
        <span style={{ fontSize: '12px', color: '#8b949e', background: '#21262d', padding: '2px 8px', borderRadius: '20px' }}>
          Turkey
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#8b949e' }}>Last 30 days</span>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#e6edf3' }}>
          {count} earthquakes
        </span>
      </div>

    </div>
  )
}

export default Header