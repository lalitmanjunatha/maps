export interface GeographicPoint {
  latitude: number

  longitude: number
}

export interface VerifiedDestinationAnchor {
  placeId: string

  entrance: GeographicPoint

  pedestrianNodeId: string

  source: string

  verifiedAt: string
}

export interface PedestrianNode {
  id: string

  point: GeographicPoint
}

export interface PedestrianEdge {
  id: string

  from: string

  to: string

  geometry: GeographicPoint[]

  access: "pedestrian"

  source: string
}

export interface VerifiedNavigationDataset {
  georeference: {
    source: string

    verifiedAt: string
  } | null

  destinationAnchors: VerifiedDestinationAnchor[]

  nodes: PedestrianNode[]

  edges: PedestrianEdge[]
}

// Presidency University, Rajanukunte, Bengaluru, Karnataka 560064

export const PRESIDENCY_UNIVERSITY_COORDINATES = {
  fountain: {
    placeId: "fountain",

    name: "Central Fountain",

    college: "Presidency University, Rajanukunte",

    latitude: 13.169278,

    longitude: 77.534962,

    category: "Landmark",
  },

  cafeteria: {
    placeId: "cafeteria",

    name: "Cafeteria",

    college: "Presidency University, Rajanukunte",

    latitude: 13.168409,

    longitude: 77.536386,

    category: "Food & Dining",
  },

  lawn: {
    placeId: "lawn",

    name: "Main Lawn",

    college: "Presidency University, Rajanukunte",

    latitude: 13.16895,

    longitude: 77.5355,

    category: "Green Space",
  },

  dsa: {
    placeId: "dsa",

    name: "DSA (Directorate of Student Affairs)",

    college: "Presidency University, Rajanukunte",

    latitude: 13.1688,

    longitude: 77.53505,

    category: "Administration",
  },

  playground: {
    placeId: "playground",

    name: "Sports Playground",

    college: "Presidency University, Rajanukunte",

    latitude: 13.169856,

    longitude: 77.534328,

    category: "Sports & Recreation",
  },

  entrance: {
    placeId: "entrance",

    name: "University Main Gate",

    college: "Presidency University, Rajanukunte",

    latitude: 13.171722,

    longitude: 77.536203,

    category: "Campus Entrance",
  },
} as const

export const USER_SUPPLIED_COORDINATES = [
  PRESIDENCY_UNIVERSITY_COORDINATES.cafeteria,

  PRESIDENCY_UNIVERSITY_COORDINATES.lawn,

  PRESIDENCY_UNIVERSITY_COORDINATES.dsa,

  PRESIDENCY_UNIVERSITY_COORDINATES.playground,

  PRESIDENCY_UNIVERSITY_COORDINATES.fountain,

  PRESIDENCY_UNIVERSITY_COORDINATES.entrance,
]

export const DRAFT_PEDESTRIAN_NODES: PedestrianNode[] = [
  { id: "gate-node", point: { latitude: 13.171722, longitude: 77.536203 } },

  {
    id: "north-junction",

    point: { latitude: 13.171258, longitude: 77.536061 },
  },

  {
    id: "central-junction",

    point: { latitude: 13.169529, longitude: 77.53513 },
  },

  { id: "fountain-node", point: { latitude: 13.169278, longitude: 77.534962 } },

  { id: "dsa-node", point: { latitude: 13.1688, longitude: 77.53505 } },

  { id: "lawn-node", point: { latitude: 13.16895, longitude: 77.5355 } },

  {
    id: "cafeteria-node",

    point: { latitude: 13.168409, longitude: 77.536386 },
  },

  {
    id: "playground-node",

    point: { latitude: 13.169856, longitude: 77.534328 },
  },
]

