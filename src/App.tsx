import { useEffect, useMemo, useRef, useState } from "react"
import {
  getNavigationReadiness,
  USER_SUPPLIED_COORDINATES,
} from "./navigationData"
import RealCampusMap from "./RealCampusMap"

type Place = {
  id: string
  name: string
  category: string
  description: string
  aliases?: string[]
  x: number
  y: number
}

type Section = "map" | "explore" | "saved" | "profile"
type PanelMode = "summary" | "details"
type LocationIntent = "locate" | "directions"
type LocationStatus = "idle" | "requesting" | "available" | "low_accuracy" | "denied" | "timeout" | "unavailable" | "unsupported" | "insecure" | "error"

interface DeviceLocationFix {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface LocationState {
  status: LocationStatus
  fix: DeviceLocationFix | null
}

const PLACES: Place[] = [
  {
    id: "law",
    name: "School of Law",
    category: "Academic",
    description: "Academic building in the northern campus cluster.",
    x: 368,
    y: 179,
  },
  {
    id: "media",
    name: "School of Media Studies",
    category: "Academic",
    description:
      "Located beside the School of Law in the northern academic cluster.",
    x: 406,
    y: 226,
  },
  {
    id: "engineering",
    name: "School of Engineering",
    category: "Academic",
    description: "Academic wing on the east side of the northern campus loop.",
    x: 486,
    y: 280,
  },
  {
    id: "commerce",
    name: "School of Commerce",
    category: "Academic",
    description: "Located south of the northern academic cluster.",
    x: 386,
    y: 352,
  },
  {
    id: "management",
    name: "School of Management",
    category: "Academic",
    description: "West-side academic building close to the auditorium.",
    x: 176,
    y: 426,
  },
  {
    id: "design",
    name: "School of Design",
    category: "Academic",
    description: "East-side academic building near the Admission Office.",
    x: 492,
    y: 468,
  },
  {
    id: "auditorium",
    name: "Auditorium",
    category: "Facility",
    description: "Main university auditorium beside the School of Management.",
    x: 178,
    y: 479,
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    category: "Food & drink",
    description: "Outdoor-access cafeteria on the western campus road.",
    x: 139,
    y: 526,
  },
  {
    id: "registrar",
    name: "Office of the Registrar",
    category: "Administration",
    description: "Administrative office next to the Admission Office.",
    aliases: ["Registrar Office"],
    x: 411,
    y: 435,
  },
  {
    id: "admission",
    name: "Admission Office",
    category: "Administration",
    description:
      "Admissions office on the eastern side of the central junction.",
    x: 451,
    y: 451,
  },
  {
    id: "medical",
    name: "Medical Facility",
    category: "Service",
    description: "Campus medical support facility near the Transport Office.",
    aliases: ["Medical"],
    x: 250,
    y: 477,
  },
  {
    id: "dsa",
    name: "DSA",
    category: "Administration",
    description:
      "Directorate of Student Affairs in the central administrative cluster.",
    aliases: ["Directorate of Student Affairs"],
    x: 275,
    y: 455,
  },
  {
    id: "transport",
    name: "Transport Office",
    category: "Service",
    description: "Transport administration office near the auditorium.",
    aliases: ["Transport"],
    x: 244,
    y: 499,
  },
  {
    id: "fee",
    name: "Fee Counter",
    category: "Service",
    description: "Student fee counter near the central administrative cluster.",
    aliases: ["Fees"],
    x: 300,
    y: 493,
  },
  {
    id: "hr",
    name: "HR Office",
    category: "Administration",
    description: "Human Resources office near the central fountain junction.",
    aliases: ["Human Resources"],
    x: 345,
    y: 481,
  },
  {
    id: "fountain",
    name: "Central Fountain",
    category: "Landmark",
    description: "Circular fountain at the main internal road junction.",
    aliases: ["Fountain"],
    x: 342,
    y: 543,
  },
  {
    id: "cricket",
    name: "Cricket Pitch",
    category: "Sports",
    description: "Cricket pitch east of the central fountain.",
    x: 435,
    y: 563,
  },
  {
    id: "sports",
    name: "Sports Field",
    category: "Sports",
    description: "Outdoor sports field on the east side of the main lawn.",
    x: 430,
    y: 647,
  },
  {
    id: "hostel",
    name: "Hostel Mess",
    category: "Food & drink",
    description: "Hostel dining facility west of the main lawn.",
    x: 235,
    y: 642,
  },
  {
    id: "parking",
    name: "Parking Area",
    category: "Parking",
    description: "Campus parking area beside the Hostel Mess.",
    x: 222,
    y: 705,
  },
  {
    id: "workshop",
    name: "Workshop",
    category: "Facility",
    description: "Workshop at the northern edge of the campus loop.",
    x: 403,
    y: 83,
  },
  {
    id: "entrance",
    name: "University Entrance",
    category: "Gate",
    description: "Main entrance from the Rajanukunte–Dibbur road.",
    aliases: ["Main Entrance"],
    x: 342,
    y: 827,
  },
]


function getUserSuppliedCoordinate(placeId: string) {
  return (
    USER_SUPPLIED_COORDINATES.find(
      (coordinate) =>
        "placeId" in coordinate && coordinate.placeId === placeId,
    ) ?? null
  )
}


const QUICK_PLACES = ["fountain", "registrar", "auditorium", "engineering"]

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
      </>
    ),
    locate: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    map: (
      <>
        <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" />
        <path d="M8 3v15M16 6v15" />
      </>
    ),
    explore: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5" />
        <path d="m10 7-5 5 5 5" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    rotate: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-2.1 5" />
      </>
    ),
    building: (
      <>
        <path d="M4 21h16M6 21V9h12v12M9 9V5h6v4" />
        <path d="M9 13h2M13 13h2M9 17h2M13 17h2" />
      </>
    ),
    food: (
      <>
        <path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11" />
        <path d="M17 3v18M17 3c3 2 3 7 0 9" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM10 14h4M12 12v5M8 21h8" />
        <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-6.2 6-12a6 6 0 1 0-12 0c0 5.8 6 12 6 12Z" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function placeIcon(place: Place) {
  if (place.category === "Academic") return "building"
  if (place.category === "Administration") return "user"
  if (place.category === "Food & drink") return "food"
  if (place.category === "Sports") return "trophy"
  if (place.category === "Gate") return "compass"
  return "pin"
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
}

const SAVED_STORAGE_KEY = "presidency-campus-saved"
const RECENT_STORAGE_KEY = "presidency-campus-recent"
const PREFERENCES_STORAGE_KEY = "presidency-campus-preferences"

type Preferences = {
  voiceGuidance: boolean
  highContrast: boolean
  reduceMotion: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  voiceGuidance: false,
  highContrast: false,
  reduceMotion: false,
}

function loadStoredPlaceIds(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]")
    if (!Array.isArray(value)) return []
    const validIds = new Set(PLACES.map((place) => place.id))
    return [
      ...new Set(
        value.filter(
          (id): id is string => typeof id === "string" && validIds.has(id),
        ),
      ),
    ]
  } catch {
    return []
  }
}

function storePlaceIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // Storage may be unavailable in private browsing; in-memory state still works.
  }
}

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES
  try {
    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(
        window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}",
      ),
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function storePreferences(preferences: Preferences) {
  try {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // Preferences remain available for this session when storage is restricted.
  }
}

function useDeviceLocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    fix: null,
  })
  const watchId = useRef<number | null>(null)

  const applyPosition = (position: GeolocationPosition) => {
    const fix = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    }
    setState({ status: fix.accuracy <= 50 ? "available" : "low_accuracy", fix })
  }

  const applyError = (error: GeolocationPositionError) => {
    const status: LocationStatus =
      error.code === error.PERMISSION_DENIED
        ? "denied"
        : error.code === error.TIMEOUT
          ? "timeout"
          : error.code === error.POSITION_UNAVAILABLE
            ? "unavailable"
            : "error"
    setState((current) => ({ ...current, status }))
  }

  const canUseLocation = () => {
    if (!window.isSecureContext) {
      setState({ status: "insecure", fix: null })
      return false
    }
    if (!navigator.geolocation) {
      setState({ status: "unsupported", fix: null })
      return false
    }
    return true
  }

  const requestCurrentPosition = () => {
    if (!canUseLocation()) return
    setState((current) => ({ ...current, status: "requesting" }))
    navigator.geolocation.getCurrentPosition(applyPosition, applyError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000,
    })
  }

  const stopWatching = () => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }

  // Reserved for a future verified route. It must only be called while navigation is active.
  const startWatching = () => {
    if (!canUseLocation()) return
    stopWatching()
    setState((current) => ({ ...current, status: "requesting" }))
    watchId.current = navigator.geolocation.watchPosition(
      applyPosition,
      applyError,
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 3_000,
      },
    )
  }

  useEffect(() => stopWatching, [])

  return { ...state, requestCurrentPosition, startWatching, stopWatching }
}

