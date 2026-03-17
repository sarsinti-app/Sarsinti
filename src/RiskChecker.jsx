import { useState, useEffect, useRef } from 'react'
import { calculateRisk, getRiskAdvice } from './riskEngine'
import { getBuildingData, getDaskPremium, getSeismicZone, inferBuildingData } from './geocoding'
import translations from './translations'

function ScoreRing({ score, color }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#21262d" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="16" fontWeight="700">{score}</text>
    </svg>
  )
}

function ConfidenceBadge({ level, lang }) {
  const t = translations[lang] || translations['en']
  const config = {
    official: { label: t.officialData, bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    estimated: { label: t.estimated, bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    pending: { label: t.partnershipPending, bg: 'rgba(139,148,158,0.15)', color: '#8b949e' },
  }
  const c = config[level] || config.pending
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, padding: '2px 7px',
      borderRadius: '20px', background: c.bg, color: c.color
    }}>
      {c.label}
    </span>
  )
}

function DataRow({ label, value, confidence, lang }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid #21262d'
    }}>
      <span style={{ fontSize: '12px', color: '#8b949e' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#e6edf3', fontWeight: 500 }}>{value}</span>
        <ConfidenceBadge level={confidence} lang={lang} />
      </div>
    </div>
  )
}

function AddressSearch({ onSelect, lang }) {
  const containerRef = useRef(null)
  const t = translations[lang] || translations['en']

  useEffect(() => {
    const container = containerRef.current
    if (!window.google || !container) return
    container.innerHTML = ''

    const element = new window.google.maps.places.PlaceAutocompleteElement({
      componentRestrictions: { country: 'tr' },
    })
    element.style.width = '100%'
    container.appendChild(element)

    const handleSelect = async (e) => {
      try {
        const prediction = e.placePrediction
        const place = prediction.toPlace()
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
        })
        const components = (place.addressComponents || []).map(c => ({
          long_name: c.longText || c.long_name || '',
          short_name: c.shortText || c.short_name || '',
          types: c.types || []
        }))
        onSelect({
          name: place.formattedAddress || place.displayName,
          lat: place.location.lat(),
          lng: place.location.lng(),
          components
        })
      } catch (err) {
        console.error('Place select error:', err)
      }
    }

    element.addEventListener('gmp-placeselect', handleSelect)
    element.addEventListener('gmp-select', handleSelect)

    return () => {
      element.removeEventListener('gmp-placeselect', handleSelect)
      element.removeEventListener('gmp-select', handleSelect)
      container.innerHTML = ''
    }
  }, [])

  return (
    <div style={{ marginBottom: '12px' }}>
      <div ref={containerRef} style={{ width: '100%', marginBottom: '6px' }} />
      <div style={{ fontSize: '11px', color: '#8b949e' }}>
        {t.searchHint}
      </div>
    </div>
  )
}

