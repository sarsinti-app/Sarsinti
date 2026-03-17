import { useState } from 'react'
import RiskChecker from './RiskChecker'
import translations from './translations'

function MagBadge({ mag }) {
  const color = mag >= 5 ? '#ef4444' : mag >= 3 ? '#f97316' : '#eab308'
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

const FILTERS = [
  { en: 'All', tr: 'Tümü', value: 0 },
  { en: '2+', tr: '2+', value: 2 },
  { en: '3+', tr: '3+', value: 3 },
  { en: '4+', tr: '4+', value: 4 },
]

function Sidebar({ earthquakes, minMag, setMinMag, selected, setSelected, lang }) {
  const [tab, setTab] = useState('feed')
  const t = translations[lang] || translations['en']
  const sorted = [...earthquakes].sort((a, b) => b.properties.mag - a.properties.mag)

  return (
    <div style={{
      position: 'fixed', top: '56px', left: 0,
      width: '300px', height: 'calc(100vh - 56px)',
      background: '#0d1117', borderRight: '1px solid #30363d',
      zIndex: 1000, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex', borderBottom: '1px solid #30363d', flexShrink: 0
      }}>
        {[['feed', t.liveFeed], ['risk', t.riskChecker]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '11px 0', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: 'transparent',
              color: tab === id ? '#e6edf3' : '#8b949e',
              borderBottom: tab === id ? '2px solid #ef4444' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <>
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #30363d',
            display: 'flex', gap: '6px', flexShrink: 0
          }}>
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => setMinMag(f.value)}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: '6px',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '12px',
                  background: minMag === f.value ? '#ef4444' : '#21262d',
                  color: minMag === f.value ? '#fff' : '#8b949e'
                }}>
                {f[lang] || f.en}
              </button>
            ))}
          </div>

          <div style={{
            padding: '8px 16px', borderBottom: '1px solid #30363d',
            fontSize: '11px', color: '#8b949e', textTransform: 'uppercase',
            letterSpacing: '0.5px', fontWeight: 600, flexShrink: 0
          }}>
            {earthquakes.length} {t.earthquakes}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {sorted.map(quake => {
              const mag = quake.properties.mag
              const place = quake.properties.place
              const time = new Date(quake.properties.time).toLocaleDateString(
                lang === 'tr' ? 'tr-TR' : 'en-GB'
              )
              const isSelected = selected?.id === quake.id
              return (
                <div
                  key={quake.id}
                  onClick={() => setSelected(quake)}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    padding: '12px 16px', borderBottom: '1px solid #21262d',
                    cursor: 'pointer', transition: 'background 0.15s',
                    background: isSelected ? '#161b22' : 'transparent',
                    borderLeft: isSelected ? '3px solid #ef4444' : '3px solid transparent'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#161b22'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <MagBadge mag={mag} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', color: '#e6edf3',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {place}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '3px' }}>
                      {time}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'risk' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <RiskChecker
            key="risk-checker"
            earthquakes={earthquakes}
            lang={lang}
          />
        </div>
      )}
    </div>
  )
}

export default Sidebar