import { useEffect, useMemo, useRef, useState } from "react"
import {
  PRESIDENCY_UNIVERSITY_COORDINATES,
  USER_SUPPLIED_COORDINATES,
  openGoogleMapsWalkingDirections,
  calculateDistanceMeters,
  formatDistance,
  gpsToCampusCoordinates,
} from "./navigationData"
import RealCampusMap from "./RealCampusMap"

export type Place = {
  id: string
  name: string
  college: string
  category: string
  description: string
  aliases?: string[]
  x: number
  y: number
  latitude: number
  longitude: number
  icon: string
}

type Section = "map" | "explore" | "saved"
type PanelMode = "summary" | "details"
type LocationStatus =
  | "idle"
  | "requesting"
  | "available"
  | "low_accuracy"
  | "denied"
  | "timeout"
  | "unavailable"
  | "unsupported"
  | "insecure"
  | "error"

export interface DeviceLocationFix {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface LocationState {
  status: LocationStatus
  fix: DeviceLocationFix | null
  errorDetails: string | null
  source: "gps" | "network" | "preset" | null
}

// Presidency University, Rajanukunte - Key campus destinations requested by user
export const PLACES: Place[] = [
  {
    id: "cafeteria",
    name: "Cafeteria",
    college: "Presidency University, Rajanukunte",
    category: "Food & Dining",
    description:
      "Central university food court and student cafeteria at Presidency University Rajanukunte. Serves freshly prepared South & North Indian meals, fast foods, snacks, juices, and hot beverages with indoor & outdoor patio seating.",
    aliases: ["Food Court", "Canteen", "Presidency Cafeteria", "Dining", "Mess"],
    x: 140,
    y: 526,
    latitude: 13.168409,
    longitude: 77.536386,
    icon: "food",
  },
  {
    id: "lawn",
    name: "Main Lawn",
    college: "Presidency University, Rajanukunte",
    category: "Green Space",
    description:
      "Expansive, manicured central green lawn of Presidency University Rajanukunte. The primary open-air student hub for relaxing between lectures, outdoor group study, club gatherings, and campus cultural festivals.",
    aliases: ["Campus Lawn", "Green Lawn", "Central Lawn", "Lawn", "Grass"],
    x: 320,
    y: 640,
    latitude: 13.16895,
    longitude: 77.5355,
    icon: "leaf",
  },
  {
    id: "dsa",
    name: "DSA (Directorate of Student Affairs)",
    college: "Presidency University, Rajanukunte",
    category: "Administration",
    description:
      "Directorate of Student Affairs at Presidency University Rajanukunte. Central hub for student welfare, college fests, student council, cultural clubs, grievances, extracurricular activities, and student support.",
    aliases: [
      "Student Affairs",
      "DSA Office",
      "Directorate of Student Affairs",
      "Student Council",
      "Student Club",
    ],
    x: 275,
    y: 455,
    latitude: 13.1688,
    longitude: 77.53505,
    icon: "building",
  },
  {
    id: "playground",
    name: "Playground",
    college: "Presidency University, Rajanukunte",
    category: "Sports & Recreation",
    description:
      "Presidency University outdoor athletic sports playground and grounds. Features a full cricket pitch, football ground, volleyball & basketball courts, running tracks, and athletic event facilities.",
    aliases: [
      "Sports Ground",
      "Cricket Ground",
      "Football Turf",
      "Sports",
      "Athletics",
      "Ground",
    ],
    x: 435,
    y: 620,
    latitude: 13.169856,
    longitude: 77.534328,
    icon: "trophy",
  },
  {
    id: "fountain",
    name: "Central Fountain",
    college: "Presidency University, Rajanukunte",
    category: "Central Landmark",
    description:
      "Iconic circular water fountain and main landmark roundabout at Presidency University Rajanukunte. Positioned at the central junction connecting pathways to the Cafeteria, Lawn, DSA, and Academic blocks.",
    aliases: ["Fountain", "Main Fountain", "Roundabout", "Circle", "Water Fountain"],
    x: 342,
    y: 543,
    latitude: 13.169278,
    longitude: 77.534962,
    icon: "fountain",
  },
  {
    id: "entrance",
    name: "University Main Gate",
    college: "Presidency University, Rajanukunte",
    category: "Campus Entrance",
    description:
      "Main entry gate of Presidency University on Rajanukunte–Dibbur Road. Serving vehicle and pedestrian entry with 24/7 security booth and visitor reception.",
    aliases: ["Main Entrance", "Main Gate", "Gate 1", "Rajanukunte Road Entry"],
    x: 342,
    y: 827,
    latitude: 13.171722,
    longitude: 77.536203,
    icon: "compass",
  },
]

const QUICK_PLACES = ["cafeteria", "lawn", "dsa", "playground", "fountain"]

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
    map: (
      <>
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </>
    ),
    explore: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </>
    ),
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="9" y1="6" x2="9" y2="6.01" />
        <line x1="15" y1="6" x2="15" y2="6.01" />
        <line x1="9" y1="10" x2="9" y2="10.01" />
        <line x1="15" y1="10" x2="15" y2="10.01" />
        <line x1="9" y1="14" x2="9" y2="14.01" />
        <line x1="15" y1="14" x2="15" y2="14.01" />
        <path d="M10 22v-4h4v4" />
      </>
    ),
    food: (
      <>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </>
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </>
    ),
    trophy: (
      <>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
        <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </>
    ),
    fountain: (
      <>
        <path d="M12 2v6" />
        <path d="M7 6a5 5 0 0 1 10 0" />
        <path d="M4 11a8 8 0 0 1 16 0" />
        <path d="M3 15h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
      </>
    ),
    maps: (
      <>
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="currentColor"
          opacity="0.3"
        />
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    rotate: (
      <>
        <path d="M21.5 2v6h-6" />
        <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </>
    ),
    locate: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </>
    ),
    close: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    external: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.compass}
    </svg>
  )
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
}

const SAVED_STORAGE_KEY = "presidency-campus-saved"

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
    // Session fallback
  }
}

