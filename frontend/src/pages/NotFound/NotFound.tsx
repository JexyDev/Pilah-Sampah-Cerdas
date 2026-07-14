import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import styles from './NotFound.module.css';

const NotFound: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <FileQuestion size={80} color="var(--primary-green)" className={styles.icon} />
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Halaman Tidak Ditemukan</h2>
        <p className={styles.description}>
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link to="/" className={styles.backBtn}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
