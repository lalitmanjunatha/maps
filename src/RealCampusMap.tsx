import { useEffect } from "react"
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  Circle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "react-leaflet-cluster/dist/assets/MarkerCluster.css"
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css"
import {
  DRAFT_PEDESTRIAN_EDGES,
  USER_SUPPLIED_COORDINATES,
  openGoogleMapsWalkingDirections,
  calculateDistanceMeters,
  formatDistance,
} from "./navigationData"

// Geographic center of Presidency University Rajanukunte campus
const CAMPUS_CENTER: [number, number] = [13.169278, 77.5351]

const createCampusIcon = (symbol: string, color: string, label: string) =>
  L.divIcon({
    className: "real-campus-marker",
    html: `
      <div class="real-campus-marker__wrapper">
        <span class="real-campus-marker__badge" style="--marker-color: ${color}; background: ${color}; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
          ${symbol}
        </span>
        <span class="real-campus-marker__name" style="background: white; color: #142b4a; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.18); white-space: nowrap; border: 1px solid #dce2e6; margin-top: 4px; display: inline-block;">
          ${label}
        </span>
      </div>
    `,
    iconSize: [110, 48],
    iconAnchor: [55, 24],
    popupAnchor: [0, -22],
  })

const createUserLocationIcon = () =>
  L.divIcon({
    className: "user-location-marker",
    html: `
      <div class="user-location-pin">
        <span class="user-location-pulse"></span>
        <span class="user-location-core"></span>
        <span class="user-location-tag">📍 You Are Here</span>
      </div>
    `,
    iconSize: [110, 50],
    iconAnchor: [55, 16],
    popupAnchor: [0, -18],
  })

const campusIcons = {
  fountain: createCampusIcon("⛲", "#0284c7", "Fountain"),
  cafeteria: createCampusIcon("🍴", "#d97706", "Cafeteria"),
  lawn: createCampusIcon("🌱", "#16a34a", "Main Lawn"),
  dsa: createCampusIcon("🏛", "#7c3aed", "DSA Office"),
  playground: createCampusIcon("🏆", "#2563eb", "Playground"),
  entrance: createCampusIcon("🚪", "#0f172a", "Main Gate"),
}

function getCampusIcon(placeId: string) {
  switch (placeId) {
    case "fountain":
      return campusIcons.fountain
    case "cafeteria":
      return campusIcons.cafeteria
    case "lawn":
      return campusIcons.lawn
    case "dsa":
      return campusIcons.dsa
    case "playground":
    case "sports":
      return campusIcons.playground
    case "entrance":
      return campusIcons.entrance
    default:
      return campusIcons.fountain
  }
}

function FixMapSize() {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => window.clearTimeout(timer)
  }, [map])

  return null
}

function SyncMapZoom({ zoom }: { zoom: number }) {
  const map = useMap()

  useEffect(() => {
    const targetZoom = Math.max(
      15,
      Math.min(19, 17 + Math.round((zoom - 1) * 3)),
    )
    map.setZoom(targetZoom)
  }, [map, zoom])

  return null
}

function FlyToTarget({
  coords,
  trigger,
}: {
  coords: [number, number] | null
  trigger: number
}) {
  const map = useMap()

  useEffect(() => {
    if (trigger > 0 && coords) {
      map.flyTo(coords, 18, { animate: true, duration: 1.2 })
    }
  }, [trigger, coords, map])

  return null
}

