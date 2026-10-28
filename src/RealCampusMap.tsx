
import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import {
  DRAFT_PEDESTRIAN_EDGES,
  USER_SUPPLIED_COORDINATES,
} from "./navigationData";

const CAMPUS_CENTER: [number, number] = [
  13.17174698965407,
  77.53626384360847,
];

const VISIBLE_PLACE_IDS = [
  "law",
  "management",
  "commerce",
  "engineering",
  "medical",
  "auditorium",
  "cafeteria",
  "sports",
  "food-point-1",
] as const;


const createCampusIcon = (symbol: string, color: string) =>
  L.divIcon({
    className: "real-campus-marker",
    html: `<span class="real-campus-marker__badge" style="--marker-color: ${color}">${symbol}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const campusIcons = {
  entrance: createCampusIcon("🚪", "#245B43"),
  medical: createCampusIcon("✚", "#B42318"),
  food: createCampusIcon("🍴", "#9A5B12"),
  sports: createCampusIcon("🏆", "#2456A6"),
  academic: createCampusIcon("🏛", "#6550A4"),
  general: createCampusIcon("📍", "#53616D"),
};

function getCampusIcon(placeId?: string) {
  switch (placeId) {
    case "entrance":
      return campusIcons.entrance;

    case "medical":
      return campusIcons.medical;

    case "cafeteria":
    case "food-point-1":
      return campusIcons.food;

    case "sports":
      return campusIcons.sports;

    case "law":
    case "management":
    case "commerce":
    case "engineering":
    case "auditorium":
      return campusIcons.academic;

    default:
      return campusIcons.general;
  }
}


function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}


function SyncMapZoom({ zoom }: { zoom: number }) {
  const map = useMap();

  useEffect(() => {
    const targetZoom = Math.max(
      14,
      Math.min(19, 17 + Math.round((zoom - 1) * 5)),
    );

    map.setZoom(targetZoom);
  }, [map, zoom]);

  return null;
}


type RealCampusMapProps = {
  zoom: number;
  onSelect: (placeId: string) => void;
};

export default function RealCampusMap({
  zoom,
  onSelect,
}: RealCampusMapProps) {
  const visiblePlaces = USER_SUPPLIED_COORDINATES.filter(
    (place) =>
      "placeId" in place &&
      VISIBLE_PLACE_IDS.includes(
        place.placeId as (typeof VISIBLE_PLACE_IDS)[number],
      ),
  );

  return (
    <div className="real-campus-map">
      <MapContainer
        center={CAMPUS_CENTER}
        zoom={17}
        minZoom={14}
        maxZoom={19}
        scrollWheelZoom
        className="real-campus-map__leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          maxNativeZoom={19}
        />

        
        {DRAFT_PEDESTRIAN_EDGES.map((edge) => (
            <Polyline
                key={edge.id}
                positions={edge.geometry.map(
                    (point) =>
                        [point.latitude, point.longitude] as [number, number],
                )}
                pathOptions={{
                    color: "#2563eb",
                    weight: 5,
                    opacity: 0.9,
                }}
             />
        ))}

        <SyncMapZoom zoom={zoom} />

        <MarkerClusterGroup chunkedLoading>
        
        <Marker
          position={CAMPUS_CENTER}
          icon={campusIcons.entrance}
          eventHandlers={{
           click: () => onSelect("entrance"),
          }}
        >
            <Popup>
             <strong>Main Gate — Presidency University</strong>
            </Popup>
        </Marker>


        
        {visiblePlaces.map((place) => (
            <Marker
              key={`${place.name}-${place.latitude}-${place.longitude}`}
              position={[place.latitude, place.longitude]}
              icon={getCampusIcon("placeId" in place ? place.placeId : undefined)}
              eventHandlers={{
                click: () => {
                    if ("placeId" in place) {
                        onSelect(place.placeId);
                    }
                }
            }}
        >
            <Popup>
                <strong>{place.name}</strong>
            </Popup>
        </Marker>
    ))}

        </MarkerClusterGroup>
        <FixMapSize />
      </MapContainer>

      <div className="real-campus-map__label">
        <strong>Presidency University</strong>
        <span>Geographic map · OpenStreetMap</span>
      </div>
    </div>
  );
}
