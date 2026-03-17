import translations from './translations'

function Header({ count, simActive, setSimActive, lang, setLang, onMenuClick }) {
  const t = translations[lang] || translations['en']

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
      background: 'rgba(13,17,23,0.97)', borderBottom: '1px solid #30363d',
      padding: '0 24px', height: '56px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="menu-btn"
            style={{
              display: 'none',
              background: 'transparent', border: 'none',
              color: '#e6edf3', cursor: 'pointer',
              fontSize: '18px', padding: '4px 8px'
            }}
          >
            ☰
          </button>
        )}
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: '#ef4444', boxShadow: '0 0 8px #ef4444'
        }} />
        <span style={{
          fontSize: '18px', fontWeight: 700,
          color: '#e6edf3', letterSpacing: '-0.5px'
        }}>
          {t.appName}
        </span>
        <span style={{
          fontSize: '12px', color: '#8b949e',
          background: '#21262d', padding: '2px 8px', borderRadius: '20px'
        }}>
          {t.region}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
          style={{
            fontSize: '12px', fontWeight: 600, padding: '4px 12px',
            borderRadius: '20px', border: '1px solid #30363d',
            background: '#21262d', color: '#e6edf3', cursor: 'pointer'
          }}
        >
          {lang === 'en' ? 'TR' : 'EN'}
        </button>
        <button
          onClick={() => setSimActive(!simActive)}
          style={{
            fontSize: '12px', fontWeight: 600, padding: '6px 14px',
            borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: simActive ? '#ef4444' : '#21262d',
            color: simActive ? '#fff' : '#8b949e',
            transition: 'all 0.2s'
          }}
        >
          {simActive ? t.exitSimulator : t.simulator}
        </button>
        <span className="header-meta" style={{ fontSize: '13px', color: '#8b949e' }}>
          {t.lastDays}
        </span>
        <span className="header-meta" style={{ fontSize: '15px', fontWeight: 600, color: '#e6edf3' }}>
          {count} {t.earthquakes}
        </span>
      </div>
    </div>
  )
}

export default Header