type MapLabelSpec = {
  id: string
  x: number
  y: number
  lines: string[]
  kind?: "building" | "facility" | "landmark"
  leader?: [number, number]
}

const MAP_LABELS: MapLabelSpec[] = [
  { id: "workshop", x: 401, y: 87, lines: ["WORKSHOP"], kind: "facility" },
  { id: "law", x: 375, y: 178, lines: ["SCHOOL", "OF LAW"] },
  { id: "media", x: 414, y: 230, lines: ["SCHOOL OF", "MEDIA STUDIES"] },
  { id: "engineering", x: 486, y: 326, lines: ["SCHOOL OF", "ENGINEERING"] },
  { id: "commerce", x: 374, y: 337, lines: ["SCHOOL OF", "COMMERCE"] },
  { id: "management", x: 160, y: 438, lines: ["SCHOOL OF", "MANAGEMENT"] },
  { id: "design", x: 493, y: 433, lines: ["SCHOOL OF", "DESIGN"] },
  { id: "auditorium", x: 165, y: 486, lines: ["AUDITORIUM"], kind: "facility" },
  {
    id: "cafeteria",
    x: 108,
    y: 526,
    lines: ["CAFETERIA"],
    kind: "facility",
    leader: [143, 505],
  },
  {
    id: "registrar",
    x: 396,
    y: 417,
    lines: ["OFFICE OF THE", "REGISTRAR"],
    kind: "facility",
  },
  {
    id: "admission",
    x: 474,
    y: 455,
    lines: ["ADMISSION", "OFFICE"],
    kind: "facility",
  },
  { id: "medical", x: 227, y: 464, lines: ["MEDICAL"], kind: "facility" },
  {
    id: "transport",
    x: 240,
    y: 500,
    lines: ["TRANSPORT", "OFFICE"],
    kind: "facility",
  },
  { id: "dsa", x: 278, y: 454, lines: ["DSA"], kind: "facility" },
  { id: "fee", x: 301, y: 487, lines: ["FEE", "COUNTER"], kind: "facility" },
  { id: "hr", x: 331, y: 470, lines: ["HR", "OFFICE"], kind: "facility" },
  {
    id: "fountain",
    x: 291,
    y: 586,
    lines: ["CENTRAL FOUNTAIN"],
    kind: "landmark",
    leader: [322, 564],
  },
  {
    id: "cricket",
    x: 445,
    y: 574,
    lines: ["CRICKET", "PITCH"],
    kind: "landmark",
  },
  { id: "sports", x: 447, y: 632, lines: ["SPORTS FIELD"], kind: "landmark" },
  { id: "hostel", x: 235, y: 647, lines: ["HOSTEL MESS"], kind: "facility" },
  { id: "parking", x: 220, y: 705, lines: ["PARKING AREA"], kind: "landmark" },
  {
    id: "entrance",
    x: 355,
    y: 808,
    lines: ["UNIVERSITY", "ENTRANCE"],
    kind: "landmark",
    leader: [340, 825],
  },
]