// Multi-tier, bulletproof Geolocation hook
function useDeviceLocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    fix: null,
    errorDetails: null,
    source: null,
  })
  const watchId = useRef<number | null>(null)

  const applyPosition = (
    position: GeolocationPosition,
    source: "gps" | "network" = "gps",
  ) => {
    const fix: DeviceLocationFix = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    }
    setState({
      status: fix.accuracy > 80 ? "low_accuracy" : "available",
      fix,
      errorDetails: null,
      source,
    })

    if (watchId.current !== null && typeof window !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current)
    }
    try {
      watchId.current = navigator.geolocation.watchPosition(
        (newPos) => {
          setState((prev) => ({
            ...prev,
            status: newPos.coords.accuracy > 80 ? "low_accuracy" : "available",
            fix: {
              latitude: newPos.coords.latitude,
              longitude: newPos.coords.longitude,
              accuracy: newPos.coords.accuracy,
              timestamp: newPos.timestamp,
            },
            source: "gps",
          }))
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 20000 },
      )
    } catch {}
  }

  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        status: "unsupported",
        fix: null,
        errorDetails: "Geolocation is not supported by your browser.",
        source: null,
      })
      return
    }

    setState((s) => ({ ...s, status: "requesting", errorDetails: null }))

    // First attempt: High Accuracy (GPS)
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos, "gps"),
      (err) => {
        console.warn("High accuracy GPS failed:", err.message)
        if (err.code === err.PERMISSION_DENIED) {
          setState({
            status: "denied",
            fix: null,
            errorDetails:
              "Location permission was denied. Click the lock icon (🔒) in your browser address bar to allow location.",
            source: null,
          })
          return
        }

        // Second attempt: Standard Network/WiFi Triangulation (crucial for laptops/indoor devices)
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPosition(pos, "network"),
          (secondErr) => {
            console.error("Standard network location also failed:", secondErr)
            let msg = "Could not detect location. Please check your network or GPS."
            if (secondErr.code === secondErr.PERMISSION_DENIED) {
              msg =
                "Location permission was denied. Click the lock icon (🔒) in your browser address bar to allow location."
            } else if (secondErr.code === secondErr.TIMEOUT) {
              msg = "Location request timed out. Please retry."
            }
            setState({
              status: secondErr.code === secondErr.PERMISSION_DENIED ? "denied" : "unavailable",
              fix: null,
              errorDetails: msg,
              source: null,
            })
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
        )
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 },
    )
  }

  const setManualLocation = (lat: number, lng: number) => {
    setState({
      status: "available",
      fix: {
        latitude: lat,
        longitude: lng,
        accuracy: 12,
        timestamp: Date.now(),
      },
      errorDetails: null,
      source: "preset",
    })
  }

  const stopWatching = () => {
    if (watchId.current !== null && typeof window !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }

  return { ...state, requestLocation, setManualLocation, stopWatching }
}

type MapLabelSpec = {
  id: string
  x: number
  y: number
  lines: string[]
  kind?: "building" | "landmark" | "facility"
  leader?: [number, number]
}

const MAP_LABELS: MapLabelSpec[] = [
  {
    id: "fountain",
    x: 342,
    y: 575,
    lines: ["CENTRAL FOUNTAIN"],
    kind: "landmark",
    leader: [342, 545],
  },
  {
    id: "lawn",
    x: 320,
    y: 665,
    lines: ["MAIN LAWN"],
    kind: "landmark",
  },
  {
    id: "cafeteria",
    x: 140,
    y: 555,
    lines: ["CAFETERIA"],
    kind: "facility",
    leader: [140, 526],
  },
  {
    id: "dsa",
    x: 275,
    y: 435,
    lines: ["DSA OFFICE"],
    kind: "facility",
    leader: [275, 455],
  },
  {
    id: "playground",
    x: 435,
    y: 650,
    lines: ["SPORTS PLAYGROUND"],
    kind: "landmark",
    leader: [435, 620],
  },
  {
    id: "entrance",
    x: 342,
    y: 855,
    lines: ["MAIN GATE", "(RAJANUKUNTE)"],
    kind: "landmark",
    leader: [342, 827],
  },
]

