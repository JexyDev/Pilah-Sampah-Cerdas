import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  // Dummy data (Kecamatan Coblong, Bandung)
  const mapCenter: [number, number] = [-6.8903, 107.6110];
  
  const dummyBins = [
    { id: 1, name: 'Tong 01 - Bp. Asep', lat: -6.8903, lng: 107.6110, status: 'aman' as const, volume: '10%' },
    { id: 2, name: 'Tong 02 - Ibu Siti', lat: -6.8915, lng: 107.6120, status: 'penuh' as const, volume: '95%' },
    { id: 3, name: 'Tong 03 - Bp. Dedi', lat: -6.8890, lng: 107.6135, status: 'waspada' as const, volume: '80%' },
    { id: 4, name: 'Tong 04 - Pos RW', lat: -6.8920, lng: 107.6095, status: 'aman' as const, volume: '25%' },
  ];

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
          
          {dummyBins.map(bin => (
            <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={createBinIcon(bin.status)}>
              <Popup>
                <div className={styles.popupContent}>
                  <strong>{bin.name}</strong><br/>
                  Kapasitas Terisi: {bin.volume}<br/>
                  Status: {bin.status.toUpperCase()}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Monitoring;
