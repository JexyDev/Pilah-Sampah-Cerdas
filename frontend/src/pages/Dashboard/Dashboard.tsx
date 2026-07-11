import React from 'react';
import { Users, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const kpiData = [
    { title: 'Total Warga Aktif', value: '1,245', icon: <Users size={24} />, color: 'var(--primary-blue)' },
    { title: 'Sampah Terkumpul (Kg)', value: '3,842', icon: <Trash2 size={24} />, color: 'var(--primary-green)' },
    { title: 'Akurasi AI Rata-rata', value: '94.2%', icon: <CheckCircle size={24} />, color: 'var(--primary-green)' },
    { title: 'Peringatan Tong Penuh', value: '4', icon: <AlertTriangle size={24} />, color: 'var(--danger-red)' },
  ];

  const recentTransactions = [
    { id: 'TRX-001', nama: 'Bapak Asep', waktu: '10:45', tipe: 'Organik', volume: '2.5L', poin: '+100' },
    { id: 'TRX-002', nama: 'Ibu Siti', waktu: '10:30', tipe: 'Anorganik', volume: '1.2L', poin: '+24' },
    { id: 'TRX-003', nama: 'Bapak Jeremy', waktu: '10:15', tipe: 'Organik', volume: '5.0L', poin: '+200' },
    { id: 'TRX-004', nama: 'Ibu Lani', waktu: '09:50', tipe: 'Anorganik', volume: '3.4L', poin: '+68' },
    { id: 'TRX-005', nama: 'Bapak Dedi', waktu: '09:20', tipe: 'Organik', volume: '1.5L', poin: '+60' },
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
              {recentTransactions.map((trx) => (
                <tr key={trx.id}>
                  <td>{trx.id}</td>
                  <td>{trx.nama}</td>
                  <td>{trx.waktu}</td>
                  <td>
                    <span className={`${styles.badge} ${trx.tipe === 'Organik' ? styles.badgeOrganic : styles.badgeAnorganic}`}>
                      {trx.tipe}
                    </span>
                  </td>
                  <td>{trx.volume}</td>
                  <td className={styles.poinText}>{trx.poin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