function MapLabel({ label }: { label: MapLabelSpec }) {
  const longest = Math.max(...label.lines.map((line) => line.length))
  const width = Math.max(28, longest * 4.6 + 12)
  const height = label.lines.length * 9 + 8
  return (
    <g
      className={`map-label map-label--${label.kind ?? "building"}`}
      aria-hidden="true"
    >
      {label.leader && (
        <path
          className="map-label-leader"
          d={`M${label.leader[0]} ${label.leader[1]} L${label.x} ${label.y - 4}`}
          stroke="#2563eb"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />
      )}
      <rect
        x={label.x - width / 2}
        y={label.y - 9}
        width={width}
        height={height}
        rx="5"
        fill="rgba(255,255,255,0.95)"
        stroke="#cbd5e1"
        strokeWidth="0.9"
        filter="drop-shadow(0 2px 4px rgba(20,43,74,0.12))"
      />
      <text
        x={label.x}
        y={label.y}
        fill="#1e293b"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
      >
        {label.lines.map((line, index) => (
          <tspan key={line} x={label.x} dy={index === 0 ? 0 : 9.5}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

// 2D Campus Map Component
function CampusMap({
  selected,
  userFix,
  onSelect,
  zoom,
  pan,
  onPan,
}: {
  selected: Place | null
  userFix: DeviceLocationFix | null
  onSelect: (place: Place) => void
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

  const routePath = selected
    ? `M342 827 C335 760 330 680 335 600 C338 570 340 555 342 543 C${Math.round(
        (342 + selected.x) / 2,
      )} ${Math.round((543 + selected.y) / 2)} ${selected.x} ${selected.y}`
    : ""

  const userCoords = userFix
    ? gpsToCampusCoordinates(userFix.latitude, userFix.longitude)
    : null

  return (
    <div className="map-viewport">
      <div className="map-context">
        <span className="map-context-icon">
          <Icon name="compass" size={17} />
        </span>
        <div>
          <strong>Presidency University, Rajanukunte</strong>
          <small>2D Interactive Campus View</small>
        </div>
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
          aria-label="Presidency University Rajanukunte 2D Campus Map"
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
              <stop offset="0" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="road-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".52" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="lawn-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#86efac" />
              <stop offset="1" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="sports-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#86efac" />
              <stop offset="1" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="fountain-water-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#bae6fd" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="building-shadow" x="-20%" y="-20%" width="150%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity=".15" />
            </filter>
            <filter id="pin-glow" x="-80%" y="-50%" width="260%" height="260%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2563eb" floodOpacity=".35" />
            </filter>
            <filter id="user-location-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2563eb" floodOpacity=".7" />
            </filter>
          </defs>

          {/* Campus Background Ground */}
          <rect x="8" y="30" width="584" height="858" fill="url(#map-ground)" />

          {/* Campus Boundary */}
          <path
            className="campus-boundary"
            d="M70 490 C91 445 110 408 153 399 C210 388 284 405 337 383 L338 165 C339 124 363 104 397 100 C443 95 466 119 472 164 C476 204 469 270 494 291 C513 307 548 297 558 325 C569 356 550 396 555 437 C560 478 536 500 507 506 L507 660 C468 675 417 678 382 668 C375 687 359 696 338 697 L348 824 C327 838 306 843 278 832 L256 796 C225 755 191 714 160 676 C130 640 111 598 123 556 C101 550 78 530 70 490Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Outside Road */}
          <path
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            stroke="#94a3b8"
            strokeWidth="38"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M0 873 C95 855 151 884 220 868 C282 854 301 818 343 831 C390 846 433 888 600 856"
            stroke="#cbd5e1"
            strokeWidth="34"
            strokeLinecap="round"
            fill="none"
          />

          {/* Internal Roads */}
          <path
            d="M342 827 C335 770 330 700 330 615 C330 580 335 560 342 543 M342 543 C300 535 260 525 220 530 C180 535 150 550 140 526 M342 543 C320 500 295 480 275 455 M342 543 C375 550 405 580 435 620 M342 543 C340 575 330 605 320 640"
            stroke="#cbd5e1"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M342 827 C335 770 330 700 330 615 C330 580 335 560 342 543 M342 543 C300 535 260 525 220 530 C180 535 150 550 140 526 M342 543 C320 500 295 480 275 455 M342 543 C375 550 405 580 435 620 M342 543 C340 575 330 605 320 640"
            stroke="url(#road-surface)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* MAIN LAWN */}
          <g
            className={`place-zone ${selected?.id === "lawn" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "lawn")!)}
            style={{ cursor: "pointer" }}
          >
            <path
              d="M170 560 C210 550 250 545 300 555 L305 780 C270 760 230 720 190 680 C160 640 150 600 170 560 Z"
              fill="url(#lawn-gradient)"
              stroke="#16a34a"
              strokeWidth="2.5"
              filter="url(#building-shadow)"
            />
          </g>

          {/* SPORTS PLAYGROUND */}
          <g
            className={`place-zone ${selected?.id === "playground" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "playground")!)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x="385"
              y="550"
              width="130"
              height="150"
              rx="24"
              fill="url(#sports-gradient)"
              stroke="#15803d"
              strokeWidth="2.5"
              filter="url(#building-shadow)"
            />
            <rect x="395" y="560" width="110" height="130" rx="18" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
            <rect x="440" y="590" width="20" height="70" rx="4" fill="#fed7aa" stroke="#d97706" strokeWidth="1.5" />
          </g>

          {/* CAFETERIA */}
          <g
            className={`place-zone ${selected?.id === "cafeteria" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "cafeteria")!)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x="95"
              y="490"
              width="85"
              height="75"
              rx="12"
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="2.5"
              filter="url(#building-shadow)"
            />
            <rect x="105" y="500" width="65" height="30" rx="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1.2" />
            <text x="137" y="520" textAnchor="middle" fontSize="13">🍴</text>
          </g>

          {/* DSA OFFICE */}
          <g
            className={`place-zone ${selected?.id === "dsa" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "dsa")!)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x="240"
              y="425"
              width="75"
              height="60"
              rx="10"
              fill="#faf5ff"
              stroke="#7c3aed"
              strokeWidth="2.5"
              filter="url(#building-shadow)"
            />
            <text x="277" y="452" textAnchor="middle" fontSize="13">🏛️</text>
            <text x="277" y="475" textAnchor="middle" fontSize="9" fontWeight="800" fill="#6d28d9">DSA</text>
          </g>

          {/* CENTRAL FOUNTAIN */}
          <g
            className={`place-zone ${selected?.id === "fountain" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "fountain")!)}
            style={{ cursor: "pointer" }}
          >
            <circle cx="342" cy="543" r="30" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" filter="url(#building-shadow)" />
            <circle cx="342" cy="543" r="23" fill="url(#fountain-water-grad)" stroke="#0284c7" strokeWidth="2" />
            <circle cx="342" cy="543" r="14" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            <circle cx="342" cy="543" r="7" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
            <circle cx="342" cy="543" r="3" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* MAIN ENTRANCE GATE */}
          <g
            className={`place-zone ${selected?.id === "entrance" ? "is-selected" : ""}`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "entrance")!)}
            style={{ cursor: "pointer" }}
          >
            <rect x="325" y="810" width="8" height="26" rx="2" fill="#0f172a" />
            <rect x="351" y="810" width="8" height="26" rx="2" fill="#0f172a" />
            <path d="M333 818h18" stroke="#0f172a" strokeWidth="3" />
            <circle cx="342" cy="823" r="4" fill="#2563eb" />
          </g>

          {/* Connecting Walkway Route */}
          {selected && (
            <g className="route-line">
              <path d={routePath} stroke="#ffffff" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.9" />
              <path d={routePath} stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 6" fill="none" />
              <circle cx="342" cy="827" r="7" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              <circle cx={selected.x} cy={selected.y} r="9" fill="#2563eb" stroke="#ffffff" strokeWidth="3" filter="url(#pin-glow)" />
            </g>
          )}

          {/* USER LIVE LOCATION ON 2D MAP */}
          {userCoords && (
            <g
              className="user-live-pin"
              transform={`translate(${userCoords.x} ${userCoords.y})`}
            >
              <circle r="22" fill="rgba(37,99,235,0.22)">
                <animate attributeName="r" values="12;28;12" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle
                r="8"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="3"
                filter="url(#user-location-glow)"
              />
              <rect
                x="-42"
                y="-32"
                width="84"
                height="18"
                rx="6"
                fill="#1e293b"
                stroke="#ffffff"
                strokeWidth="1.2"
                filter="drop-shadow(0 2px 5px rgba(0,0,0,0.3))"
              />
              <text
                x="0"
                y="-20"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill="#ffffff"
                letterSpacing="0.04em"
              >
                📍 YOU ARE HERE
              </text>
            </g>
          )}

          {/* Map Place Markers */}
          {PLACES.map((place) => {
            const isSel = selected?.id === place.id
            return (
              <g
                key={place.id}
                className={`place-pin ${isSel ? "is-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(place)
                }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={place.x} cy={place.y} r={isSel ? 18 : 13} fill="rgba(37,99,235,0.2)" />
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={isSel ? 9 : 7}
                  fill={isSel ? "#2563eb" : "#1e293b"}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter="url(#pin-glow)"
                />
              </g>
            )
          })}

          {/* Map Labels */}
          <g className="map-labels">
            {MAP_LABELS.map((label) => (
              <MapLabel key={label.id} label={label} />
            ))}
          </g>

          <text x="60" y="894" fill="#64748b" fontSize="8" fontWeight="800" letterSpacing="0.08em">
            ← FROM RAJANUKUNTE
          </text>
          <text x="475" y="885" fill="#64748b" fontSize="8" fontWeight="800" letterSpacing="0.08em">
            TOWARDS DIBBUR →
          </text>
        </svg>
      </div>

      <div className="map-attribution">
        PRESIDENCY UNIVERSITY RAJANUKUNTE · 2D VECTOR MAP
      </div>
    </div>
  )
}

function projectPoint(x: number, y: number) {
  return { x: x * 0.5 - y * 0.2 + 270, y: x * 0.2 + y * 0.48 + 20 }
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
    id: "cafeteria",
    kind: "facility",
    height: 12,
    d: "M100 480 L180 475 L185 550 L105 555Z",
    name: "Cafeteria",
  },
  {
    id: "dsa",
    kind: "admin",
    height: 14,
    d: "M240 420 L310 415 L315 480 L245 485Z",
    name: "DSA Office",
  },
  {
    id: "academic-north",
    kind: "academic",
    height: 16,
    d: "M360 143 L450 140 L455 250 L365 255Z",
    name: "Academic Block",
  },
]

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

// 3D Isometric Campus Map
function CampusMap3D({
  selected,
  userFix,
  onSelect,
  zoom,
  rotation,
  pan,
  onPan,
}: {
  selected: Place | null
  userFix: DeviceLocationFix | null
  onSelect: (place: Place) => void
  zoom: number
  rotation: number
  pan: { x: number; y: number }
  onPan: (pan: { x: number; y: number }) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    startX: number
    startY: number
  } | null>(null)

  const selectedBuilding = selected?.id
  const worldTransform = `translate(${pan.x} ${pan.y}) scale(${zoom}) rotate(${rotation} 340 350)`

  const userCoords = userFix
    ? gpsToCampusCoordinates(userFix.latitude, userFix.longitude)
    : null
  const userIsoPoint = userCoords ? projectPoint(userCoords.x, userCoords.y) : null

  return (
    <div className="map-viewport map-viewport--3d">
      <div className="map-context">
        <span className="map-context-icon">
          <Icon name="compass" size={17} />
        </span>
        <div>
          <strong>Presidency University, Rajanukunte</strong>
          <small>3D Isometric Campus View</small>
        </div>
      </div>

      <svg
        className={`campus-map--3d ${isDragging ? "is-dragging" : ""}`}
        viewBox="0 0 680 700"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Presidency University Rajanukunte 3D Isometric View"
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
          if (!drag.current || drag.current.pointerId !== event.pointerId) return
          onPan({
            x: Math.max(
              -250,
              Math.min(250, drag.current.startX + (event.clientX - drag.current.x) * 1.1),
            ),
            y: Math.max(
              -250,
              Math.min(250, drag.current.startY + (event.clientY - drag.current.y) * 1.1),
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
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="iso-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#0284c7" />
          </linearGradient>
          <filter id="iso-shadow" x="-30%" y="-30%" width="180%" height="190%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#0f172a" floodOpacity=".2" />
          </filter>
        </defs>

        <rect width="680" height="700" fill="url(#iso-ground)" />

        <g className="campus-world" transform={worldTransform}>
          <ellipse cx="336" cy="320" rx="265" ry="255" className="world-shadow" />

          {/* Campus Base */}
          <path
            transform={ISO_MATRIX}
            className="iso-campus-base"
            d="M70 490 C91 445 110 408 153 399 C210 388 284 405 337 383 L338 165 C339 124 363 104 397 100 C443 95 466 119 472 164 C476 204 469 270 494 291 C513 307 548 297 558 325 C569 356 550 396 555 437 C560 478 536 500 507 506 L507 660 C468 675 417 678 382 668 C375 687 359 696 338 697 L348 824 C327 838 306 843 278 832 L256 796 C225 755 191 714 160 676 C130 640 111 598 123 556 C101 550 78 530 70 490Z"
            fill="#e2e8f0"
          />

          {/* Lawns */}
          {ISO_LAWNS.map((d, index) => (
            <path key={index} transform={ISO_MATRIX} d={d} className="iso-lawn" fill="#86efac" />
          ))}

          {/* Sports Playground in 3D */}
          <path
            transform={ISO_MATRIX}
            d="M386 554 L466 521 L503 521 L499 655 L390 653 C394 615 388 580 373 557Z"
            className="iso-sports-field"
            fill="#4ade80"
            stroke="#15803d"
            strokeWidth="1.5"
            onClick={() => onSelect(PLACES.find((p) => p.id === "playground")!)}
            style={{ cursor: "pointer" }}
          />

          {/* Roads */}
          <path transform={ISO_MATRIX} d={ISO_ROAD_NETWORK} className="iso-road-bed" />
          <path transform={ISO_MATRIX} d={ISO_ROAD_NETWORK} className="iso-road-surface" />

          {/* Trees */}
          <g className="iso-trees" aria-hidden="true">
            {ISO_TREES.map(([x, y], index) => {
              const point = projectPoint(x, y)
              return (
                <g key={index} transform={`translate(${point.x} ${point.y - 4})`}>
                  <ellipse cx="3" cy="6" rx="7" ry="3" className="tree-shadow" />
                  <rect x="-1" y="-1" width="2" height="7" rx="1" fill="#78350f" />
                  <circle cx="0" cy="-5" r={index % 3 === 0 ? 7 : 6} fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
                </g>
              )
            })}
          </g>

          {/* 3D Buildings */}
          <g className="iso-buildings" filter="url(#iso-shadow)">
            {ISO_BUILDINGS.map((building) => {
              const isSelected = selectedBuilding === building.id
              return (
                <g
                  key={building.id}
                  className={`iso-building ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    const match = PLACES.find((p) => p.id === building.id)
                    if (match) onSelect(match)
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {Array.from({ length: building.height }, (_, layer) => (
                    <g key={layer} transform={`translate(0 ${-layer})`}>
                      <path
                        transform={ISO_MATRIX}
                        d={building.d}
                        className="iso-building-side"
                        fill={isSelected ? "#93c5fd" : "#94a3b8"}
                        stroke="#64748b"
                        strokeWidth="0.8"
                      />
                    </g>
                  ))}
                  <g transform={`translate(0 ${-building.height})`}>
                    <path
                      transform={ISO_MATRIX}
                      d={building.d}
                      className="iso-building-roof"
                      fill={isSelected ? "#bfdbfe" : "#f1f5f9"}
                      stroke={isSelected ? "#2563eb" : "#475569"}
                      strokeWidth="1.8"
                    />
                  </g>
                </g>
              )
            })}
          </g>

          {/* 3D Central Fountain */}
          <g
            className="iso-fountain"
            transform={`translate(${projectPoint(342, 543).x} ${projectPoint(342, 543).y - 4})`}
            onClick={() => onSelect(PLACES.find((p) => p.id === "fountain")!)}
            style={{ cursor: "pointer" }}
          >
            <ellipse cy="5" rx="26" ry="14" className="fountain-plinth" fill="#e2e8f0" stroke="#94a3b8" />
            <ellipse cy="0" rx="22" ry="11" className="fountain-rim" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cy="-2" rx="17" ry="8" className="fountain-pool" fill="url(#iso-water)" />
            <path d="M-8 -3 Q0 -16 8 -3 M0 -3 V-20" className="fountain-spray" stroke="#e0f2fe" strokeWidth="2" fill="none" />
            <circle cy="-21" r="3" className="fountain-drop" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
          </g>

          {/* USER LIVE LOCATION IN 3D */}
          {userIsoPoint && (
            <g
              className="user-3d-location"
              transform={`translate(${userIsoPoint.x} ${userIsoPoint.y - 14})`}
            >
              <ellipse rx="18" ry="10" fill="rgba(37,99,235,0.3)">
                <animate attributeName="rx" values="10;26;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="ry" values="6;16;6" dur="2s" repeatCount="indefinite" />
              </ellipse>
              <circle r="7" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              <rect
                x="-36"
                y="-28"
                width="72"
                height="16"
                rx="5"
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text x="0" y="-17" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff">
                📍 YOU ARE HERE
              </text>
            </g>
          )}

          {/* 3D Place Markers */}
          {PLACES.map((place) => {
            const point = projectPoint(place.x, place.y)
            const isSel = selected?.id === place.id
            return (
              <g
                key={place.id}
                transform={`translate(${point.x} ${point.y - 14})`}
                onClick={() => onSelect(place)}
                style={{ cursor: "pointer" }}
              >
                <circle r={isSel ? 18 : 12} fill={isSel ? "rgba(37,99,235,0.3)" : "rgba(15,23,42,0.15)"} />
                <circle
                  r={isSel ? 8 : 6}
                  fill={isSel ? "#2563eb" : "#0f172a"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                />
                <rect
                  x="-35"
                  y="-28"
                  width="70"
                  height="16"
                  rx="5"
                  fill={isSel ? "#2563eb" : "rgba(255,255,255,0.95)"}
                  stroke={isSel ? "#1d4ed8" : "#cbd5e1"}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="-17"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="800"
                  fill={isSel ? "#ffffff" : "#0f172a"}
                >
                  {place.name}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="map-attribution">
        PRESIDENCY UNIVERSITY RAJANUKUNTE · 3D ISOMETRIC VIEW
      </div>
    </div>
  )
}

// Destination Panel with Live Distance and 1-Click Google Maps Navigation
function DestinationPanel({
  place,
  userFix,
  mode,
  onMode,
  onClose,
  isSaved,
  onToggleSave,
  onDirections,
}: {
  place: Place | null
  userFix: DeviceLocationFix | null
  mode: PanelMode
  onMode: (mode: PanelMode) => void
  onClose: () => void
  isSaved?: boolean
  onToggleSave?: (place: Place) => void
  onDirections?: (place: Place, targetGate?: boolean) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const distMeters =
    place && userFix
      ? calculateDistanceMeters(
          userFix.latitude,
          userFix.longitude,
          place.latitude,
          place.longitude,
        )
      : null

  const walkingMinutes =
    distMeters !== null ? Math.max(1, Math.round(distMeters / 75)) : null

  return (
    <aside
      className={`destination-panel ${place ? "has-place" : ""} ${
        collapsed ? "is-collapsed" : ""
      }`}
    >
      <button
        className="sheet-handle"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
      />

      {!place ? (
        <div className="empty-panel">
          <span className="eyebrow">PRESIDENCY UNIVERSITY, RAJANUKUNTE</span>
          <h2>Campus Destinations</h2>
          <p>
            Select a location on the Real, 2D, or 3D map to view details and launch
            walking directions in Google Maps.
          </p>

          {userFix && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "11px",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <strong>Your location is active (±{Math.round(userFix.accuracy)}m)</strong>
            </div>
          )}

          <div className="quick-label">KEY LOCATIONS</div>
          <div className="quick-places">
            {QUICK_PLACES.map((id) => {
              const p = PLACES.find((item) => item.id === id)
              return (
                <span
                  key={id}
                  style={{ cursor: "pointer", fontWeight: "600" }}
                  onClick={() => p && onDirections?.(p)}
                >
                  {p?.name} ↗
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          <button
            className={`panel-save ${isSaved ? "is-saved" : ""}`}
            onClick={() => onToggleSave?.(place)}
            aria-label={isSaved ? `Remove ${place.name}` : `Save ${place.name}`}
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
          <p className="text-xs text-blue-600 font-bold mb-1">
            Presidency University, Rajanukunte
          </p>

          {distMeters !== null && (
            <div
              style={{
                margin: "10px 0 12px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <div>
                  <strong style={{ display: "block", fontSize: "12px", color: "#1e40af" }}>
                    {formatDistance(distMeters)} from you
                  </strong>
                  <span style={{ fontSize: "10px", color: "#3b82f6" }}>
                    ~{walkingMinutes} min walking distance
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#1d4ed8",
                  background: "#dbeafe",
                  padding: "3px 7px",
                  borderRadius: "5px",
                }}
              >
                LIVE GPS
              </span>
            </div>
          )}

          <p>
            {mode === "details"
              ? place.description
              : `${place.description.slice(0, 110)}...`}
          </p>

          {/* On-Campus Step-by-Step Walking Route Guide */}
          <div
            style={{
              margin: "12px 0 8px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              color: "#334155",
              lineHeight: "1.5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px" }}>🚶</span>
              <strong style={{ color: "#0f172a", fontSize: "11px" }}>
                Campus Walking Route:
              </strong>
            </div>
            <span>
              {place.id === "cafeteria" &&
                "Enter via Main Gate → Walk straight past Central Fountain → Cafeteria is on your right (~2 min walk)"}
              {place.id === "lawn" &&
                "Enter via Main Gate → Central Fountain → Main Lawn is on your left (~2 min walk)"}
              {place.id === "dsa" &&
                "Enter via Main Gate → Central Fountain → DSA Student Affairs Block (~2 min walk)"}
              {place.id === "playground" &&
                "Enter via Main Gate → North Junction → Sports Ground & Turf (~2 min walk)"}
              {place.id === "fountain" &&
                "Enter via Main Gate → Walk straight down the central avenue (~1.5 min walk)"}
              {place.id === "entrance" &&
                "Main entry gate on Rajanukunte–Dibbur main road with security checkpoint."}
            </span>
          </div>

          <div
            style={{
              margin: "8px 0 14px",
              padding: "8px 12px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <span style={{ fontSize: "17px" }}>🗺️</span>
            <div>
              <strong style={{ display: "block", fontSize: "11px", color: "#166534" }}>
                Google Maps Navigation
              </strong>
              <small style={{ color: "#15803d", fontSize: "10px" }}>
                Accessible via road from Emversity & Rajanukunte
              </small>
            </div>
          </div>

          <div className="panel-actions" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              className="google-maps-nav-btn"
              onClick={() => onDirections?.(place, false)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontWeight: "700",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
              }}
            >
              <Icon name="maps" size={18} />
              <span>Navigate in Google Maps ↗</span>
            </button>

            {place.id !== "entrance" && (
              <button
                type="button"
                onClick={() => onDirections?.(place, true)}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🚪 Route to Campus Main Gate on Google Maps</span>
              </button>
            )}

            <button
              className="secondary-action"
              onClick={() => onMode(mode === "details" ? "summary" : "details")}
              style={{ width: "100%", minHeight: "38px" }}
            >
              {mode === "details" ? "Overview" : "View details"}
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

// Search Modal
function SearchPanel({
  userFix,
  onClose,
  onSelect,
  onNavigate,
}: {
  userFix: DeviceLocationFix | null
  onClose: () => void
  onSelect: (place: Place) => void
  onNavigate: (place: Place) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = normalizeSearch(query)
    if (!q) return PLACES
    return PLACES.filter((place) => {
      const matchName = normalizeSearch(place.name).includes(q)
      const matchCat = normalizeSearch(place.category).includes(q)
      const matchAliases = place.aliases?.some((a) =>
        normalizeSearch(a).includes(q),
      )
      return matchName || matchCat || matchAliases
    })
  }, [query])

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-panel-top">
          <div className="search-input active">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search Cafeteria, Lawn, DSA, Playground, Fountain..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                className="inline-close"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close search">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="results-head">
          <span>PRESIDENCY UNIVERSITY RAJANUKUNTE ({filtered.length})</span>
        </div>

        <div className="results-list">
          {filtered.map((place) => {
            const dist = userFix
              ? calculateDistanceMeters(
                  userFix.latitude,
                  userFix.longitude,
                  place.latitude,
                  place.longitude,
                )
              : null

            return (
              <div
                key={place.id}
                className="result-row flex items-center justify-between"
                onClick={() => {
                  onSelect(place)
                  onClose()
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="flex items-center gap-3">
                  <span className="result-icon">
                    <Icon name={place.icon} size={18} />
                  </span>
                  <div>
                    <strong>{place.name}</strong>
                    <small>
                      {place.category}
                      {dist !== null && ` · 📍 ${formatDistance(dist)} away`}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate(place)
                    onClose()
                  }}
                >
                  <span>Go</span>
                  <Icon name="external" size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Explore / Saved Section
function SectionPanel({
  section,
  userFix,
  onSelect,
  onNavigate,
  savedIds,
  onToggleSave,
}: {
  section: Exclude<Section, "map">
  userFix: DeviceLocationFix | null
  onSelect: (place: Place) => void
  onNavigate: (place: Place) => void
  savedIds: string[]
  onToggleSave: (place: Place) => void
}) {
  const displayPlaces =
    section === "saved"
      ? PLACES.filter((p) => savedIds.includes(p.id))
      : PLACES

  return (
    <aside className="section-panel">
      <span className="eyebrow">PRESIDENCY UNIVERSITY, RAJANUKUNTE</span>
      <h2>
        {section === "explore" ? "Explore Campus" : "Saved Places"}
      </h2>
      <p>
        {section === "explore"
          ? "Presidency University Rajanukunte campus destinations with live distances and instant Google Maps walking navigation."
          : "Bookmarked locations for quick navigation."}
      </p>

      {userFix && (
        <div
          style={{
            margin: "14px 0",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            fontSize: "11px",
            color: "#1e40af",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>📍</span>
          <span>Your live location is active. Distances are calculated from you.</span>
        </div>
      )}

      <div className="place-grid">
        {displayPlaces.length === 0 ? (
          <div className="saved-empty">
            <span className="saved-empty-icon">
              <Icon name="bookmark" size={24} />
            </span>
            <strong>No saved places yet</strong>
            <span>Bookmark places to quickly access them here.</span>
          </div>
        ) : (
          displayPlaces.map((place) => {
            const dist = userFix
              ? calculateDistanceMeters(
                  userFix.latitude,
                  userFix.longitude,
                  place.latitude,
                  place.longitude,
                )
              : null

            return (
              <div key={place.id} className="place-row flex items-center justify-between p-2">
                <button
                  className="place-row-main"
                  onClick={() => onSelect(place)}
                  style={{ flex: 1 }}
                >
                  <span className="place-grid-icon">
                    <Icon name={place.icon} size={18} />
                  </span>
                  <div>
                    <strong>{place.name}</strong>
                    <small>
                      {place.category}
                      {dist !== null && ` · 🚶 ${formatDistance(dist)} away`}
                    </small>
                  </div>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate(place)
                  }}
                  title="Open walking directions in Google Maps"
                >
                  <span>Maps</span>
                  <Icon name="external" size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

export default function App() {
  const [section, setSection] = useState<Section>("map")
  const [selected, setSelected] = useState<Place | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>("summary")
  const [mapMode, setMapMode] = useState<"2d" | "3d" | "real">("real")
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [pan2d, setPan2d] = useState({ x: 0, y: 0 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [centerTrigger, setCenterTrigger] = useState(0)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    loadStoredPlaceIds(SAVED_STORAGE_KEY),
  )
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const deviceLocation = useDeviceLocation()

  // Automatic Google Maps Walking Navigation Trigger
  const handleNavigateToGoogleMaps = (place: Place, targetGate = false) => {
    setSelected(place)
    const originLabel = deviceLocation.fix
      ? "your location"
      : "Presidency University"
    const targetLabel = targetGate ? "Campus Main Gate" : place.name
    setToastMessage(`Opening Google Maps route from ${originLabel} to ${targetLabel}...`)
    openGoogleMapsWalkingDirections(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        name: `${place.name}, Presidency University, Rajanukunte`,
        placeId: place.id,
      },
      deviceLocation.fix,
      targetGate,
    )
  }

  // Clear toast after 4 seconds
  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  // Center on User Location
  const handleLocateMe = () => {
    if (!deviceLocation.fix) {
      deviceLocation.requestLocation()
      setToastMessage("Requesting device location from browser...")
      return
    }

    setToastMessage(
      `Centered on your position (±${Math.round(deviceLocation.fix.accuracy)}m accuracy)`,
    )
    setCenterTrigger((c) => c + 1)

    // Pan 2D/3D to user position
    const coords = gpsToCampusCoordinates(
      deviceLocation.fix.latitude,
      deviceLocation.fix.longitude,
    )
    setPan2d({
      x: Math.max(-100, Math.min(100, (340 - coords.x) * 0.4)),
      y: Math.max(-100, Math.min(100, (540 - coords.y) * 0.4)),
    })
    const point = projectPoint(coords.x, coords.y)
    setPan({
      x: Math.max(-90, Math.min(90, (340 - point.x) * 0.3)),
      y: Math.max(-70, Math.min(70, (290 - point.y) * 0.25)),
    })
  }

  const choosePlace = (place: Place) => {
    setSelected(place)
    setPanelMode("summary")
    setSection("map")
    setSearchOpen(false)
    const point = projectPoint(place.x, place.y)
    setPan({
      x: Math.max(-90, Math.min(90, (340 - point.x) * 0.25)),
      y: Math.max(-70, Math.min(70, (290 - point.y) * 0.2)),
    })
    setPan2d({
      x: Math.max(-100, Math.min(100, (340 - place.x) * 0.3)),
      y: Math.max(-100, Math.min(100, (540 - place.y) * 0.3)),
    })
  }

  const toggleSavedPlace = (place: Place) => {
    setSavedIds((current) => {
      const next = current.includes(place.id)
        ? current.filter((id) => id !== place.id)
        : [...current, place.id]
      storePlaceIds(SAVED_STORAGE_KEY, next)
      return next
    })
  }

  const navItems: Array<{ id: Section; label: string; icon: string }> = [
    { id: "map", label: "Campus Map", icon: "map" },
    { id: "explore", label: "Explore", icon: "explore" },
    { id: "saved", label: "Saved", icon: "bookmark" },
  ]

  return (
    <main className="app-shell">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setSection("map")
            setSelected(null)
          }}
          aria-label="Presidency University Campus Navigator"
        >
          <span className="brand-mark bg-blue-600">
            <Icon name="compass" size={22} />
          </span>
          <div>
            <strong>Presidency University</strong>
            <small>Rajanukunte Campus</small>
          </div>
        </button>

        <button className="desktop-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={19} />
          <span>Search Cafeteria, Lawn, DSA, Playground, Fountain...</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {/* Header Live Location Button / Pill */}
          {deviceLocation.fix ? (
            <button
              onClick={handleLocateMe}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-sm hover:bg-emerald-100 transition cursor-pointer"
              title="Click to center on your position"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>My Location Active (±{Math.round(deviceLocation.fix.accuracy)}m)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                deviceLocation.requestLocation()
                setToastMessage("Requesting location access from browser...")
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              <Icon name="locate" size={15} />
              <span>Allow Location Access</span>
            </button>
          )}

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
        </div>
      </header>

      {/* Mobile Search */}
      <div className="mobile-search-wrap">
        <button className="mobile-search" onClick={() => setSearchOpen(true)}>
          <Icon name="search" size={19} />
          <span>Search Presidency University places...</span>
        </button>
      </div>

      {/* Main Workspace */}
      <section className="workspace">
        {/* Prominent Location Access Permission Modal / Card if not yet granted */}
        {!deviceLocation.fix && !promptDismissed && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md border border-blue-200 shadow-2xl rounded-2xl p-4 sm:p-5 max-w-md w-[calc(100%-32px)] text-center animate-fade-in"
            style={{
              boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Live Campus Geolocation
              </span>
              <button
                onClick={() => setPromptDismissed(true)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Dismiss banner"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold shadow-inner">
              📍
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Show My Current Location
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enable location access so the map can show your live pulsing position and calculate exact walking distances to the Cafeteria, Lawn, DSA, Playground, and Fountain.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  deviceLocation.requestLocation()
                  setToastMessage("Opening browser location permission prompt...")
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icon name="locate" size={16} />
                <span>Turn On Location Access</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Presidency University Main Gate
                  deviceLocation.setManualLocation(13.171722, 77.536203)
                  setToastMessage("Location set to Presidency University Main Gate")
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                title="Use Presidency University Campus Gate for testing"
              >
                <span>Use Campus Entrance (Demo)</span>
              </button>
            </div>

            {deviceLocation.errorDetails && (
              <div className="mt-3 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left leading-relaxed">
                <strong>Browser Note:</strong> {deviceLocation.errorDetails}
              </div>
            )}
          </div>
        )}

        {/* 2D / 3D / Real Map View Mode Switch */}
        <div className="map-mode-switch" role="group" aria-label="Campus map view modes">
          <button
            type="button"
            className={mapMode === "real" ? "active" : ""}
            onClick={() => setMapMode("real")}
          >
            Real Map
          </button>
          <button
            type="button"
            className={mapMode === "2d" ? "active" : ""}
            onClick={() => setMapMode("2d")}
          >
            2D View
          </button>
          <button
            type="button"
            className={mapMode === "3d" ? "active" : ""}
            onClick={() => setMapMode("3d")}
          >
            3D View
          </button>
        </div>

        {/* Selected Map Mode Rendering */}
        {mapMode === "3d" ? (
          <CampusMap3D
            selected={selected}
            userFix={deviceLocation.fix}
            onSelect={choosePlace}
            zoom={zoom}
            rotation={rotation}
            pan={pan}
            onPan={setPan}
          />
        ) : mapMode === "2d" ? (
          <CampusMap
            selected={selected}
            userFix={deviceLocation.fix}
            onSelect={choosePlace}
            zoom={zoom}
            pan={pan2d}
            onPan={setPan2d}
          />
        ) : (
          <RealCampusMap
            zoom={zoom}
            selectedPlaceId={selected?.id}
            userFix={deviceLocation.fix}
            centerTrigger={centerTrigger}
            onSelect={(placeId) => {
              const place = PLACES.find((item) => item.id === placeId)
              if (place) choosePlace(place)
            }}
            onLocateMe={handleLocateMe}
            onSetManualLocation={(lat, lng) => {
              deviceLocation.setManualLocation(lat, lng)
              setToastMessage(
                `Location pinned: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              )
            }}
          />
        )}

        {/* Map Control Buttons */}
        <div className="map-controls" aria-label="Map controls">
          <button
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.12))}
            aria-label="Zoom in"
          >
            <Icon name="plus" />
          </button>
          <button
            onClick={() => setZoom((value) => Math.max(0.75, value - 0.12))}
            aria-label="Zoom out"
          >
            <Icon name="minus" />
          </button>
          <button
            onClick={() => setRotation((value) => (value + 15) % 360)}
            aria-label="Rotate map"
          >
            <Icon name="rotate" />
          </button>
          <button
            onClick={() => {
              setZoom(1)
              setRotation(0)
              setPan({ x: 0, y: 0 })
              setPan2d({ x: 0, y: 0 })
            }}
            aria-label="Reset map view"
          >
            <Icon name="compass" />
          </button>

          {/* LOCATE ME TARGET BUTTON */}
          <button
            onClick={handleLocateMe}
            className={`locate-control ${
              deviceLocation.fix ? "text-blue-600 bg-blue-50 font-bold" : ""
            }`}
            aria-label="Show my current location"
            title="Locate me on map"
          >
            <Icon name="locate" size={19} />
          </button>
        </div>

        {/* Details or Section Panel */}
        {section === "map" ? (
          <DestinationPanel
            key={selected?.id ?? "empty"}
            place={selected}
            userFix={deviceLocation.fix}
            mode={panelMode}
            onMode={setPanelMode}
            isSaved={selected ? savedIds.includes(selected.id) : false}
            onToggleSave={toggleSavedPlace}
            onDirections={handleNavigateToGoogleMaps}
            onClose={() => {
              setSelected(null)
              setPanelMode("summary")
            }}
          />
        ) : (
          <SectionPanel
            section={section}
            userFix={deviceLocation.fix}
            onSelect={choosePlace}
            onNavigate={handleNavigateToGoogleMaps}
            savedIds={savedIds}
            onToggleSave={toggleSavedPlace}
          />
        )}
      </section>

      {/* Search Overlay */}
      {searchOpen && (
        <SearchPanel
          userFix={deviceLocation.fix}
          onClose={() => setSearchOpen(false)}
          onSelect={choosePlace}
          onNavigate={handleNavigateToGoogleMaps}
        />
      )}

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="toast" role="status">
          <Icon name="maps" size={20} />
          <span>
            <strong>Presidency University Navigation</strong>
            <small>{toastMessage}</small>
          </span>
        </div>
      )}
    </main>
  )
}
