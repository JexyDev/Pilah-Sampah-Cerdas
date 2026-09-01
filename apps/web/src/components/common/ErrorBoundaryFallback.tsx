/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import styles from "./ErrorBoundaryFallback.module.css";

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isChunkError =
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Importing a module script failed") ||
    errorMessage.includes("error loading dynamically imported module");

  const handleRetry = () => {
    if (isChunkError) {
      window.location.reload();
    } else {
      resetErrorBoundary();
    }
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={48} color="var(--danger-red)" />
        </div>
        <h2 className={styles.title}>
          {isChunkError ? "Pembaruan Aplikasi Tersedia" : "Terjadi Kesalahan Tidak Terduga"}
        </h2>
        <p className={styles.description}>
          {isChunkError
            ? "Telah dilakukan pembaruan sistem. Silakan muat ulang halaman untuk mendapatkan versi terbaru."
            : "Mohon maaf, sistem mengalami gangguan saat memuat komponen ini."}
        </p>
        <div className={styles.errorDetails}>
          <pre>{errorMessage}</pre>
        </div>
        <button className={styles.retryButton} onClick={handleRetry}>
          <RefreshCcw size={18} />
          {isChunkError ? "Muat Ulang Halaman" : "Coba Lagi"}
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
