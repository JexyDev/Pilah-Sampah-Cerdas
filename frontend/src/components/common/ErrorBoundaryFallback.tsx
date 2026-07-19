/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { FallbackProps } from 'react-error-boundary';
import styles from './ErrorBoundaryFallback.module.css';

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={48} color="var(--danger-red)" />
        </div>
        <h2 className={styles.title}>Terjadi Kesalahan Tidak Terduga</h2>
        <p className={styles.description}>
          Mohon maaf, sistem mengalami gangguan saat memuat komponen ini.
        </p>
        <div className={styles.errorDetails}>
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
        </div>
        <button className={styles.retryButton} onClick={resetErrorBoundary}>
          <RefreshCcw size={18} />
          Coba Lagi
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
