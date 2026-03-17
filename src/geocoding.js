const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

export async function searchAddress(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=tr&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK') return []
  return data.results.map(r => ({
    name: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id,
    components: r.address_components
  }))
}

export async function getPlaceDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK') return null
  const r = data.results[0]
  return {
    name: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    components: r.address_components
  }
}

export async function getBuildingData(lat, lng) {
  const radius = 50
  const query = `
    [out:json][timeout:10];
    (
      way["building"](around:${radius},${lat},${lng});
      relation["building"](around:${radius},${lat},${lng});
    );
    out body;
  `
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })
    const data = await res.json()
    if (!data.elements || data.elements.length === 0) return null
    const building = data.elements[0]
    const tags = building.tags || {}
    return {
      year: tags['start_date'] || tags['building:year'] || null,
      levels: tags['building:levels'] || null,
      material: tags['building:material'] || null,
      type: tags['building'] || null,
      source: 'OpenStreetMap',
      confidence: 'official'
    }
  } catch (e) {
    return null
  }
}

export function getDaskPremium(seismicZone, constructionType, areaSqm) {
  const rates = {
    1: { rc: 0.0022, other: 0.0044 },
    2: { rc: 0.0033, other: 0.0066 },
    3: { rc: 0.0055, other: 0.011 },
    4: { rc: 0.0083, other: 0.0166 },
    5: { rc: 0.011, other: 0.022 },
  }
  const unitCosts = { rc: 14000, other: 12000 }
  const zone = Math.min(Math.max(seismicZone, 1), 5)
  const type = constructionType === 'rc' ? 'rc' : 'other'
  const insuranceAmount = areaSqm * unitCosts[type]
  const rate = rates[zone][type]
  const annualPremium = Math.round(insuranceAmount * rate)
  return { annualPremium, insuranceAmount, zone, type }
}

export function getSeismicZone(lat, lng) {
  const zones = [
    { lat: 41.0, lng: 29.0, zone: 1 },
    { lat: 40.7, lng: 29.9, zone: 1 },
    { lat: 38.4, lng: 27.1, zone: 1 },
    { lat: 37.5, lng: 36.9, zone: 1 },
    { lat: 39.7, lng: 39.5, zone: 1 },
    { lat: 38.9, lng: 40.5, zone: 1 },
    { lat: 39.9, lng: 32.9, zone: 3 },
    { lat: 36.9, lng: 30.7, zone: 2 },
    { lat: 37.9, lng: 32.5, zone: 4 },
    { lat: 41.0, lng: 39.7, zone: 3 },
  ]
  let nearest = zones[0]
  let minDist = Infinity
  for (const z of zones) {
    const d = Math.sqrt((lat - z.lat) ** 2 + (lng - z.lng) ** 2)
    if (d < minDist) { minDist = d; nearest = z }
  }
  return nearest.zone
}

export function inferBuildingData(addressComponents, formattedAddress) {
  const address = formattedAddress?.toLowerCase() || ''
  const components = addressComponents || []

  const getComponent = (type) => {
    const c = components.find(c =>
      c.types ? c.types.includes(type) : false
    )
    return c?.long_name || c?.longText || ''
  }

  const district = getComponent('sublocality_level_1') ||
    getComponent('sublocality') ||
    getComponent('neighborhood') || ''
  const suburb = getComponent('administrative_area_level_4') ||
    getComponent('administrative_area_level_3') || ''
  const city = getComponent('locality') ||
    getComponent('administrative_area_level_1') || ''
  const postcode = getComponent('postal_code') || ''
  const postcodeNum = parseInt(postcode) || 0

  const isSitesi = address.includes('sitesi') ||
    address.includes('konutları') ||
    address.includes('evleri')
  const isNewDev = address.includes('rezidans') ||
    address.includes('plaza') ||
    address.includes('tower') ||
    address.includes('kule')
  const isGecekondu = address.includes('gecekondu') ||
    address.includes('bağ evi')

  const olderDistricts = [
    'fatih', 'eminönü', 'balat', 'fener', 'zeyrek',
    'üsküdar', 'eyüp', 'gaziosmanpaşa', 'bağcılar',
    'sultangazi', 'esenler', 'güngören', 'zeytinburnu'
  ]
  const newerDistricts = [
    'başakşehir', 'beylikdüzü', 'esenyurt', 'çekmeköy',
    'sancaktepe', 'sultanbeyli', 'ataşehir', 'ümraniye',
    'bahçeşehir', 'halkalı', 'ispartakule'
  ]

  const fullLower = `${district} ${suburb} ${address}`.toLowerCase()
  const cityLower = city.toLowerCase()

  let constructionEra = null
  let constructionType = null
  let floors = null

  if (isNewDev) {
    constructionEra = '2010–present'
    constructionType = 'Reinforced concrete'
    floors = '15+ floors'
  } else if (isSitesi) {
    constructionEra = '1995–2010'
    constructionType = 'Reinforced concrete'
    floors = '4–10 floors'
  } else if (isGecekondu) {
    constructionEra = 'Pre-1990'
    constructionType = 'Masonry / informal'
    floors = '1–2 floors'
  } else if (newerDistricts.some(d => fullLower.includes(d))) {
    constructionEra = '2000s–2015'
    constructionType = 'Reinforced concrete'
    floors = '4–12 floors'
  } else if (olderDistricts.some(d => fullLower.includes(d))) {
    constructionEra = 'Pre-1990 likely'
    constructionType = 'Reinforced concrete / masonry'
    floors = '3–7 floors'
  } else if (postcodeNum >= 34480 && postcodeNum <= 34530) {
    constructionEra = '2000s–2015'
    constructionType = 'Reinforced concrete'
    floors = '6–15 floors'
  } else if (postcodeNum >= 34080 && postcodeNum <= 34134) {
    constructionEra = 'Pre-1975 likely'
    constructionType = 'Masonry / mixed'
    floors = '3–5 floors'
  } else if (postcodeNum >= 34300 && postcodeNum <= 34340) {
    constructionEra = '1990s–2005'
    constructionType = 'Reinforced concrete'
    floors = '4–8 floors'
  } else if (cityLower.includes('ankara')) {
    constructionEra = '1980s–2000s'
    constructionType = 'Reinforced concrete'
    floors = '4–8 floors'
  } else if (cityLower.includes('izmir')) {
    constructionEra = '1980s–2000s'
    constructionType = 'Reinforced concrete'
    floors = '3–8 floors'
  } else if (cityLower.includes('antalya')) {
    constructionEra = '1990s–2010s'
    constructionType = 'Reinforced concrete'
    floors = '4–10 floors'
  } else {
    constructionEra = 'Est. 1980s–2000s'
    constructionType = 'Reinforced concrete likely'
    floors = '3–6 floors'
  }

  const preCode = constructionEra?.includes('Pre') ||
    constructionEra?.includes('1970') ||
    constructionEra?.includes('1975') ||
    constructionEra?.includes('1980')

  return {
    year: constructionEra,
    type: constructionType,
    levels: floors,
    material: constructionType?.includes('Masonry') ? 'Masonry' : 'Reinforced concrete',
    source: 'Inferred from address',
    confidence: 'estimated',
    preCode,
    isSitesi,
    isNewDev
  }
}