function MapLabel({ label }: { label: MapLabelSpec }) {
  const longest = Math.max(...label.lines.map((line) => line.length))
  const width = Math.max(28, longest * 4.35 + 10)
  const height = label.lines.length * 9 + 6
  return (
    <g
      className={`map-label map-label--${label.kind ?? "building"}`}
      aria-hidden="true"
    >
      {label.leader && (
        <path
          className="map-label-leader"
          d={`M${label.leader[0]} ${label.leader[1]} L${label.x} ${label.y - 2}`}
        />
      )}
      {label.kind === "landmark" && (
        <rect
          x={label.x - width / 2}
          y={label.y - 8}
          width={width}
          height={height}
          rx="4"
        />
      )}
      <text x={label.x} y={label.y}>
        {label.lines.map((line, index) => (
          <tspan key={line} x={label.x} dy={index === 0 ? 0 : 9}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function CampusMap({
  selected,
  onSelect,
  showRoute,
  zoom,
  pan,
  onPan,
}: {
  selected: Place | null
  onSelect: (place: Place) => void
  showRoute: boolean
  zoom: number
  pan: { x: number; y: number }
  onPan: (pan: { x: number; y: number }) => void
}) {
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    startX: number
    startY: number
  } | null>(null)
  const mapPlaces = PLACES.filter(
    (place) => !["medical", "transport", "fee", "hr", "dsa"].includes(place.id),
  )
  const routePath = selected
    ? `M338 827 C326 754 319 655 322 596 C324 569 331 554 342 543 C${Math.round((342 + selected.x) / 2)} ${Math.round((543 + selected.y) / 2)} ${selected.x} ${selected.y} ${selected.x} ${selected.y}`
    : ""
  return (
    <div className="map-viewport">
      <div className="map-context">
        <span className="map-context-icon">
          <Icon name="map" size={17} />
        </span>
        <span>
          <strong>Presidency University</strong>
          <small>Outdoor campus map</small>
        </span>
      </div>
      <div
        className="map-scaler"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <svg
          className="campus-map"
          viewBox="8 30 584 858"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Illustrative vector reconstruction of the Presidency University outdoor campus plan"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = {
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              startX: pan.x,
              startY: pan.y,
          }
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.pointerId !== event.pointerId) return

          onPan({
            x: Math.max(
              -400,
              Math.min(400, drag.current.startX + event.clientX - drag.current.x),
            ),
            y: Math.max(
              -400,
              Math.min(400, drag.current.startY + event.clientY - drag.current.y),
            ),
          })
        }}
        onPointerUp={(event) => {
          if (drag.current?.pointerId === event.pointerId) {
            drag.current = null
            event.currentTarget.releasePointerCapture(event.pointerId)
         }
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
        >
          <defs>
            <linearGradient id="map-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f9f6ed" />
              <stop offset="1" stopColor="#f1eee3" />
            </linearGradient>
            <linearGradient id="road-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fffefa" />
              <stop offset=".52" stopColor="#f4f3ee" />
              <stop offset="1" stopColor="#ebece8" />
            </linearGradient>
            <pattern
              id="paper-grain"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="7" cy="11" r=".6" fill="#b8b8a9" opacity=".16" />
              <circle cx="33" cy="29" r=".5" fill="#b8b8a9" opacity=".12" />
            </pattern>
            <pattern
              id="lawn-grain"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4" cy="7" r=".65" fill="#698766" opacity=".18" />
              <circle cx="15" cy="16" r=".55" fill="#698766" opacity=".13" />
            </pattern>
            <filter
              id="building-shadow"
              x="-20%"
              y="-20%"
              width="150%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="2.2"
                stdDeviation="2"
                floodColor="#29404d"
                floodOpacity=".14"
              />
            </filter>
            <filter
              id="pin-shadow"
              x="-80%"
              y="-50%"
              width="260%"
              height="260%"
            >
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="3"
                floodColor="#142b4a"
                floodOpacity=".3"
              />
            </filter>
          </defs>
          <rect x="8" y="30" width="584" height="858" fill="url(#map-ground)" />
          <rect
            x="8"
            y="30"
            width="584"
            height="858"
            fill="url(#paper-grain)"
          />
          <path
            className="campus-boundary"
            d="M70 490 C91 445 110 408 153 399 C210 388 284 405 337 383 L338 165 C339 124 363 104 397 100 C443 95 466 119 472 164 C476 204 469 270 494 291 C513 307 548 297 558 325 C569 356 550 396 555 437 C560 478 536 500 507 506 L507 660 C468 675 417 678 382 668 C375 687 359 696 338 697 L348 824 C327 838 306 843 278 832 L256 796 C225 755 191 714 160 676 C130 640 111 598 123 556 C101 550 78 530 70 490Z"
          />
          <path
            d="M51 375 C112 360 169 367 219 348 M61 735 C115 722 158 729 201 749 M493 691 C526 679 554 680 580 690"
            className="terrain-line"
          />
          <path
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="outside-road-outline"
          />
          <path
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="outside-road"
          />
          <path
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="road-centerline"
          />

          <path
            d="M331 827 C320 775 315 705 315 615 C315 586 325 561 342 543"
            className="road-outline"
          />
          <path
            d="M331 827 C320 775 315 705 315 615 C315 586 325 561 342 543"
            className="road"
          />
          <path
            d="M342 543 C305 531 275 523 237 528 C200 533 170 562 139 539 C119 524 98 504 63 510"
            className="road-outline"
          />
          <path
            d="M342 543 C305 531 275 523 237 528 C200 533 170 562 139 539 C119 524 98 504 63 510"
            className="road"
          />
          <path
            d="M342 543 C376 537 406 519 431 505 C468 484 538 504 548 470 C553 453 542 426 546 399 C550 369 559 335 544 314 C532 297 505 307 489 296 C471 284 480 250 469 231 C453 204 461 151 447 126 C434 103 396 104 371 119 C351 131 349 154 349 192 L351 390"
            className="road-outline"
          />
          <path
            d="M342 543 C376 537 406 519 431 505 C468 484 538 504 548 470 C553 453 542 426 546 399 C550 369 559 335 544 314 C532 297 505 307 489 296 C471 284 480 250 469 231 C453 204 461 151 447 126 C434 103 396 104 371 119 C351 131 349 154 349 192 L351 390"
            className="road"
          />
          <path
            d="M139 539 C121 573 131 626 162 662 C190 694 218 737 244 775 C269 810 281 834 282 867"
            className="road-outline"
          />
          <path
            d="M139 539 C121 573 131 626 162 662 C190 694 218 737 244 775 C269 810 281 834 282 867"
            className="road"
          />
          <path
            d="M342 543 C372 573 383 605 378 644 C375 670 366 681 346 680"
            className="road-outline"
          />
          <path
            d="M342 543 C372 573 383 605 378 644 C375 670 366 681 346 680"
            className="road"
          />
          <g className="road-edge-highlight">
            <path d="M331 827 C320 775 315 705 315 615 C315 586 325 561 342 543" />
            <path d="M342 543 C305 531 275 523 237 528 C200 533 170 562 139 539 C119 524 98 504 63 510" />
            <path d="M342 543 C376 537 406 519 431 505 C468 484 538 504 548 470 C553 453 542 426 546 399 C550 369 559 335 544 314 C532 297 505 307 489 296 C471 284 480 250 469 231 C453 204 461 151 447 126 C434 103 396 104 371 119 C351 131 349 154 349 192 L351 390" />
            <path d="M139 539 C121 573 131 626 162 662 C190 694 218 737 244 775 C269 810 281 834 282 867" />
          </g>

          <path
            d="M164 553 C190 548 221 540 260 546 L304 558 L307 807 L273 798 C244 752 214 710 181 671 C151 636 137 591 164 553Z"
            className="lawn"
          />
          <path
            d="M366 127 C388 108 429 109 443 137 C451 154 449 195 458 220 C465 241 466 269 484 286 L444 300 L355 293 L354 164 C354 147 357 136 366 127Z"
            className="lawn"
          />
          <path
            d="M379 376 L431 376 L432 494 C409 508 383 522 360 526 L359 415Z"
            className="lawn"
          />
          <path
            d="M386 554 L466 521 L503 521 L499 655 L390 653 C394 615 388 580 373 557Z"
            className="lawn"
          />
          <path
            d="M164 553 C190 548 221 540 260 546 L304 558 L307 807 L273 798 C244 752 214 710 181 671 C151 636 137 591 164 553Z M366 127 C388 108 429 109 443 137 C451 154 449 195 458 220 C465 241 466 269 484 286 L444 300 L355 293 L354 164 C354 147 357 136 366 127Z M379 376 L431 376 L432 494 C409 508 383 522 360 526 L359 415Z M386 554 L466 521 L503 521 L499 655 L390 653 C394 615 388 580 373 557Z"
            fill="url(#lawn-grain)"
            pointerEvents="none"
          />

          <g className="building" filter="url(#building-shadow)">
            <path
              className="academic-building"
              d="M360 143 L387 139 L388 156 L414 155 L414 170 L444 170 L447 199 L429 200 L430 224 L448 225 L451 270 L424 270 L424 286 L394 286 L393 268 L363 269Z"
            />
            <path
              d="M386 144 L414 144 L414 164 L386 164Z M361 183 L385 183 L385 205 L361 205Z M394 213 L421 213 L421 237 L394 237Z"
              className="courtyard"
            />
            <path
              className="academic-building"
              d="M349 310 L394 309 L394 326 L432 326 L432 347 L395 347 L395 375 L351 374Z"
            />
            <path
              className="academic-building"
              d="M438 301 L527 309 L533 336 L524 355 L461 353 L461 340 L432 340Z"
            />
            <path
              className="admin-building"
              d="M356 389 L409 389 L409 432 L442 430 L447 457 L411 466 L382 451 L356 456Z"
            />
            <path
              className="academic-building"
              d="M450 400 L523 403 L531 452 L517 474 L459 469 L454 448 L438 447Z"
            />
            <path
              className="academic-building"
              d="M101 411 L157 411 L157 422 L219 422 L219 454 L185 457 L179 481 L121 479 L121 461 L99 461Z"
            />
            <path
              className="facility-building"
              d="M124 465 L205 462 L209 500 L170 512 L123 501Z"
            />
            <path
              className="service-building"
              d="M220 454 L252 450 L258 477 L226 484Z M259 445 L296 445 L300 477 L264 477Z M300 454 L337 452 L344 492 L309 497Z"
            />
            <path
              className="facility-building"
              d="M207 620 L220 617 L224 667 L210 667Z M228 618 L241 618 L244 669 L230 669Z M250 621 L263 624 L264 670 L250 670Z"
            />
            <path
              className="facility-building"
              d="M370 61 L432 61 L434 73 L448 73 L448 94 L432 95 L431 105 L371 105 L367 91 L358 91 L358 73 L369 73Z"
            />
          </g>
          <g className="architectural-detail" aria-hidden="true">
            <path d="M365 278H444M354 365H395M445 345H521M361 447H409M456 462H515M106 470H177" />
            <path d="M216 626v36M235 625v39M255 628v35" />
          </g>
          <g className="parking-bays" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <path key={index} d={`M${184 + index * 17} 685l12 20`} />
            ))}
          </g>
          <g className="sports-detail" aria-hidden="true">
            <rect x="403" y="555" width="70" height="92" rx="9" />
            <path d="M438 559v84M414 601h48" />
            <rect
              className="pitch"
              x="432"
              y="574"
              width="12"
              height="35"
              rx="4"
            />
          </g>

          <g className="fountain">
            <circle className="fountain-plaza" cx="342" cy="543" r="31" />
            <circle className="fountain-basin" cx="342" cy="543" r="20" />
            <circle className="fountain-water" cx="342" cy="543" r="13" />
            <path
              className="fountain-ripple"
              d="M332 543c4-5 16-5 20 0M336 548c3-2 9-2 12 0"
            />
            <circle className="fountain-jet" cx="342" cy="539" r="3.5" />
          </g>
          <g className="entrance-gate" aria-hidden="true">
            <rect x="329" y="808" width="6" height="22" rx="2" />
            <rect x="347" y="808" width="6" height="22" rx="2" />
            <path d="M335 814h12" />
          </g>
          <g className="map-labels">
            {MAP_LABELS.map((label) => (
              <MapLabel key={label.id} label={label} />
            ))}
          </g>
          <text x="61" y="894" className="road-label">
            FROM RAJANUKUNTE
          </text>
          <text x="489" y="885" className="road-label">
            TOWARDS DIBBUR
          </text>

          {showRoute && (
            <g className="route-line">
              <path d={routePath} className="route-halo" />
              <path d={routePath} />
              <circle className="route-start-halo" cx="338" cy="827" r="10" />
              <circle className="route-start" cx="338" cy="827" r="5" />
              {selected && (
                <circle
                  className="route-end"
                  cx={selected.x}
                  cy={selected.y}
                  r="7"
                />
              )}
            </g>
          )}

          {mapPlaces.map((place) => {
            const active = place.id === selected?.id
            return (
              <g
                key={place.id}
                className={`place-hit ${active ? "is-active" : ""}`}
                onClick={() => onSelect(place)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    onSelect(place)
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${place.name}`}
              >
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={active ? 17 : 12}
                  className="place-ring"
                />
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={active ? 7 : 4.5}
                  className="place-dot"
                />
              </g>
            )
          })}
          {selected && (
            <g
              className="selected-pin"
              filter="url(#pin-shadow)"
              transform={`translate(${selected.x} ${selected.y - 5})`}
            >
              <path d="M0 15S-13 2-13-7a13 13 0 1 1 26 0C13 2 0 15 0 15Z" />
              <circle cy="-7" r="4" />
            </g>
          )}
        </svg>
      </div>
      <div className="map-attribution">
        ILLUSTRATIVE SITE-PLAN RECONSTRUCTION · NOT GEOREFERENCED
      </div>
    </div>
  )
}

const ISO_MATRIX = "matrix(.5 .2 -.2 .48 270 20)"
const ISO_ROADS = [
  "M331 827 C320 775 315 705 315 615 C315 586 325 561 342 543",
  "M342 543 C305 531 275 523 237 528 C200 533 170 562 139 539 C119 524 98 504 63 510",
  "M342 543 C376 537 406 519 431 505 C468 484 538 504 548 470 C553 453 542 426 546 399 C550 369 559 335 544 314 C532 297 505 307 489 296 C471 284 480 250 469 231 C453 204 461 151 447 126 C434 103 396 104 371 119 C351 131 349 154 349 192 L351 390",
  "M139 539 C121 573 131 626 162 662 C190 694 218 737 244 775 C269 810 281 834 282 867",
  "M342 543 C372 573 383 605 378 644 C375 670 366 681 346 680",
]
const ISO_ROAD_NETWORK = ISO_ROADS.join(" ")
const ISO_LAWNS = [
  "M164 553 C190 548 221 540 260 546 L304 558 L307 807 L273 798 C244 752 214 710 181 671 C151 636 137 591 164 553Z",
  "M366 127 C388 108 429 109 443 137 C451 154 449 195 458 220 C465 241 466 269 484 286 L444 300 L355 293 L354 164 C354 147 357 136 366 127Z",
  "M379 376 L431 376 L432 494 C409 508 383 522 360 526 L359 415Z",
  "M386 554 L466 521 L503 521 L499 655 L390 653 C394 615 388 580 373 557Z",
]
const ISO_BUILDINGS = [
  {
    id: "north",
    kind: "academic",
    height: 14,
    d: "M360 143 L387 139 L388 156 L414 155 L414 170 L444 170 L447 199 L429 200 L430 224 L448 225 L451 270 L424 270 L424 286 L394 286 L393 268 L363 269Z",
  },
  {
    id: "commerce",
    kind: "academic",
    height: 12,
    d: "M349 310 L394 309 L394 326 L432 326 L432 347 L395 347 L395 375 L351 374Z",
  },
  {
    id: "engineering",
    kind: "academic",
    height: 15,
    d: "M438 301 L527 309 L533 336 L524 355 L461 353 L461 340 L432 340Z",
  },
  {
    id: "registrar",
    kind: "admin",
    height: 11,
    d: "M356 389 L409 389 L409 432 L442 430 L447 457 L411 466 L382 451 L356 456Z",
  },
  {
    id: "design",
    kind: "academic",
    height: 13,
    d: "M450 400 L523 403 L531 452 L517 474 L459 469 L454 448 L438 447Z",
  },
  {
    id: "management",
    kind: "academic",
    height: 13,
    d: "M101 411 L157 411 L157 422 L219 422 L219 454 L185 457 L179 481 L121 479 L121 461 L99 461Z",
  },
  {
    id: "auditorium",
    kind: "facility",
    height: 9,
    d: "M124 465 L205 462 L209 500 L170 512 L123 501Z",
  },
  {
    id: "services",
    kind: "admin",
    height: 8,
    d: "M220 454 L252 450 L258 477 L226 484Z M259 445 L296 445 L300 477 L264 477Z M300 454 L337 452 L344 492 L309 497Z",
  },
  {
    id: "hostel",
    kind: "facility",
    height: 8,
    d: "M207 620 L220 617 L224 667 L210 667Z M228 618 L241 618 L244 669 L230 669Z M250 621 L263 624 L264 670 L250 670Z",
  },
  {
    id: "workshop",
    kind: "facility",
    height: 10,
    d: "M370 61 L432 61 L434 73 L448 73 L448 94 L432 95 L431 105 L371 105 L367 91 L358 91 L358 73 L369 73Z",
  },
]
const PLACE_BUILDING: Record<string, string> = {
  law: "north",
  media: "north",
  commerce: "commerce",
  engineering: "engineering",
  registrar: "registrar",
  admission: "registrar",
  design: "design",
  management: "management",
  auditorium: "auditorium",
  cafeteria: "auditorium",
  medical: "services",
  transport: "services",
  dsa: "services",
  fee: "services",
  hr: "services",
  hostel: "hostel",
  workshop: "workshop",
}
const ISO_TREES = [
  [185, 585],
  [215, 570],
  [270, 610],
  [285, 705],
  [378, 137],
  [422, 126],
  [453, 257],
  [394, 476],
  [420, 612],
  [478, 626],
]

function projectPoint(x: number, y: number) {
  return { x: x * 0.5 - y * 0.2 + 270, y: x * 0.2 + y * 0.48 + 20 }
}

const PRIMARY_LABEL_IDS = new Set([
  "law",
  "engineering",
  "management",
  "registrar",
  "fountain",
  "entrance",
])

function layoutMapLabels(zoom: number, selectedId?: string) {
  const candidates = MAP_LABELS.filter(
    (label) =>
      zoom >= 1.1 || PRIMARY_LABEL_IDS.has(label.id) || label.id === selectedId,
  ).sort((a, b) => {
    if (a.id === selectedId) return -1
    if (b.id === selectedId) return 1
    return (
      Number(PRIMARY_LABEL_IDS.has(b.id)) - Number(PRIMARY_LABEL_IDS.has(a.id))
    )
  })
  const placed: Array<{
    label: MapLabelSpec
    x: number
    y: number
    anchorX: number
    anchorY: number
    width: number
    height: number
  }> = []

  for (const label of candidates) {
    const anchor = projectPoint(label.x, label.y)
    const width = Math.max(
      54,
      Math.max(...label.lines.map((line) => line.length)) * 4.35 + 14,
    )
    const height = label.lines.length > 1 ? 24 : 17
    const offsets =
      label.id === selectedId
        ? [
            [38, -30],
            [-38, -30],
            [40, 8],
            [-40, 8],
          ]
        : [
            [0, -24],
            [34, -22],
            [-34, -22],
            [0, 10],
            [40, 8],
            [-40, 8],
          ]

    const position = offsets.find(([dx, dy]) => {
      const x = anchor.x + dx
      const y = anchor.y + dy
      const box = {
        left: x - width / 2 - 3,
        right: x + width / 2 + 3,
        top: y - 11,
        bottom: y + height + 3,
      }
      if (box.left < 76 || box.right > 564 || box.top < 70 || box.bottom > 558)
        return false
      if (box.right > 498 && box.top < 300) return false
      if (box.left < 430 && box.right > 250 && box.top < 102) return false
      return placed.every(
        (item) =>
          box.right < item.x - item.width / 2 - 5 ||
          box.left > item.x + item.width / 2 + 5 ||
          box.bottom < item.y - 13 ||
          box.top > item.y + item.height + 5,
      )
    })

    if (position) {
      placed.push({
        label,
        x: anchor.x + position[0],
        y: anchor.y + position[1],
        anchorX: anchor.x,
        anchorY: anchor.y - 8,
        width,
        height,
      })
    }
  }
  return placed
}

function CampusMap3D({
  selected,
  onSelect,
  zoom,
  rotation,
  pan,
  onPan,
}: {
  selected: Place | null
  onSelect: (place: Place) => void
  zoom: number
  rotation: number
  pan: { x: number; y: number }
  onPan: (pan: { x: number; y: number }) => void
}) {
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    startX: number
    startY: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const selectedPoint = selected ? projectPoint(selected.x, selected.y) : null
  const selectedBuilding = selected ? PLACE_BUILDING[selected.id] : null
  const worldTransform = `translate(${pan.x} ${pan.y}) translate(336 320) rotate(${rotation}) scale(${zoom}) translate(-336 -320)`
  const visibleLabels = useMemo(
    () => layoutMapLabels(zoom, selected?.id),
    [zoom, selected?.id],
  )

  return (
    <div className="map-viewport map-viewport--3d">
      <div className="map-context">
        <span className="map-context-icon">
          <Icon name="layers" size={17} />
        </span>
        <span>
          <strong>Miniature campus</strong>
          <small>Drag to explore · illustrative heights</small>
        </span>
      </div>
      <svg
        className={`campus-map campus-map--3d ${
          isDragging ? "is-dragging" : ""
        }`}
        viewBox="35 20 580 680"
        role="img"
        aria-label="Interactive isometric outdoor campus map of Presidency University"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            startX: pan.x,
            startY: pan.y,
          }
          setIsDragging(true)
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.pointerId !== event.pointerId)
            return
          onPan({
            x: Math.max(
              -115,
              Math.min(
                115,
                drag.current.startX + (event.clientX - drag.current.x) * 1.2,
              ),
            ),
            y: Math.max(
              -95,
              Math.min(
                95,
                drag.current.startY + (event.clientY - drag.current.y) * 1.2,
              ),
            ),
          })
        }}
        onPointerUp={(event) => {
          if (drag.current?.pointerId === event.pointerId) drag.current = null
          setIsDragging(false)
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          drag.current = null
          setIsDragging(false)
        }}
      >
        <defs>
          <linearGradient id="iso-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8f5e9" />
            <stop offset="1" stopColor="#e8eadf" />
          </linearGradient>
          <linearGradient id="iso-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c8edf0" />
            <stop offset="1" stopColor="#57a9bd" />
          </linearGradient>
          <filter id="iso-shadow" x="-30%" y="-30%" width="180%" height="190%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="7"
              floodColor="#203a42"
              floodOpacity=".18"
            />
          </filter>
          <filter
            id="iso-pin-shadow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#142b4a"
              floodOpacity=".35"
            />
          </filter>
        </defs>
        <rect width="680" height="700" fill="url(#iso-ground)" />
        <g className="campus-world" transform={worldTransform}>
          <ellipse
            cx="336"
            cy="320"
            rx="258"
            ry="249"
            className="world-shadow"
          />
          <path
            transform={ISO_MATRIX}
            className="iso-campus-base"
            d="M70 490 C91 445 110 408 153 399 C210 388 284 405 337 383 L338 165 C339 124 363 104 397 100 C443 95 466 119 472 164 C476 204 469 270 494 291 C513 307 548 297 558 325 C569 356 550 396 555 437 C560 478 536 500 507 506 L507 660 C468 675 417 678 382 668 C375 687 359 696 338 697 L348 824 C327 838 306 843 278 832 L256 796 C225 755 191 714 160 676 C130 640 111 598 123 556 C101 550 78 530 70 490Z"
          />

          {ISO_LAWNS.map((d, index) => (
            <path
              key={index}
              transform={ISO_MATRIX}
              d={d}
              className="iso-lawn"
            />
          ))}
          <path
            transform={ISO_MATRIX}
            d="M386 554 L466 521 L503 521 L499 655 L390 653 C394 615 388 580 373 557Z"
            className="iso-sports-field"
          />

          <path
            transform={ISO_MATRIX}
            d={ISO_ROAD_NETWORK}
            className="iso-road-bed"
          />
          <path
            transform={ISO_MATRIX}
            d={ISO_ROAD_NETWORK}
            className="iso-road-surface"
          />
          <path
            transform={ISO_MATRIX}
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="iso-external-road-edge"
          />
          <path
            transform={ISO_MATRIX}
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="iso-external-road"
          />
          <path
            transform={ISO_MATRIX}
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            className="iso-lane-marking"
          />

          <g className="iso-trees" aria-hidden="true">
            {ISO_TREES.map(([x, y], index) => {
              const point = projectPoint(x, y)
              return (
                <g
                  key={index}
                  transform={`translate(${point.x} ${point.y - 4})`}
                >
                  <ellipse
                    cx="3"
                    cy="6"
                    rx="7"
                    ry="3"
                    className="tree-shadow"
                  />
                  <rect x="-1" y="-1" width="2" height="7" rx="1" />
                  <circle cx="0" cy="-5" r={index % 3 === 0 ? 7 : 6} />
                  <circle cx="-4" cy="-2" r="4" />
                </g>
              )
            })}
          </g>

          <g className="iso-buildings" filter="url(#iso-shadow)">
            {ISO_BUILDINGS.map((building) => (
              <g
                key={building.id}
                className={`iso-building iso-building--${building.kind} ${
                  selectedBuilding === building.id ? "is-selected" : ""
                }`}
              >
                {Array.from({ length: building.height }, (_, layer) => (
                  <g key={layer} transform={`translate(0 ${-layer})`}>
                    <path
                      transform={ISO_MATRIX}
                      d={building.d}
                      className="iso-building-side"
                    />
                  </g>
                ))}
                <g transform={`translate(0 ${-building.height})`}>
                  <path
                    transform={ISO_MATRIX}
                    d={building.d}
                    className="iso-building-roof"
                  />
                  <path
                    transform={ISO_MATRIX}
                    d={building.d}
                    className="iso-building-roof-line"
                  />
                </g>
              </g>
            ))}
          </g>

          <g
            className="iso-fountain"
            transform={`translate(${projectPoint(342, 543).x} ${projectPoint(342, 543).y - 4})`}
          >
            <ellipse cy="5" rx="25" ry="13" className="fountain-plinth" />
            <ellipse cy="0" rx="21" ry="11" className="fountain-rim" />
            <ellipse cy="-2" rx="16" ry="8" className="fountain-pool" />
            <path d="M-9-3Q0-14 9-3M0-3V-18" className="fountain-spray" />
            <circle cy="-19" r="2.5" className="fountain-drop" />
          </g>

          <g className="iso-labels">
            {visibleLabels.map(
              ({ label, x, y, anchorX, anchorY, width, height }) => {
                const important = PRIMARY_LABEL_IDS.has(label.id)
                return (
                  <g
                    key={label.id}
                    className={`iso-label ${
                      important ? "iso-label--major" : "iso-label--detail"
                    } ${label.id === selected?.id ? "is-selected" : ""}`}
                    transform={`translate(${x} ${y})`}
                  >
                    {(Math.abs(x - anchorX) > 8 ||
                      Math.abs(y - anchorY) > 12) && (
                      <path
                        className="iso-label-leader"
                        d={`M0 2 L${anchorX - x} ${anchorY - y}`}
                      />
                    )}
                    <rect
                      x={-width / 2}
                      y="-8"
                      width={width}
                      height={height}
                      rx="7"
                    />
                    <text y="3">
                      {label.lines.map((line, index) => (
                        <tspan key={line} x="0" dy={index === 0 ? 0 : 9}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )
              },
            )}
          </g>

          {PLACES.map((place) => {
            const point = projectPoint(place.x, place.y)
            const active = selected?.id === place.id
            const showMarker =
              active || zoom >= 1.1 || PRIMARY_LABEL_IDS.has(place.id)
            return (
              <g
                key={place.id}
                className={`iso-place ${active ? "is-active" : ""}`}
                transform={`translate(${point.x} ${point.y - 12})`}
                onClick={() => onSelect(place)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    onSelect(place)
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${place.name}`}
              >
                <circle r="13" className="iso-place-hit" />
                {showMarker && (
                  <circle r={active ? 5 : 3} className="iso-place-dot" />
                )}
              </g>
            )
          })}

          {selected && selectedPoint && (
            <g
              className="iso-selected"
              filter="url(#iso-pin-shadow)"
              transform={`translate(${selectedPoint.x} ${selectedPoint.y - 25})`}
            >
              <ellipse cy="20" rx="11" ry="4" />
              <path d="M0 14S-12 2-12-7a12 12 0 1 1 24 0C12 2 0 14 0 14Z" />
              <circle cy="-7" r="4" />
            </g>
          )}
        </g>
      </svg>
      <div className="map-gesture-hint">
        DRAG TO PAN · USE CONTROLS TO ROTATE AND ZOOM
      </div>
      <div className="map-attribution">
        ISOMETRIC PROTOTYPE · HEIGHTS ILLUSTRATIVE · NOT GEOREFERENCED
      </div>
    </div>
  )
}