function RiskChecker({ earthquakes, lang = 'en' }) {
  const t = translations[lang] || translations['en']
  const [loading, setLoading] = useState(false)
  const [risk, setRisk] = useState(null)
  const [building, setBuilding] = useState(null)
  const [dask, setDask] = useState(null)
  const [address, setAddress] = useState('')
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      setGoogleReady(true)
      return
    }
    const interval = setInterval(() => {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        setGoogleReady(true)
        clearInterval(interval)
      }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  async function selectLocation(r) {
    setLoading(true)
    setRisk(null)
    setBuilding(null)
    setDask(null)
    setAddress(r.name)

    const riskResult = calculateRisk(r.lat, r.lng, earthquakes)
    setRisk(riskResult)

    let buildingData = await getBuildingData(r.lat, r.lng)
    if (!buildingData || (!buildingData.year && !buildingData.levels && !buildingData.material)) {
      buildingData = inferBuildingData(r.components || [], r.name)
    } else {
      buildingData.confidence = 'official'
    }
    setBuilding(buildingData)

    const zone = getSeismicZone(r.lat, r.lng)
    const daskResult = getDaskPremium(
      zone,
      buildingData?.material?.toLowerCase().includes('masonry') ? 'other' : 'rc',
      100
    )
    setDask(daskResult)
    setLoading(false)
  }

  function reset() {
    setRisk(null)
    setBuilding(null)
    setDask(null)
    setAddress('')
  }

  const riskLabel = risk
    ? risk.score >= 70 ? t.highRisk
      : risk.score >= 40 ? t.moderateRisk
        : t.lowRisk
    : ''

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        fontSize: '11px', color: '#8b949e', textTransform: 'uppercase',
        letterSpacing: '0.5px', fontWeight: 600, marginBottom: '12px'
      }}>
        {t.propertyRisk}
      </div>

      {!risk && !loading && (
        <div>
          <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '12px', lineHeight: 1.6 }}>
            {lang === 'tr'
              ? 'Tam sismik risk değerlendirmesi için Türkiye adresi, site adı, sokak veya posta kodu girin.'
              : 'Type any Turkey address, estate name, street or postcode for a full seismic risk assessment.'}
          </div>
          {googleReady ? (
            <AddressSearch onSelect={selectLocation} lang={lang} />
          ) : (
            <div style={{ fontSize: '12px', color: '#8b949e' }}>
              {lang === 'tr' ? 'Adres arama yükleniyor...' : 'Loading address search...'}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '13px', color: '#8b949e' }}>{t.analysingProperty}</div>
          <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>{t.checkingData}</div>
        </div>
      )}

      {risk && !loading && (
        <div>
          <div style={{
            fontSize: '11px', color: '#8b949e',
            marginBottom: '12px', lineHeight: 1.4
          }}>
            {address}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '14px', background: '#161b22',
            borderRadius: '8px', padding: '12px'
          }}>
            <ScoreRing score={risk.score} color={risk.color} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: risk.color }}>
                {riskLabel}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '2px' }}>
                {lang === 'tr' ? 'Puan' : 'Score'}: {risk.score}/100
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>
                {risk.faultDistance}{t.kmFromFault} {risk.nearestFault}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '11px', color: '#8b949e', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {t.scoreBreakdown}
            </div>
            {[
              [t.faultProximity, risk.breakdown.fault, 40],
              [t.recentActivity, risk.breakdown.activity, 40],
              [t.regionalHazard, risk.breakdown.regional, 20],
            ].map(([label, val, max]) => (
              <div key={label} style={{ marginBottom: '7px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '11px', color: '#8b949e', marginBottom: '3px'
                }}>
                  <span>{label}</span><span>{val}/{max}</span>
                </div>
                <div style={{ height: '4px', background: '#21262d', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((val / max) * 100, 100)}%`,
                    background: risk.color, borderRadius: '2px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '11px', color: '#8b949e', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {t.buildingData}
            </div>
            <div style={{
              background: '#161b22', borderRadius: '8px',
              padding: '4px 12px', marginBottom: '8px'
            }}>
              <DataRow label={t.constructionEra} value={building?.year || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')} confidence={building?.confidence || 'pending'} lang={lang} />
              <DataRow label={t.buildingType} value={building?.type || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')} confidence={building?.confidence || 'pending'} lang={lang} />
              <DataRow label={t.floors} value={building?.levels || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')} confidence={building?.confidence || 'pending'} lang={lang} />
              <DataRow label={t.material} value={building?.material || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')} confidence={building?.confidence || 'pending'} lang={lang} />
              <DataRow
                label={t.dataSource}
                value={building?.source || (lang === 'tr' ? 'Bilinmiyor' : 'Unknown')}
                confidence={building?.source === 'OpenStreetMap' ? 'official' : 'estimated'}
                lang={lang}
              />
            </div>

            {building?.preCode && (
              <div style={{
                padding: '10px 12px', marginBottom: '8px',
                background: 'rgba(239,68,68,0.1)',
                borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: '12px', color: '#ef4444', lineHeight: 1.5
              }}>
                {t.pre1999Warning}
              </div>
            )}

            {building?.isSitesi && (
              <div style={{
                padding: '10px 12px', marginBottom: '8px',
                background: 'rgba(34,197,94,0.08)',
                borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: '12px', color: '#22c55e', lineHeight: 1.5
              }}>
                {t.sitesiNote}
              </div>
            )}

            {building?.isNewDev && (
              <div style={{
                padding: '10px 12px', marginBottom: '8px',
                background: 'rgba(34,197,94,0.08)',
                borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: '12px', color: '#22c55e', lineHeight: 1.5
              }}>
                {t.newDevNote}
              </div>
            )}

            <div style={{
              padding: '10px 12px',
              background: 'rgba(139,148,158,0.08)',
              borderRadius: '6px', border: '1px solid #30363d',
              fontSize: '11px', color: '#8b949e', lineHeight: 1.6
            }}>
              <span style={{ color: '#e6edf3', fontWeight: 600 }}>
                {lang === 'tr' ? 'Tam bina özellikleri' : 'Full building specification'}
              </span>
              {' '}{t.partnershipNote}
            </div>
          </div>

          {dask && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '11px', color: '#8b949e', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {t.daskEstimate}
              </div>
              <div style={{ background: '#161b22', borderRadius: '8px', padding: '12px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#8b949e' }}>{t.annualPremium}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#e6edf3' }}>
                      ₺{dask.annualPremium.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8b949e' }}>{t.seismicZone}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: risk.color }}>
                      {lang === 'tr' ? 'Bölge' : 'Zone'} {dask.zone}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#8b949e', lineHeight: 1.5, marginBottom: '6px' }}>
                  {lang === 'tr'
                    ? 'TCIP 2026 tarife oranlarına göre. Gerçek prim inşaat türüne ve alana bağlıdır.'
                    : 'Based on TCIP 2026 tariff rates. Actual premium depends on exact construction type and floor area.'}
                </div>
                <ConfidenceBadge level="estimated" lang={lang} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '11px', color: '#8b949e', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {t.recommendations}
            </div>
            {getRiskAdvice(risk.score).map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: '8px', marginBottom: '6px',
                fontSize: '12px', color: '#e6edf3', lineHeight: 1.4
              }}>
                <span style={{ color: risk.color, flexShrink: 0 }}>▸</span>
                {tip}
              </div>
            ))}
          </div>

          <button onClick={reset} style={{
            width: '100%', padding: '8px', borderRadius: '6px',
            border: '1px solid #30363d', background: 'transparent',
            color: '#8b949e', cursor: 'pointer', fontSize: '12px'
          }}>
            {t.checkAnother}
          </button>

          <div style={{ fontSize: '10px', color: '#8b949e', marginTop: '10px', lineHeight: 1.5 }}>
            {lang === 'tr'
              ? 'Fay hattı yakınlığı, sismik aktivite ve AFAD tehlike bölgelerine dayanmaktadır. Profesyonel yapısal değerlendirmenin yerini tutmaz.'
              : 'Based on fault proximity, seismic activity and AFAD hazard zones. Not a substitute for professional structural assessment.'}
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskChecker