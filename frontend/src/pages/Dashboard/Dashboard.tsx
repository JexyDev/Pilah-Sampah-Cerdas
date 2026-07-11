import React, { useEffect } from 'react';
import { Users, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const { kpi, transactions, isLoading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading && !kpi) {
    return (
      <div className={styles.dashboardContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className={styles.spinner} size={48} color="var(--primary-green)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div style={{ padding: '20px', backgroundColor: 'var(--danger-red)', color: 'white', borderRadius: '8px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const kpiData = [
    { title: 'Total Warga Aktif', value: kpi?.totalWarga?.toLocaleString() || '0', icon: <Users size={24} />, color: 'var(--primary-blue)' },
    { title: 'Sampah Terkumpul (Kg)', value: kpi?.totalSampahKg?.toLocaleString() || '0', icon: <Trash2 size={24} />, color: 'var(--primary-green)' },
    { title: 'Akurasi AI Rata-rata', value: `${kpi?.averageAiAccuracy?.toFixed(1) || 0}%`, icon: <CheckCircle size={24} />, color: 'var(--primary-green)' },
    { title: 'Peringatan Tong Penuh', value: kpi?.alertTongPenuh?.toString() || '0', icon: <AlertTriangle size={24} />, color: 'var(--danger-red)' },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.pageTitle}>Ringkasan Eksekutif</h2>
      
      <div className={styles.kpiGrid}>
        {kpiData.map((kpi, index) => (
          <div key={index} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}>
              {kpi.icon}
            </div>
            <div className={styles.kpiInfo}>
              <p className={styles.kpiTitle}>{kpi.title}</p>
              <h3 className={styles.kpiValue}>{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Aktivitas Pemilahan Terbaru</h3>
          <button className={styles.viewAllBtn}>Lihat Semua</button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.transactionTable}>
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Nama Warga</th>
                <th>Waktu</th>
                <th>Tipe Sampah</th>
                <th>Volume</th>
                <th>Poin Diperoleh</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Belum ada data transaksi</td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id}>
                    <td>{trx.id.substring(0, 8)}...</td>
                    <td>{trx.nama}</td>
                    <td>{new Date(trx.waktu).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>
                      <span className={`${styles.badge} ${trx.tipe.toLowerCase() === 'organic' ? styles.badgeOrganic : styles.badgeAnorganic}`}>
                        {trx.tipe}
                      </span>
                    </td>
                    <td>{trx.volume}</td>
                    <td className={styles.poinText}>{trx.poin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