function SearchPanel({
  onClose,
  onSelect,
  recentIds,
}: {
  onClose: () => void
  onSelect: (place: Place) => void
  recentIds: string[]
}) {
  const [query, setQuery] = useState("")
  const normalized = normalizeSearch(query)
  const results = useMemo(() => {
    if (!normalized) {
      const suggestions = (recentIds.length ? recentIds : QUICK_PLACES)
        .map((id) => PLACES.find((place) => place.id === id))
        .filter((place): place is Place => Boolean(place))
      return suggestions
    }
    return PLACES.map((place) => {
      const name = normalizeSearch(place.name)
      const aliases = (place.aliases ?? []).map(normalizeSearch)
      let score = Number.POSITIVE_INFINITY
      if (name === normalized) score = 0
      else if (name.startsWith(normalized)) score = 1
      else if (name.includes(normalized)) score = 2
      else if (
        aliases.some(
          (alias) => alias === normalized || alias.startsWith(normalized),
        )
      )
        score = 1
      else if (aliases.some((alias) => alias.includes(normalized))) score = 2
      else if (normalizeSearch(place.category).includes(normalized)) score = 3
      return { place, score }
    })
      .filter(({ score }) => Number.isFinite(score))
      .sort(
        (a, b) => a.score - b.score || a.place.name.localeCompare(b.place.name),
      )
      .map(({ place }) => place)
  }, [normalized, recentIds])

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search campus"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose()
      }}
    >
      <div className="search-panel">
        <div className="search-panel-top">
          <button
            className="icon-button flat"
            onClick={onClose}
            aria-label="Close search"
          >
            <Icon name="back" />
          </button>
          <div className="search-input active">
            <Icon name="search" size={19} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && results[0]) onSelect(results[0])
              }}
              placeholder="Where do you want to go?"
              aria-label="Search campus locations"
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button
                className="inline-close"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={17} />
              </button>
            )}
          </div>
        </div>
        <div className="results-head">
          <span>
            {normalized
              ? `${results.length} matching ${
                  results.length === 1 ? "place" : "places"
                }`
              : recentIds.length
                ? "Recently viewed"
                : "Suggested places"}
          </span>
          <span>Outdoor locations</span>
        </div>
        <div className="results-list" aria-live="polite">
          {results.map((place) => (
            <button
              key={place.id}
              className="result-row"
              onClick={() => onSelect(place)}
            >
              <span className="result-icon">
                <Icon name={placeIcon(place)} size={18} />
              </span>
              <span>
                <strong>{place.name}</strong>
                <small>{place.category}</small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          ))}
          {!results.length && (
            <div className="empty-state">
              <Icon name="search" size={26} />
              <strong>No campus locations found</strong>
              <span>
                Check the spelling or try another verified destination.
              </span>
              <button onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LocationDialog({
  intent,
  place,
  requested,
  location,
  onRequest,
  onClose,
}: {
  intent: LocationIntent
  place: Place | null
  requested: boolean
  location: LocationState
  onRequest: () => void
  onClose: () => void
}) {
  const readiness = place ? getNavigationReadiness(place.id) : null
  const suppliedCoordinate = place
  ? getUserSuppliedCoordinate(place.id)
  : null
  const isFix =
    location.status === "available" || location.status === "low_accuracy"
  const errorContent: Partial<Record<LocationStatus, {
    title: string
    body: string
  }>> = {
    denied: {
      title: "Location permission denied",
      body: "Allow location access for this site in your browser settings, then try again.",
    },
    timeout: {
      title: "Location request timed out",
      body: "Move to an open outdoor area and try again. Buildings can delay satellite fixes.",
    },
    unavailable: {
      title: "Location is unavailable",
      body: "Your device could not provide a location fix. Check that location services are enabled.",
    },
    unsupported: {
      title: "Location is not supported",
      body: "This browser does not expose the Geolocation API.",
    },
    insecure: {
      title: "A secure connection is required",
      body: "Browser geolocation requires HTTPS in production. Localhost is allowed for development.",
    },
    error: {
      title: "Location could not be read",
      body: "An unexpected location error occurred. Please try again.",
    },
  }
  const error = errorContent[location.status]

  return (
    <div
      className="location-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Device location"
    >
      <section className="location-dialog">
        <button
          className="location-close"
          onClick={onClose}
          aria-label="Close location dialog"
        >
          <Icon name="close" size={18} />
        </button>
        
        

        {intent === "directions" && readiness && !readiness.ready ? (
          <>
            <span className="location-symbol is-warning">
              <Icon name="info" size={23} />
            </span>
            <span className="eyebrow">ROUTING DATA REQUIRED</span>
            <h2>Real walking directions are not available yet</h2>
            <p>
              Your location was not requested because a verified route cannot
              currently be calculated for {place?.name}.
            </p>
            <div className="navigation-blocker">
              <strong>Required campus data</strong>
              <ul>
                {readiness.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="location-actions">
              {suppliedCoordinate && (
                <button
                  className="primary-action"
                  onClick={() => {
                    const origin = "13.171722377488813,77.53620343614877";
                    const url = new URL("https://www.google.com/maps/dir/");
                    url.searchParams.set("api", "1");
                    url.searchParams.set("origin", origin);
                    url.searchParams.set(
                      "destination",
                      `${suppliedCoordinate.latitude},${suppliedCoordinate.longitude}`,
                    );
                    url.searchParams.set("travelmode", "walking");
                    window.open(url.toString(), "_blank", "noopener,noreferrer");
                  }}
                >
                  Open walking directions in Google Maps
                  <Icon name="arrow" size={17} />
                </button>
            )}

            <button className="secondary-action" onClick={onClose}>
              Return to map
            </button>
</div>

          </>
        ) : !requested ? (
          <>
            <span className="location-symbol">
              <Icon name="locate" size={23} />
            </span>
            <span className="eyebrow">
              {intent === "directions"
                ? "OUTDOOR DIRECTIONS"
                : "DEVICE LOCATION"}
            </span>
            <h2>
              {intent === "directions"
                ? `Use your location for ${place?.name ?? "directions"}?`
                : "Use your current location?"}
            </h2>
            <p>
              Your location is requested only after you continue, kept in
              memory, and not stored or sent to analytics.
            </p>
            <div className="location-privacy">
              <Icon name="info" size={16} />
              <span>
                Location requires HTTPS on a deployed website. GPS quality
                depends on your device and surroundings.
              </span>
            </div>
            <div className="location-actions">
              <button className="secondary-action" onClick={onClose}>
                Not now
              </button>
              <button className="primary-action" onClick={onRequest}>
                Continue
              </button>
            </div>
          </>
        ) : location.status === "requesting" ? (
          <div className="location-progress">
            <span className="location-spinner" />
            <h2>Finding your location</h2>
            <p>
              Waiting for a valid fix from your device. This can take longer
              near buildings.
            </p>
            <button className="secondary-action" onClick={onClose}>
              Cancel
            </button>
          </div>
        ) : error ? (
          <>
            <span className="location-symbol is-warning">
              <Icon name="info" size={23} />
            </span>
            <span className="eyebrow">LOCATION STATUS</span>
            <h2>{error.title}</h2>
            <p>{error.body}</p>
            <div className="location-actions">
              <button className="secondary-action" onClick={onClose}>
                Close
              </button>
              {!["unsupported", "insecure"].includes(location.status) && (
                <button className="primary-action" onClick={onRequest}>
                  Retry
                </button>
              )}
            </div>
          </>
        ) : isFix ? (
          <>
            <span
              className={`location-symbol ${
                location.status === "low_accuracy" ? "is-warning" : "is-ready"
              }`}
            >
              <Icon name="locate" size={23} />
            </span>
            <span className="eyebrow">REAL DEVICE LOCATION</span>
            <h2>
              {location.status === "low_accuracy"
                ? "Location found with low accuracy"
                : "Location fix received"}
            </h2>
            <p>
              Your device reported an accuracy radius of approximately ±
              {Math.round(location.fix?.accuracy ?? 0)} metres. Accuracy is not
              guaranteed.
            </p>
            {intent === "locate" ? (
              <div className="navigation-blocker">
                <strong>Not shown on the illustrated map</strong>
                <span>
                  The current 3D campus artwork has no verified geographic
                  alignment, so placing this GPS fix on it would be misleading.
                </span>
              </div>
            ) : (
              <div className="navigation-blocker">
                <strong>Walking route unavailable</strong>
                <span>
                  A real route will not be created until the required verified
                  campus data is available:
                </span>
                <ul>
                  {readiness?.missing.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
            <div className="location-actions">
              <button className="secondary-action" onClick={onClose}>
                Return to map
              </button>
              {location.status === "low_accuracy" && (
                <button className="primary-action" onClick={onRequest}>
                  Retry location
                </button>
              )}
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function DestinationPanel({
  place,
  mode,
  onMode,
  onClose,
  isSaved,
  onToggleSave,
  onDirections,
}: {
  place: Place | null
  mode: PanelMode
  onMode: (mode: PanelMode) => void
  onClose: () => void
  isSaved?: boolean
  onToggleSave?: (place: Place) => void
  onDirections?: (place: Place) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside
      className={`destination-panel ${place ? "has-place" : ""} ${
        collapsed ? "is-collapsed" : ""
      }`}
    >
      <button
        className="sheet-handle"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={
          collapsed ? "Expand destination panel" : "Collapse destination panel"
        }
      />
      {!place ? (
        <div className="empty-panel">
          <span className="eyebrow">CAMPUS MAP</span>
          <h2>Explore your campus</h2>
          <p>Search for a building or select a place on the map.</p>
          <div className="quick-label">QUICK PLACES</div>
          <div className="quick-places">
            {QUICK_PLACES.map((id) => (
              <span key={id}>
                {PLACES.find((placeItem) => placeItem.id === id)?.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button
            className={`panel-save ${isSaved ? "is-saved" : ""}`}
            onClick={() => onToggleSave?.(place)}
            aria-label={
              isSaved
                ? `Remove ${place.name} from saved places`
                : `Save ${place.name}`
            }
          >
            <Icon name="bookmark" size={17} />
          </button>
          <button
            className="panel-close"
            onClick={onClose}
            aria-label="Close destination panel"
          >
            <Icon name="close" size={18} />
          </button>
          <span className="category-pill">{place.category}</span>
          <h2>{place.name}</h2>
          <p>
            {mode === "details"
              ? place.description
              : "Select an action to learn more or request real outdoor directions."}
          </p>
          {mode === "details" && (
            <div className="data-status">
              <Icon name="info" size={16} />
              <span>
                <strong>Location source</strong> Mapped from the supplied campus
                plan. Hours, contacts and live availability are not provided.
              </span>
            </div>
          )}
          <div className="panel-actions">
            <button
              className="secondary-action"
              onClick={() => onMode(mode === "details" ? "summary" : "details")}
            >
              {mode === "details" ? "Back" : "View details"}
            </button>
            <button
              className="primary-action"
              onClick={() => onDirections?.(place)}
            >
              Get directions <Icon name="arrow" size={17} />
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

const EXPLORE_FILTERS = [
  { id: "all", label: "All places", categories: [] },
  { id: "academic", label: "Academic Buildings", categories: ["Academic"] },
  {
    id: "administration",
    label: "Administrative Offices",
    categories: ["Administration"],
  },
  { id: "food", label: "Food Facilities", categories: ["Food & drink"] },
  { id: "sports", label: "Sports & Recreation", categories: ["Sports"] },
  {
    id: "other",
    label: "Other Facilities",
    categories: ["Facility", "Service", "Landmark", "Parking", "Gate"],
  },
] as const

function PlaceListRow({
  place,
  onSelect,
  removable,
  onRemove,
}: {
  place: Place
  onSelect: (place: Place) => void
  removable?: boolean
  onRemove?: (place: Place) => void
}) {
  return (
    <div className="place-row">
      <button className="place-row-main" onClick={() => onSelect(place)}>
        <span className="place-grid-icon">
          <Icon name={placeIcon(place)} size={18} />
        </span>
        <span>
          <strong>{place.name}</strong>
          <small>{place.category}</small>
        </span>
        <Icon name="arrow" size={17} />
      </button>
      {removable && (
        <button
          className="place-row-remove"
          onClick={() => onRemove?.(place)}
          aria-label={`Remove ${place.name} from saved places`}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

function SectionPanel({
  section,
  onSelect,
  savedIds,
  onToggleSave,
  recentIds,
  onClearRecent,
  preferences,
  onPreference,
}: {
  section: Exclude<Section, "map">
  onSelect: (place: Place) => void
  savedIds: string[]
  onToggleSave: (place: Place) => void
  recentIds: string[]
  onClearRecent: () => void
  preferences: Preferences
  onPreference: (key: keyof Preferences, value: boolean) => void
}) {
  const [filter, setFilter] = useState("all")
  const activeFilter =
    EXPLORE_FILTERS.find((item) => item.id === filter) ?? EXPLORE_FILTERS[0]
  const places =
    section === "saved"
      ? savedIds
          .map((id) => PLACES.find((place) => place.id === id))
          .filter((place): place is Place => Boolean(place))
      : section === "explore"
        ? PLACES.filter(
            (place) =>
              !activeFilter.categories.length ||
              (activeFilter.categories as readonly string[]).includes(
                place.category,
              ),
          )
        : []

  const title =
    section === "explore"
      ? "Explore campus"
      : section === "saved"
        ? "Saved places"
        : "Profile"
  const copy =
    section === "explore"
      ? "Browse verified outdoor destinations by category."
      : section === "saved"
        ? "Your saved destinations are stored on this device."
        : "Prototype preferences for the campus map."

  return (
    <section className="section-panel">
      <span className="eyebrow">
        {section === "profile" ? "PREFERENCES" : "PRESIDENCY UNIVERSITY"}
      </span>
      <h2>{title}</h2>
      <p>{copy}</p>
      {section === "profile" ? (
        <>
          <div className="preference-list">
            <label>
              <span>
                <strong>Voice guidance</strong>
                <small>
                  Used only when verified turn-by-turn routing becomes
                  available.
                </small>
              </span>
              <input
                type="checkbox"
                checked={preferences.voiceGuidance}
                onChange={(event) =>
                  onPreference("voiceGuidance", event.target.checked)
                }
              />
            </label>
            <label>
              <span>
                <strong>Higher contrast</strong>
                <small>
                  Strengthens controls and text for outdoor readability.
                </small>
              </span>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(event) =>
                  onPreference("highContrast", event.target.checked)
                }
              />
            </label>
            <label>
              <span>
                <strong>Reduce motion</strong>
                <small>Minimizes map and panel transitions.</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(event) =>
                  onPreference("reduceMotion", event.target.checked)
                }
              />
            </label>
          </div>
          <div className="privacy-card">
            <strong>Privacy by default</strong>
            <span>
              Favorites and preferences stay in this browser. Precise GPS
              history is never stored.
            </span>
          </div>
          <div className="recent-heading">
            <span>
              <strong>Recently selected</strong>
              <small>Selections are not treated as visits.</small>
            </span>
            {recentIds.length > 0 && (
              <button onClick={onClearRecent}>Clear</button>
            )}
          </div>
          <div className="place-grid compact">
            {recentIds
              .map((id) => PLACES.find((place) => place.id === id))
              .filter((place): place is Place => Boolean(place))
              .map((place) => (
                <PlaceListRow
                  key={place.id}
                  place={place}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </>
      ) : (
        <>
          {section === "explore" && (
            <button
              className="medical-callout"
              onClick={() =>
                onSelect(PLACES.find((place) => place.id === "medical")!)
              }
            >
              <span className="location-symbol is-ready">
                <Icon name="pin" size={20} />
              </span>
              <span>
                <strong>Find the medical facility</strong>
                <small>
                  Mapped campus service · not an emergency response system
                </small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          )}
          {section === "explore" && (
            <div className="filter-chips" aria-label="Explore categories">
              {EXPLORE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  className={filter === item.id ? "active" : ""}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {places.length ? (
            <div className="place-grid">
              {places.map((place) => (
                <PlaceListRow
                  key={place.id}
                  place={place}
                  onSelect={onSelect}
                  removable={section === "saved"}
                  onRemove={onToggleSave}
                />
              ))}
            </div>
          ) : (
            <div className="saved-empty">
              <span className="saved-empty-icon">
                <Icon name="bookmark" size={23} />
              </span>
              <strong>No saved places yet</strong>
              <span>
                Save a destination from its map panel for quick access here.
              </span>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function App() {
  const [section, setSection] = useState<Section>("map")
  const [selected, setSelected] = useState<Place | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>("summary")
  const [searchOpen, setSearchOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [mapMode, setMapMode] = useState<"2d" | "3d" | "real">("3d")
  const [pan2d, setPan2d] = useState({ x: 0, y: 0 })
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    loadStoredPlaceIds(SAVED_STORAGE_KEY),
  )
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadStoredPlaceIds(RECENT_STORAGE_KEY),
  )
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [locationFlow, setLocationFlow] = useState<{
    intent: LocationIntent
    place: Place | null
    requested: boolean
  } | null>(null)
  const deviceLocation = useDeviceLocation()

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", openSearch)
    return () => window.removeEventListener("keydown", openSearch)
  }, [])

  const toggleSavedPlace = (place: Place) => {
    setSavedIds((current) => {
      const next = current.includes(place.id)
        ? current.filter((id) => id !== place.id)
        : [place.id, ...current]
      storePlaceIds(SAVED_STORAGE_KEY, next)
      return next
    })
  }

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value }
      storePreferences(next)
      return next
    })
  }

  const choosePlace = (place: Place) => {
    setSelected(place)
    setPanelMode("summary")
    setSection("map")
    setSearchOpen(false)
    const point = projectPoint(place.x, place.y)
    setPan({
      x: Math.max(-70, Math.min(70, (340 - point.x) * 0.22)),
      y: Math.max(-55, Math.min(55, (290 - point.y) * 0.18)),
    })
    setRecentIds((current) => {
      const next = [place.id, ...current.filter((id) => id !== place.id)].slice(
        0,
        6,
      )
      storePlaceIds(RECENT_STORAGE_KEY, next)
      return next
    })
  }

  const navItems: Array<{ id: Section; label: string; icon: string }> = [
    { id: "map", label: "Map", icon: "map" },
    { id: "explore", label: "Explore", icon: "explore" },
    { id: "saved", label: "Saved Places", icon: "bookmark" },
    { id: "profile", label: "Profile", icon: "user" },
  ]

  return (
    <main
      className={`app-shell ${
        preferences.highContrast ? "high-contrast" : ""
      } ${preferences.reduceMotion ? "reduce-motion" : ""}`}
    >
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setSection("map")}
          aria-label="Go to map"
        >
          <span className="brand-mark">
            <Icon name="compass" size={22} />
          </span>
          <span>
            <strong>Presidency</strong>
            <small>Campus Navigator</small>
          </span>
        </button>
        <button className="desktop-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={19} />
          <span>Where do you want to go?</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? "active" : ""}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          className="header-menu"
          onClick={() => setSection("profile")}
          aria-label="Open profile"
        >
          <Icon name="user" />
        </button>
      </header>

      <div className="mobile-search-wrap">
        <button className="mobile-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={19} />
          <span>Where do you want to go?</span>
        </button>
      </div>

      <section className="workspace">
             
        <div className="map-mode-switch" role="group" aria-label="Campus map view">
          <button
            type="button"
            className={mapMode === "2d" ? "active" : ""}
            aria-pressed={mapMode === "2d"}
            onClick={() => setMapMode("2d")}
          >
            2D
          </button>

          <button
            type="button"
            className={mapMode === "3d" ? "active" : ""}
            aria-pressed={mapMode === "3d"}
            onClick={() => setMapMode("3d")}
          >
            3D
          </button>

          <button
            type="button"
            className={mapMode === "real" ? "active" : ""}
            aria-pressed={mapMode === "real"}
            onClick={() => setMapMode("real")}
          >
            Real Map
          </button>
        </div>

        {mapMode === "3d" ? (
          <CampusMap3D
            selected={selected}
            onSelect={choosePlace}
            zoom={zoom}
            rotation={rotation}
            pan={pan}
            onPan={setPan}
          />
        ) : mapMode === "2d" ? (
          <CampusMap
            selected={selected}
            onSelect={choosePlace}
            showRoute={false}
            zoom={zoom}
            pan={pan2d}
            onPan={setPan2d}
          />
        ) : (
          <RealCampusMap
            zoom={zoom}
            onSelect={(placeId) => {
              const targetId =
                placeId === "food-point-1" ? "cafeteria" : placeId;
              const place = PLACES.find((item) => item.id === targetId);

              if (place) {
                choosePlace(place);
              }
            }}
          />  
        )}

        <div className="map-controls" aria-label="Map controls">
          <button
            onClick={() => setZoom((value) => Math.min(1.42, value + 0.1))}
            aria-label="Zoom in"
          >
            <Icon name="plus" />
          </button>
          <button
            onClick={() => setZoom((value) => Math.max(0.82, value - 0.1))}
            aria-label="Zoom out"
          >
            <Icon name="minus" />
          </button>
          <button
            onClick={() =>
              setRotation((value) => (value + 8) % 360)
            }
            aria-label="Rotate map"
          >
            <Icon name="rotate" />
          </button>
          <button
            onClick={() => {
              setZoom(1)
              setRotation(0)
              setPan({ x: 0, y: 0 })
            }}
            aria-label="Reset map view"
          >
            <Icon name="compass" />
          </button>
          <button
            className="locate-control"
            onClick={() =>
              setLocationFlow({
                intent: "locate",
                place: null,
                requested: false,
              })
            }
            aria-label="Locate me"
          >
            <Icon name="locate" />
          </button>
        </div>
        {section === "map" ? (
          <DestinationPanel
            key={selected?.id ?? "empty"}
            place={selected}
            mode={panelMode}
            onMode={setPanelMode}
            isSaved={selected ? savedIds.includes(selected.id) : false}
            onToggleSave={toggleSavedPlace}
            onDirections={(place) =>
              setLocationFlow({ intent: "directions", place, requested: false })
            }
            onClose={() => {
              setSelected(null)
              setPanelMode("summary")
              setZoom(1)
              setRotation(0)
              setPan({ x: 0, y: 0 })
            }}
          />
        ) : (
          <SectionPanel
            section={section}
            onSelect={choosePlace}
            savedIds={savedIds}
            onToggleSave={toggleSavedPlace}
            recentIds={recentIds}
            onClearRecent={() => {
              setRecentIds([])
              storePlaceIds(RECENT_STORAGE_KEY, [])
            }}
            preferences={preferences}
            onPreference={updatePreference}
          />
        )}
      </section>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={section === item.id ? "active" : ""}
            onClick={() => setSection(item.id)}
          >
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {searchOpen && (
        <SearchPanel
          onClose={() => setSearchOpen(false)}
          onSelect={choosePlace}
          recentIds={recentIds}
        />
      )}
      {locationFlow && (
        <LocationDialog
          intent={locationFlow.intent}
          place={locationFlow.place}
          requested={locationFlow.requested}
          location={deviceLocation}
          onRequest={() => {
            setLocationFlow((current) =>
              current ? { ...current, requested: true } : current,
            )
            deviceLocation.startWatching()
          }}
          onClose={() => {
            deviceLocation.stopWatching()
            setLocationFlow(null)
          }}
        />
      )}
    </main>
  )
}

export default App
