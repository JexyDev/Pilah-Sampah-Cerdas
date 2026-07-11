import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { useMonitoringStore } from '../../store/useMonitoringStore';
import styles from './Monitoring.module.css';

// Fix untuk Leaflet icon default di Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom HTML DivIcon for Bins
const createBinIcon = (status: 'aman' | 'waspada' | 'penuh') => {
  let color = 'var(--primary-green)'; // default aman
  if (status === 'waspada') color = 'var(--warning-yellow)';
  if (status === 'penuh') color = 'var(--danger-red)';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

const Monitoring: React.FC = () => {
  const { bins, isLoading, error, fetchBins } = useMonitoringStore();

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  // Determine map center. If there are bins with lat/lng, use the first one. Otherwise default.
  const mapCenter: [number, number] = useMemo(() => {
    const binWithLoc = bins.find(b => b.latitude && b.longitude);
    if (binWithLoc) return [Number(binWithLoc.latitude), Number(binWithLoc.longitude)];
    return [-6.8903, 107.6110]; // Default: Kecamatan Coblong, Bandung
  }, [bins]);
  
  if (isLoading && bins.length === 0) {
    return (
      <div className={styles.monitoringContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className={styles.spinner} size={48} color="var(--primary-green)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.monitoringContainer}>
        <div style={{ padding: '20px', backgroundColor: 'var(--danger-red)', color: 'white', borderRadius: '8px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.monitoringContainer}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Live Monitoring (Geospasial)</h2>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: 'var(--primary-green)' }}></div>
            <span>Aman (&lt;70%)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: 'var(--warning-yellow)' }}></div>
            <span>Waspada (70-90%)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: 'var(--danger-red)' }}></div>
            <span>Penuh (&gt;90%)</span>
          </div>
        </div>
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer 
          center={mapCenter} 
          zoom={15} 
          scrollWheelZoom={true}
          className={styles.map}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {bins.filter(bin => bin.latitude && bin.longitude).map(bin => {
            const vol = Number(bin.currentVolumeLiter);
            const max = Number(bin.maxCapacityLiter);
            const percentage = max > 0 ? (vol / max) * 100 : 0;
            
            let status: 'aman' | 'waspada' | 'penuh' = 'aman';
            if (percentage >= 90) status = 'penuh';
            else if (percentage >= 70) status = 'waspada';

            return (
              <Marker key={bin.id} position={[Number(bin.latitude), Number(bin.longitude)]} icon={createBinIcon(status)}>
                <Popup>
                  <div className={styles.popupContent}>
                    <strong>Tong {bin.category.name}</strong><br/>
                    Kapasitas Terisi: {percentage.toFixed(1)}% ({vol}L / {max}L)<br/>
                    Status: {status.toUpperCase()}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default Monitoring;
