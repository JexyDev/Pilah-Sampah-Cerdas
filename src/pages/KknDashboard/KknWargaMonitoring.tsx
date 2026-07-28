
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import styles from './KknDashboard.module.css'; // Assuming this exists

export const KknWargaMonitoring: React.FC = () => {
  const [warga, setWarga] = useState<any[]>([]);

  useEffect(() => {
    api.get('/kkn/warga-dampingan').then(res => {
      setWarga(res.data);
    }).catch(err => console.error(err));
  }, []);

  return (
    <MainLayout>
      <div className={styles.container || 'p-4'}>
        <h2>Monitoring Warga Dampingan</h2>
        <p>Grafik dan data historis warga yang Anda bantu aktivasinya.</p>
        
        {warga.length === 0 ? <p>Belum ada warga dampingan.</p> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {warga.map((w, i) => (
              <div key={i} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                <h4>Warga: {w.wargaName}</h4>
                <p>Alamat: {w.address}</p>
                <p>Total Setoran: {w.recentLogs?.length || 0}</p>
                {/* Placeholder for real charts */}
                <div style={{ height: '100px', background: '#f5f5f5', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>[Area Grafik Monitoring Sampah {w.wargaName}]</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
export default KknWargaMonitoring;
