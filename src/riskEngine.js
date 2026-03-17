// Major Turkey fault lines as coordinate arrays
// Each fault is [name, [[lat,lng], [lat,lng], ...]]
const FAULT_LINES = [
  ['North Anatolian Fault', [
    [41.0, 30.0], [40.8, 31.5], [40.6, 33.0],
    [40.4, 34.5], [40.2, 36.0], [39.9, 37.5],
    [39.7, 38.5], [39.5, 39.5], [39.3, 40.5]
  ]],
  ['East Anatolian Fault', [
    [37.0, 36.2], [37.5, 37.0], [38.0, 38.0],
    [38.5, 39.0], [39.0, 40.0], [39.5, 41.0],
    [40.0, 42.0], [40.5, 43.0]
  ]],
  ['West Anatolian Fault', [
    [38.4, 27.0], [38.2, 27.5], [38.0, 28.0],
    [37.8, 28.5], [37.6, 29.0], [37.4, 29.5]
  ]],
  ['Main Marmara Fault', [
    [40.9, 27.5], [40.85, 28.0], [40.8, 28.5],
    [40.75, 29.0], [40.7, 29.5], [40.65, 30.0]
  ]]
]

// Haversine formula — distance between two lat/lng points in km
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Find nearest fault line and distance to it
function nearestFault(lat, lng) {
  let minDist = Infinity
  let faultName = ''
  for (const [name, points] of FAULT_LINES) {
    for (const [fLat, fLng] of points) {
      const d = distanceKm(lat, lng, fLat, fLng)
      if (d < minDist) { minDist = d; faultName = name }
    }
  }
  return { name: faultName, distanceKm: Math.round(minDist) }
}

// Calculate fault proximity score (0-40 points)
function faultScore(distKm) {
  if (distKm < 10) return 40
  if (distKm < 25) return 35
  if (distKm < 50) return 28
  if (distKm < 100) return 20
  if (distKm < 200) return 12
  return 5
}

// Calculate recent activity score from earthquake list (0-40 points)
function activityScore(lat, lng, earthquakes) {
  let score = 0
  for (const quake of earthquakes) {
    const [qLng, qLat] = quake.geometry.coordinates
    const d = distanceKm(lat, lng, qLat, qLng)
    const mag = quake.properties.mag
    if (d < 50) score += mag * 3
    else if (d < 100) score += mag * 1.5
    else if (d < 200) score += mag * 0.5
  }
  return Math.min(Math.round(score), 40)
}

// Base regional hazard (0-20 points) from AFAD zones
function regionalScore(lat, lng) {
  // High hazard zones based on AFAD map
  const highZones = [
    [40.9, 29.0, 80],  // Istanbul
    [37.0, 35.3, 60],  // Adana
    [38.4, 27.1, 60],  // Izmir
    [37.8, 38.2, 70],  // Malatya
    [37.9, 40.7, 80],  // Bingol
    [39.9, 41.3, 75],  // Erzurum
    [40.6, 29.9, 70],  // Izmit/Kocaeli
    [37.5, 36.9, 85],  // Kahramanmaras
  ]
  let maxInfluence = 5
  for (const [zLat, zLng, hazard] of highZones) {
    const d = distanceKm(lat, lng, zLat, zLng)
    if (d < 100) {
      const influence = hazard * ((100 - d) / 100) * 0.2
      if (influence > maxInfluence) maxInfluence = influence
    }
  }
  return Math.min(Math.round(maxInfluence), 20)
}

// Main function — call this with lat, lng and earthquake list
export function calculateRisk(lat, lng, earthquakes = []) {
  const fault = nearestFault(lat, lng)
  const fScore = faultScore(fault.distanceKm)
  const aScore = activityScore(lat, lng, earthquakes)
  const rScore = regionalScore(lat, lng)
  const total = Math.min(fScore + aScore + rScore, 100)

  return {
    score: total,
    label: total >= 70 ? 'High' : total >= 40 ? 'Moderate' : 'Low',
    color: total >= 70 ? '#ef4444' : total >= 40 ? '#f97316' : '#eab308',
    nearestFault: fault.name,
    faultDistance: fault.distanceKm,
    breakdown: {
      fault: fScore,
      activity: aScore,
      regional: rScore
    }
  }
}

export function getRiskAdvice(score) {
  if (score >= 70) return [
    'Keep an emergency kit ready at all times',
    'Know your nearest evacuation route',
    'Check your building was constructed post-1999',
    'Consider earthquake insurance'
  ]
  if (score >= 40) return [
    'Prepare a basic emergency kit',
    'Identify safe spots in each room',
    'Secure heavy furniture to walls'
  ]
  return [
    'Stay informed about regional seismic activity',
    'Basic preparedness is always recommended'
  ]
}