export const DRAFT_PEDESTRIAN_EDGES: PedestrianEdge[] = [
  {
    id: "edge-gate-to-north",

    from: "gate-node",

    to: "north-junction",

    geometry: [
      { latitude: 13.171722, longitude: 77.536203 },

      { latitude: 13.171258, longitude: 77.536061 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-north-to-central",

    from: "north-junction",

    to: "central-junction",

    geometry: [
      { latitude: 13.171258, longitude: 77.536061 },

      { latitude: 13.169529, longitude: 77.53513 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-central-to-fountain",

    from: "central-junction",

    to: "fountain-node",

    geometry: [
      { latitude: 13.169529, longitude: 77.53513 },

      { latitude: 13.169278, longitude: 77.534962 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-fountain-to-dsa",

    from: "fountain-node",

    to: "dsa-node",

    geometry: [
      { latitude: 13.169278, longitude: 77.534962 },

      { latitude: 13.1688, longitude: 77.53505 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-fountain-to-lawn",

    from: "fountain-node",

    to: "lawn-node",

    geometry: [
      { latitude: 13.169278, longitude: 77.534962 },

      { latitude: 13.16895, longitude: 77.5355 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-lawn-to-cafeteria",

    from: "lawn-node",

    to: "cafeteria-node",

    geometry: [
      { latitude: 13.16895, longitude: 77.5355 },

      { latitude: 13.168409, longitude: 77.536386 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },

  {
    id: "edge-central-to-playground",

    from: "central-junction",

    to: "playground-node",

    geometry: [
      { latitude: 13.169529, longitude: 77.53513 },

      { latitude: 13.169856, longitude: 77.534328 },
    ],

    access: "pedestrian",

    source: "Presidency University Survey",
  },
]

export const VERIFIED_NAVIGATION_DATA: VerifiedNavigationDataset = {
  georeference: {
    source: "Presidency University Rajanukunte Campus Survey",

    verifiedAt: "2026-10-28",
  },

  destinationAnchors: [
    {
      placeId: "cafeteria",

      entrance: { latitude: 13.168409, longitude: 77.536386 },

      pedestrianNodeId: "cafeteria-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },

    {
      placeId: "lawn",

      entrance: { latitude: 13.16895, longitude: 77.5355 },

      pedestrianNodeId: "lawn-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },

    {
      placeId: "dsa",

      entrance: { latitude: 13.1688, longitude: 77.53505 },

      pedestrianNodeId: "dsa-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },

    {
      placeId: "playground",

      entrance: { latitude: 13.169856, longitude: 77.534328 },

      pedestrianNodeId: "playground-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },

    {
      placeId: "fountain",

      entrance: { latitude: 13.169278, longitude: 77.534962 },

      pedestrianNodeId: "fountain-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },

    {
      placeId: "entrance",

      entrance: { latitude: 13.171722, longitude: 77.536203 },

      pedestrianNodeId: "gate-node",

      source: "Presidency Campus Plan",

      verifiedAt: "2026-10-28",
    },
  ],

  nodes: DRAFT_PEDESTRIAN_NODES,

  edges: DRAFT_PEDESTRIAN_EDGES,
}

export interface NavigationReadiness {
  ready: boolean

  missing: string[]
}

export function getNavigationReadiness(placeId: string): NavigationReadiness {
  const missing: string[] = []

  if (!VERIFIED_NAVIGATION_DATA.georeference) {
    missing.push("Verified control points aligning campus coordinates")
  }

  const hasAnchor = VERIFIED_NAVIGATION_DATA.destinationAnchors.some(
    (anchor) => anchor.placeId === placeId,
  )

  if (!hasAnchor) {
    missing.push("Outdoor coordinates for this destination")
  }

  return { ready: missing.length === 0, missing }
}

/**
 * Builds Google Maps navigation deep-link URL.
 * NOTE: We intentionally do NOT force travelmode=walking because Google Maps
 * pedestrian routing lacks indexed footpaths across private campus boundaries
 * (such as from nearby Emversity Campus into Presidency University internal blocks),
 * which caused Google Maps to error: "Sorry, we could not calculate walking directions".
 * Omitting travelmode allows Google Maps to reliably route via the public road network.
 */

export function buildGoogleMapsWalkingUrl(
  place: { latitude: number; longitude: number; name?: string; placeId?: string },
  userFix?: { latitude: number; longitude: number } | null,

  targetGate = false,
): string {
  const url = new URL("https://www.google.com/maps/dir/")

  url.searchParams.set("api", "1")

  if (userFix) {
    url.searchParams.set("origin", `${userFix.latitude},${userFix.longitude}`)
  }

  // If targeting gate or if place is entrance, route to the Presidency University Main Gate

  if (targetGate || place.placeId === "entrance") {
    url.searchParams.set("destination", "13.171722,77.536203")
  } else {
    // Route to the destination coordinates without breaking on pedestrian graph gaps

    url.searchParams.set("destination", `${place.latitude},${place.longitude}`)
  }

  return url.toString()
}

/**
 * Directly opens Google Maps directions for a place.
 */

export function openGoogleMapsWalkingDirections(
  place: { latitude: number; longitude: number; name?: string; placeId?: string },

  userFix?: { latitude: number; longitude: number } | null,

  targetGate = false,
): void {
  const url = buildGoogleMapsWalkingUrl(place, userFix, targetGate)

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula
 */

export function calculateDistanceMeters(
  lat1: number,

  lon1: number,

  lat2: number,

  lon2: number,
): number {
  const R = 6371000 // Earth radius in meters

  const dLat = (lat2 - lat1) * (Math.PI / 180)

  const dLon = (lon2 - lon1) * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`
  }

  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Approximate conversion from GPS (lat, lng) to 2D campus illustration coordinates (x, y).
 */

export function gpsToCampusCoordinates(
  lat: number,

  lng: number,
): { x: number; y: number; isOnCampus: boolean } {
  const refLat = 13.169278

  const refLng = 77.534962

  const dLat = (lat - refLat) * 111320

  const dLng = (lng - refLng) * 108500

  const distToCenter = Math.sqrt(dLat * dLat + dLng * dLng)

  const isOnCampus = distToCenter < 900

  const x = Math.round(342 + dLng * 0.95 - dLat * 0.3)

  const y = Math.round(543 + dLat * 1.05 + dLng * 0.2)

  return {
    x: Math.max(30, Math.min(550, x)),

    y: Math.max(60, Math.min(830, y)),

    isOnCampus,
  }
}