function MapClickHandler({
  onSetLocation,
}: {
  onSetLocation?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (onSetLocation) {
        onSetLocation(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

interface DeviceLocationFix {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

type RealCampusMapProps = {
  zoom: number
  selectedPlaceId?: string | null
  userFix: DeviceLocationFix | null
  centerTrigger: number
  onSelect: (placeId: string) => void
  onLocateMe: () => void
  onSetManualLocation?: (lat: number, lng: number) => void
}

export default function RealCampusMap({
  zoom,
  selectedPlaceId,
  userFix,
  centerTrigger,
  onSelect,
  onLocateMe,
  onSetManualLocation,
}: RealCampusMapProps) {
  const distToFountain = userFix
    ? calculateDistanceMeters(
        userFix.latitude,
        userFix.longitude,
        CAMPUS_CENTER[0],
        CAMPUS_CENTER[1],
      )
    : null

  const targetCoords: [number, number] | null = userFix
    ? [userFix.latitude, userFix.longitude]
    : CAMPUS_CENTER

  return (
    <div className="real-campus-map relative w-full h-full">
      <MapContainer
        center={CAMPUS_CENTER}
        zoom={17}
        minZoom={14}
        maxZoom={19}
        scrollWheelZoom
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          maxNativeZoom={19}
        />

        {/* Campus Pedestrian Walkway Edges */}
        {DRAFT_PEDESTRIAN_EDGES.map((edge) => (
          <Polyline
            key={edge.id}
            positions={edge.geometry.map(
              (point) => [point.latitude, point.longitude] as [number, number],
            )}
            pathOptions={{
              color: "#2563eb",
              weight: 4,
              opacity: 0.85,
              dashArray: "6, 8",
            }}
          />
        ))}

        {/* Route Line from User's live location to Presidency University Fountain */}
        {userFix && (
          <Polyline
            positions={[[userFix.latitude, userFix.longitude], CAMPUS_CENTER]}
            pathOptions={{
              color: "#3b82f6",
              weight: 3.5,
              opacity: 0.75,
              dashArray: "5, 7",
            }}
          />
        )}

        {/* User Current Live Location Accuracy Ring */}
        {userFix && (
          <Circle
            center={[userFix.latitude, userFix.longitude]}
            radius={Math.max(12, Math.min(120, userFix.accuracy))}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
              weight: 1.5,
            }}
          />
        )}

        {/* User Current Live Location Marker */}
        {userFix && (
          <Marker
            position={[userFix.latitude, userFix.longitude]}
            icon={createUserLocationIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <div
                style={{
                  padding: "8px 6px",
                  minWidth: "190px",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#2563eb",
                    textTransform: "uppercase",
                  }}
                >
                  📍 Your Location
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#0f172a",
                    marginTop: "4px",
                  }}
                >
                  Live Location Fix
                </strong>
                <p
                  style={{
                    margin: "5px 0 8px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  Accuracy: ±{Math.round(userFix.accuracy)} meters
                  <br />
                  {distToFountain !== null && (
                    <strong
                      style={{
                        color: "#166534",
                        display: "block",
                        marginTop: "3px",
                      }}
                    >
                      {formatDistance(distToFountain)} from Central Fountain
                    </strong>
                  )}
                </p>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                  {userFix.latitude.toFixed(6)}, {userFix.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <SyncMapZoom zoom={zoom} />
        <FlyToTarget coords={targetCoords} trigger={centerTrigger} />
        <MapClickHandler onSetLocation={onSetManualLocation} />

        {/* Presidency University Rajanukunte Campus Landmarks */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
          {USER_SUPPLIED_COORDINATES.map((place) => {
            const distFromUser = userFix
              ? calculateDistanceMeters(
                  userFix.latitude,
                  userFix.longitude,
                  place.latitude,
                  place.longitude,
                )
              : null

            return (
              <Marker
                key={place.placeId}
                position={[place.latitude, place.longitude]}
                icon={getCampusIcon(place.placeId)}
                eventHandlers={{
                  click: () => onSelect(place.placeId),
                }}
              >
                <Popup>
                  <div style={{ padding: "6px 4px", minWidth: "200px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#2563eb",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "3px",
                      }}
                    >
                      Presidency University, Rajanukunte
                    </div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "15px",
                        color: "#142b4a",
                        marginBottom: "3px",
                      }}
                    >
                      {place.name}
                    </strong>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginBottom: distFromUser !== null ? "6px" : "10px",
                      }}
                    >
                      {place.category}
                    </div>

                    {distFromUser !== null && (
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#166534",
                          marginBottom: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>🚶</span>
                        <span>
                          {formatDistance(distFromUser)} away from you
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openGoogleMapsWalkingDirections(place, userFix)
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                      }}
                    >
                      <span>Navigate in Google Maps</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>

        <FixMapSize />
      </MapContainer>

      {/* Floating Header Banner */}
      <div className="real-campus-map__label absolute left-5 top-5 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 max-w-[calc(100%-40px)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            PU
          </div>
          <div>
            <strong className="block text-xs font-bold text-slate-900 tracking-wide">
              Presidency University, Rajanukunte
            </strong>
            <span className="text-[11px] text-slate-500 font-medium">
              Cafeteria · Lawn · DSA · Playground · Fountain
            </span>
          </div>
        </div>

        {/* Live GPS badge */}
        <div className="flex items-center gap-2">
          {userFix ? (
            <button
              type="button"
              onClick={onLocateMe}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition shadow-sm cursor-pointer"
              title="Click to center map on your position"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>GPS Active (±{Math.round(userFix.accuracy)}m)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLocateMe}
              className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center gap-1 hover:bg-blue-100 transition shadow-sm cursor-pointer"
            >
              <span>📍 Show My Location</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
