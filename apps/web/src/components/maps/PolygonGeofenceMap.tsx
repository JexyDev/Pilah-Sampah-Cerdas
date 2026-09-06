import React, { useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface PolygonData {
  id: string;
  name: string;
  type: "KELURAHAN" | "RW" | "RT";
  coordinates: [number, number][]; // Array of [lat, lng]
  color?: string;
  subPolygons?: PolygonData[];
  stats?: {
    totalBins?: number;
    activeWarga?: number;
    wasteVolumeKg?: number;
  };
}

// Default 6 Kelurahan Polygons in Kecamatan Coblong (Coordinates simplified boundaries)
const COBLONG_KELURAHAN_POLYGONS: PolygonData[] = [
  {
    id: "kel-dago",
    name: "Kel. Dago",
    type: "KELURAHAN",
    color: "#10B981", // Emerald
    coordinates: [
      [-6.8750, 107.6150],
      [-6.8750, 107.6250],
      [-6.8900, 107.6250],
      [-6.8900, 107.6150],
    ],
    stats: { totalBins: 120, activeWarga: 450, wasteVolumeKg: 1250 },
    subPolygons: [
      {
        id: "rw-06-dago",
        name: "RW 06 Dago",
        type: "RW",
        color: "#059669",
        coordinates: [
          [-6.8780, 107.6170],
          [-6.8780, 107.6220],
          [-6.8850, 107.6220],
          [-6.8850, 107.6170],
        ],
        stats: { totalBins: 45, activeWarga: 180, wasteVolumeKg: 520 },
      },
    ],
  },
  {
    id: "kel-sadang-serang",
    name: "Kel. Sadang Serang",
    type: "KELURAHAN",
    color: "#3B82F6", // Blue
    coordinates: [
      [-6.8900, 107.6250],
      [-6.8900, 107.6350],
      [-6.9020, 107.6350],
      [-6.9020, 107.6250],
    ],
    stats: { totalBins: 95, activeWarga: 380, wasteVolumeKg: 980 },
  },
  {
    id: "kel-sekeloa",
    name: "Kel. Sekeloa",
    type: "KELURAHAN",
    color: "#8B5CF6", // Purple
    coordinates: [
      [-6.8820, 107.6250],
      [-6.8820, 107.6330],
      [-6.8950, 107.6330],
      [-6.8950, 107.6250],
    ],
    stats: { totalBins: 110, activeWarga: 410, wasteVolumeKg: 1150 },
  },
  {
    id: "kel-lebak-gede",
    name: "Kel. Lebak Gede",
    type: "KELURAHAN",
    color: "#F59E0B", // Amber
    coordinates: [
      [-6.8900, 107.6120],
      [-6.8900, 107.6220],
      [-6.8980, 107.6220],
      [-6.8980, 107.6120],
    ],
    stats: { totalBins: 85, activeWarga: 310, wasteVolumeKg: 870 },
  },
  {
    id: "kel-lebak-siliwangi",
    name: "Kel. Lebak Siliwangi",
    type: "KELURAHAN",
    color: "#EC4899", // Pink
    coordinates: [
      [-6.8850, 107.6050],
      [-6.8850, 107.6150],
      [-6.8930, 107.6150],
      [-6.8930, 107.6050],
    ],
    stats: { totalBins: 75, activeWarga: 260, wasteVolumeKg: 720 },
  },
  {
    id: "kel-cipaganti",
    name: "Kel. Cipaganti",
    type: "KELURAHAN",
    color: "#14B8A6", // Teal
    coordinates: [
      [-6.8930, 107.6020],
      [-6.8930, 107.6120],
      [-6.9050, 107.6120],
      [-6.9050, 107.6020],
    ],
    stats: { totalBins: 90, activeWarga: 330, wasteVolumeKg: 910 },
  },
];

interface MapZoomListenerProps {
  onZoomChange: (zoom: number) => void;
}

const MapZoomListener: React.FC<MapZoomListenerProps> = ({ onZoomChange }) => {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
};

export interface PolygonGeofenceMapProps {
  height?: string;
  onSelectArea?: (area: PolygonData) => void;
}

export const PolygonGeofenceMap: React.FC<PolygonGeofenceMapProps> = ({
  height = "500px",
  onSelectArea,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);

  // Lazy loading logic: Show high-level Kelurahan polygons if zoom < 16, detail RW/RT polygons if zoom >= 16
  const isDetailedZoom = zoomLevel >= 16;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200" style={{ height }}>
      {/* Dynamic Overlay Info */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-700">
          Geofencing Mode: {isDetailedZoom ? "Detail Sub-RW/RT Polygons" : "6 Kelurahan Overview (Lazy Loaded)"}
        </span>
      </div>

      <MapContainer
        center={[-6.8880, 107.6180]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapZoomListener onZoomChange={setZoomLevel} />

        {COBLONG_KELURAHAN_POLYGONS.map((kel) => {
          const showSub = isDetailedZoom && kel.subPolygons && kel.subPolygons.length > 0;
          const displayPolygons = showSub ? kel.subPolygons! : [kel];

          return displayPolygons.map((poly) => (
            <Polygon
              key={poly.id}
              positions={poly.coordinates}
              pathOptions={{
                color: poly.color || "#059669",
                fillColor: poly.color || "#10B981",
                fillOpacity: selectedPolygonId === poly.id ? 0.45 : 0.25,
                weight: selectedPolygonId === poly.id ? 3 : 2,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedPolygonId(poly.id);
                  if (onSelectArea) onSelectArea(poly);
                },
              }}
            >
              <Popup>
                <div className="p-1 max-w-xs font-sans">
                  <h4 className="font-extrabold text-sm text-slate-900 border-b pb-1 mb-2">
                    {poly.name} ({poly.type})
                  </h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p>📍 Status: <span className="font-semibold text-emerald-700">Ter-Geofence</span></p>
                    <p>🗑️ Total Tong: <span className="font-semibold">{poly.stats?.totalBins || 0} unit</span></p>
                    <p>👥 Warga Aktif: <span className="font-semibold">{poly.stats?.activeWarga || 0} KK</span></p>
                    <p>⚖️ Volume Sampah: <span className="font-semibold text-blue-700">{poly.stats?.wasteVolumeKg || 0} kg</span></p>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ));
        })}
      </MapContainer>
    </div>
  );
};
