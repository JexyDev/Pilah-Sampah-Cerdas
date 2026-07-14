import React, { useEffect } from 'react';
import { Loader2, Medal } from 'lucide-react';
import { useLeaderboardStore } from '../../store/useLeaderboardStore';
import styles from './Leaderboard.module.css';

const Leaderboard: React.FC = () => {
  const { users, isLoading, error, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (isLoading && users.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} color="var(--primary-green)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
        <button className={styles.btnPrimary} onClick={fetchLeaderboard}>Coba Lagi</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Leaderboard Warga</h2>
      <p className={styles.subtitle}>Peringkat warga dengan pengumpulan poin terbanyak</p>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Nama Warga</th>
              <th>Total Poin</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.rank <= 3 ? styles.topRank : ''}>
                <td>
                  <div className={styles.rankWrapper}>
                    {u.rank === 1 && <Medal color="#FDE047" size={20} />}
                    {u.rank === 2 && <Medal color="#9CA3AF" size={20} />}
                    {u.rank === 3 && <Medal color="#D97706" size={20} />}
                    <span className={styles.rankNumber}>{u.rank}</span>
                  </div>
                </td>
                <td className={styles.nameCell}>{u.name}</td>
                <td className={styles.pointsCell}>{u.points.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
