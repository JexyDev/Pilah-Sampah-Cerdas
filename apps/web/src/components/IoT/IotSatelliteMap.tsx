import React, { useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Radio,
  Battery,
  Wifi,
  Clock,
  Compass,
} from "lucide-react";
import type { IoTDevice, CH4Reading } from "../../services/iotService";

// Helper component untuk auto-recenter & fit bounds tanpa getaran / bentrok kamera
const MapBoundsAdjuster: React.FC<{
  devices: Array<IoTDevice & { latestReading?: CH4Reading | null }>;
  selectedDevice: IoTDevice | null;
}> = ({ devices, selectedDevice }) => {
  const map = useMap();
  const initialFitDone = useRef(false);
  const lastSelectedId = useRef<string | null>(null);

  useEffect(() => {
    // Jika ada perangkat terpilih dan berbeda dari sebelumnya, lakukan panTo halus
    if (selectedDevice && selectedDevice.id !== lastSelectedId.current) {
      lastSelectedId.current = selectedDevice.id;
      if (selectedDevice.latitude != null && selectedDevice.longitude != null) {
        const sLat = Number(selectedDevice.latitude);
        const sLng = Number(selectedDevice.longitude);
        if (!isNaN(sLat) && !isNaN(sLng) && (sLat !== 0 || sLng !== 0)) {
          map.panTo([sLat, sLng], { animate: true, duration: 0.8 });
          return;
        }
      }
    }

    if (!selectedDevice) {
      lastSelectedId.current = null;
    }

    // Inisialisasi awal fit bounds hanya 1 kali
    if (!initialFitDone.current && devices.length > 0) {
      const validCoords = devices
        .map((d) => [Number(d.latitude), Number(d.longitude)] as [number, number])
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0));

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          initialFitDone.current = true;
        }
      }
    }
  }, [devices, selectedDevice, map]);

  return null;
};

// Custom Marker HTML Icon Builder
const createNodeMarkerIcon = (
  statusLevel: "NORMAL" | "WARNING" | "DANGER" | "OFFLINE",
  nodeCode: string,
  displayIndex?: number
) => {
  const colors = {
    NORMAL: { bg: "#10b981", pulse: "rgba(16, 185, 129, 0.4)", text: "#ffffff" },
    WARNING: { bg: "#f59e0b", pulse: "rgba(245, 158, 11, 0.4)", text: "#ffffff" },
    DANGER: { bg: "#ef4444", pulse: "rgba(239, 68, 68, 0.6)", text: "#ffffff" },
    OFFLINE: { bg: "#64748b", pulse: "transparent", text: "#ffffff" },
  };

  const c = colors[statusLevel] || colors.NORMAL;
  const isPulsing = statusLevel === "WARNING" || statusLevel === "DANGER";
  const labelText = displayIndex != null
    ? String(displayIndex).padStart(2, "0")
    : (nodeCode.replace(/[^0-9]/g, "").slice(-2) || "N");

  const html = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      ${
        isPulsing
          ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: ${c.pulse}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ""
      }
      <div style="position: relative; z-index: 10; width: 32px; height: 32px; border-radius: 9999px; background-color: ${c.bg}; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: ${c.text}; font-size: 10px; font-weight: 800; font-family: monospace;">
        ${labelText}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-iot-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

interface IotSatelliteMapProps {
  devices: Array<IoTDevice & { latestReading?: CH4Reading | null }>;
  selectedDevice: IoTDevice | null;
  onSelectDevice: (device: IoTDevice | null) => void;
  heightClass?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export const IotSatelliteMap: React.FC<IotSatelliteMapProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  heightClass = "h-[480px]",
  warningThreshold = 1000,
  dangerThreshold = 5000,
}) => {
  // Default coordinate (Bandung / Cimahi)
  const defaultCenter: [number, number] = [-6.8722, 107.5422];

  const getStatusLevel = (device: IoTDevice & { latestReading?: CH4Reading | null }): "NORMAL" | "WARNING" | "DANGER" | "OFFLINE" => {
    if (!device.isOnline) return "OFFLINE";
    if (!device.latestReading) return "NORMAL";
    return device.latestReading.statusLevel;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300">
      {/* Section Header: KONDISI WILAYAH */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Kondisi Wilayah
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              Pemetaan geospasial sebaran titik penempatan sensor IoT pada Tempat Sampah (TPS)
            </p>
          </div>
        </div>

        {/* Info node count */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 shadow-2xs">
            {devices.length} Perangkat Terpasang
          </span>
        </div>
      </div>

      {/* Map Body */}
      <div className={`relative w-full ${heightClass}`}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          attributionControl={false}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />

          <MapBoundsAdjuster
            devices={devices}
            selectedDevice={selectedDevice}
          />

          {devices.map((device, idx) => {
            const lat = Number(device.latitude);
            const lng = Number(device.longitude);
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

            const statusLevel = getStatusLevel(device);

            return (
              <React.Fragment key={device.id}>
                {/* Marker Node */}
                <Marker
                  position={[lat, lng]}
                  icon={createNodeMarkerIcon(statusLevel, device.nodeCode, idx + 1)}
                  eventHandlers={{
                    click: () => onSelectDevice(device),
                  }}
                >
                  <Popup className="custom-iot-popup" autoPan={false}>
                    <div className="p-1 min-w-[210px] text-slate-800">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {device.nodeCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            statusLevel === "DANGER"
                              ? "bg-rose-100 text-rose-800"
                              : statusLevel === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : statusLevel === "OFFLINE"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {statusLevel}
                        </span>
                      </div>

                      <div className="mt-2 text-xs font-semibold text-slate-900">
                        {device.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{device.locationName}</span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[10px]">CH₄ Terukur</span>
                          <span className="font-bold text-emerald-700 font-mono text-xs">
                            {device.latestReading?.nilaiPpm != null
                              ? `${device.latestReading.nilaiPpm} ppm`
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Baterai</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1 font-mono text-xs">
                            <Battery className="w-3 h-3 text-slate-400" />
                            {device.latestReading?.baterai != null
                              ? `${device.latestReading.baterai}%`
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          {device.latestReading?.rssi != null
                            ? `${device.latestReading.rssi} dBm`
                            : "-"}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          {!isNaN(lat) ? lat.toFixed(5) : "-"},{" "}
                          {!isNaN(lng) ? lng.toFixed(5) : "-"}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Legend Overlay Dinamis */}
        <div className="absolute bottom-3 left-3 z-1000 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/90 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Legenda Status
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="text-slate-600">
              Normal (&lt; {warningThreshold.toLocaleString("id-ID")} ppm)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            <span className="text-slate-600">
              Peringatan ({warningThreshold.toLocaleString("id-ID")} - {(dangerThreshold - 1).toLocaleString("id-ID")} ppm)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            <span className="text-slate-600">
              Bahaya (&ge; {dangerThreshold.toLocaleString("id-ID")} ppm)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200" />
            <span className="text-slate-600">Terputus / Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IotSatelliteMap;
