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

// Intentionally empty until surveyed or otherwise defensible campus data is supplied.
// Illustration x/y coordinates must never be treated as geographic coordinates.
export const VERIFIED_NAVIGATION_DATA: VerifiedNavigationDataset = {
  georeference: null,
  destinationAnchors: [],
  nodes: [],
  edges: [],
}

export interface NavigationReadiness {
  ready: boolean
  missing: string[]
}

export function getNavigationReadiness(placeId: string): NavigationReadiness {
  const missing: string[] = []
  if (!VERIFIED_NAVIGATION_DATA.georeference) {
    missing.push(
      "Verified control points aligning the campus illustration with geographic coordinates",
    )
  }
  if (
    !VERIFIED_NAVIGATION_DATA.destinationAnchors.some(
      (anchor) => anchor.placeId === placeId,
    )
  ) {
    missing.push("A verified outdoor entrance coordinate for this destination")
  }
  if (
    !VERIFIED_NAVIGATION_DATA.nodes.length ||
    !VERIFIED_NAVIGATION_DATA.edges.length
  ) {
    missing.push("A connected, verified pedestrian road and pathway network")
  }
  return { ready: missing.length === 0, missing }
}

export const USER_SUPPLIED_COORDINATES = [
  {
    placeId: "entrance",
    name: "University Entrance",
    latitude: 13.171722377488813,
    longitude: 77.53620343614877,
  },
  {
    placeId: "fountain",
    name: "Central Fountain",
    latitude: 13.169278403256055,
    longitude: 77.53496157177952,
  },
  {
    placeId: "law",
    name: "School of Law",
    latitude: 13.167805266692366,
    longitude: 77.53378447210115,
  },
  {
    placeId: "management",
    name: "School of Management",
    latitude: 13.168237935126443,
    longitude: 77.53541194587899,
  },
  {
    placeId: "commerce",
    name: "School of Commerce",
    latitude: 13.168529268374115,
    longitude: 77.53515342225182,
  },
  {
    placeId: "engineering",
    name: "School of Engineering",
    latitude: 13.168182192605176,
    longitude: 77.53388533731332,
  },
  {
    placeId: "workshop",
    name: "Workshop",
    latitude: 13.169103082199717,
    longitude: 77.53406809373625,
  },
  {
    placeId: "medical",
    name: "Medical Centre",
    latitude: 13.168601690755128,
    longitude: 77.53548948885856,
  },
  {
    placeId: "auditorium",
    name: "Auditorium",
    latitude: 13.16841148379548,
    longitude: 77.53603397454,
  },
  {
    placeId: "cafeteria",
    name: "Cafeteria",
    latitude: 13.168409627431764,
    longitude: 77.53638572264869,
    note: "Verified reference point; coordinates supplied from Google Maps",
  },
  {
    placeId: "sports",
    name: "Sports Facility",
    latitude: 13.169856081757315,
    longitude: 77.53432783621912,
    note: "Coordinates supplied from Google Maps",
  },
  
  {
    placeId: "food-point-1",
    name: "Food Point",
    latitude: 13.168584831907848,
    longitude: 77.53529006472469,
    note: "Coordinates supplied from Google Maps",
  },

  {
    name: "Northern Road Junction",
    latitude: 13.171257779991308,
    longitude: 77.53606066032465,
  },
  {
    name: "Central Road Junction",
    latitude: 13.169529011094186,
    longitude: 77.53513029648337,
  },
  {
    name: "Western Road Junction",
    latitude: 13.169136289882484,
    longitude: 77.53446394185654,
  },
  {
    name: "Eastern Road Junction",
    latitude: 13.168996214503574,
    longitude: 77.53514400055137,
  },
] as const


/**
 * Draft walking network.
 * These junctions are reference points only; they do not prove
 * that a pedestrian path connects them.
 */
export const DRAFT_PEDESTRIAN_NODES: PedestrianNode[] = [
  {
    id: "north-junction",
    point: {
      latitude: 13.171257779991308,
      longitude: 77.53606066032465,
    },
  },
  {
    id: "central-junction",
    point: {
      latitude: 13.169529011094186,
      longitude: 77.53513029648337,
    },
  },
  {
    id: "west-junction",
    point: {
      latitude: 13.169136289882484,
      longitude: 77.53446394185654,
    },
  },
  {
    id: "east-junction",
    point: {
      latitude: 13.168996214503574,
      longitude: 77.53514400055137,
    },
  },
];

export const DRAFT_PEDESTRIAN_EDGES: PedestrianEdge[] = [];
