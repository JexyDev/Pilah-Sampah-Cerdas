/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Demonstrasi & Pengujian Berseka Vision AI
 * Model: Qwen/Qwen2.5-VL-72B-Instruct (Visual Grounding Bounding Box + 3 Klasifikasi)
 * Kategori: Organik, Anorganik, Residu
 */

import React, { useState, useRef } from "react";
import styles from "./BersekaVisionAI.module.css";

interface BoundingBoxObject {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0-1000)
  label: string;
  category: "ORGANIK" | "ANORGANIK" | "RESIDU";
  confidence?: number;
}

interface VisionDetectionData {
  kategori_utama: "ORGANIK" | "ANORGANIK" | "RESIDU";
  rekomendasi_tempat_sampah: "organik" | "anorganik" | "residu";
  organik_percent: number;
  anorganik_percent: number;
  residu_percent: number;
  objects: BoundingBoxObject[];
  confidenceScore: number;
  estimatedVolumeLiter: number;
  latencyMs: number;
  ringkasan_eksekutif: string;
  vendorName: string;
  imageUrl?: string;
}

const BersekaVisionAIPage: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionDetectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "ORGANIK" | "ANORGANIK" | "RESIDU">("ALL");
  const [showBbox, setShowBbox] = useState<boolean>(true);

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.add(styles.dragover);
    }
  };

  const handleDragLeave = () => {
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove(styles.dragover);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove(styles.dragover);
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Harap unggah file gambar (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setPreview(b64);
      setResult(null);
      setError(null);
      setFilterCategory("ALL");
      runVisionAnalysis(b64);
    };
    reader.readAsDataURL(file);
  };

  const runVisionAnalysis = async (base64Image: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("psc_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/v1/ai/vision-detect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageBase64: base64Image,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Gagal melakukan deteksi Vision AI.");
      }

      setResult(resData.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi ke server AI.");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (category: string) => {
    if (category === "ORGANIK") return styles.badgeOrganik;
    if (category === "ANORGANIK") return styles.badgeAnorganik;
    return styles.badgeResidu;
  };

  const getTagClass = (category: string) => {
    if (category === "ORGANIK") return styles.tagOrg;
    if (category === "ANORGANIK") return styles.tagInorg;
    return styles.tagRes;
  };

  // Filter objek berdasarkan tab kategori aktif
  const displayedObjects = result?.objects.filter((obj) => {
    if (filterCategory === "ALL") return true;
    return obj.category === filterCategory;
  }) || [];

  const countOrg = result?.objects.filter((o) => o.category === "ORGANIK").length || 0;
  const countInorg = result?.objects.filter((o) => o.category === "ANORGANIK").length || 0;
  const countRes = result?.objects.filter((o) => o.category === "RESIDU").length || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>BERSEKA Vision AI Engine</div>
        <h1>Deteksi Cerdas Sampah 3 Klasifikasi</h1>
        <p>
          Analisis mendalam komposisi Organik, Anorganik, dan Residu secara otomatis dari foto sampah.
        </p>
      </header>

      <div className={styles.mainGrid}>
        {/* Kolom Kiri: Upload & Pratinjau Foto */}
        <div className={styles.leftColumn}>
          <div
            ref={dropzoneRef}
            className={styles.dropzone}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <h3>Tarik & Letakkan Foto Sampah di Sini</h3>
            <p>Mendukung format JPG, PNG, atau WebP untuk analisis instan.</p>
            <span className={styles.browseBtn}>Pilih Foto dari Perangkat</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: "none" }}
            />
          </div>

          {preview && (
            <div className={styles.previewWrapper}>
              <img src={preview} alt="Pratinjau Sampah" className={styles.imageLayer} />
            </div>
          )}

          {/* Legenda Kategori Sampah */}
          <div className={styles.legendBar}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotOrganik}`}></div>
              <span>Organik (Dapat Terurai / Kompos)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotAnorganik}`}></div>
              <span>Anorganik (Bernilai Daur Ulang)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotResidu}`}></div>
              <span>Residu (Non-Daur Ulang / TPA)</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Analitik & Rekomendasi Eksekutif */}
        <div className={styles.resultsSection}>
          {loading && (
            <div className={styles.loadingBox}>
              <div className={styles.spinner}></div>
              <h3>Menganalisis Komposisi Sampah...</h3>
              <p>
                Menghubungi vision engine untuk mengidentifikasi komponen objek dan menghitung rasio 3 kategori.
              </p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p>⚠️ {error}</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Card Ringkasan Utama */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <div>
                    <span className={styles.labelMuted}>Kategori Dominan</span>
                    <h2 className={styles.kategoriTitle}>{result.kategori_utama}</h2>
                  </div>
                  <div className={`${styles.kategoriBadge} ${getBadgeClass(result.kategori_utama)}`}>
                    Tempat Sampah {result.rekomendasi_tempat_sampah.toUpperCase()}
                  </div>
                </div>

                <p className={styles.ringkasanText}>{result.ringkasan_eksekutif}</p>
              </div>

              {/* Bar Komposisi Sampah Dinamis 3 Warna */}
              <div className={styles.compositionCard}>
                <h3>Komposisi Sampah Terdeteksi</h3>
                <div className={styles.ratioBarContainer}>
                  {result.organik_percent > 0 && (
                    <div
                      className={styles.barOrganik}
                      style={{ width: `${result.organik_percent}%` }}
                      title={`Organik: ${result.organik_percent}%`}
                    >
                      {result.organik_percent >= 10 ? `${result.organik_percent}%` : ""}
                    </div>
                  )}
                  {result.anorganik_percent > 0 && (
                    <div
                      className={styles.barAnorganik}
                      style={{ width: `${result.anorganik_percent}%` }}
                      title={`Anorganik: ${result.anorganik_percent}%`}
                    >
                      {result.anorganik_percent >= 10 ? `${result.anorganik_percent}%` : ""}
                    </div>
                  )}
                  {result.residu_percent > 0 && (
                    <div
                      className={styles.barResidu}
                      style={{ width: `${result.residu_percent}%` }}
                      title={`Residu: ${result.residu_percent}%`}
                    >
                      {result.residu_percent >= 10 ? `${result.residu_percent}%` : ""}
                    </div>
                  )}
                </div>

                <div className={styles.ratioLegend}>
                  <div className={styles.ratioItem}>
                    <span className={styles.dotOrganik}></span>
                    <span>Organik: {result.organik_percent}%</span>
                  </div>
                  <div className={styles.ratioItem}>
                    <span className={styles.dotAnorganik}></span>
                    <span>Anorganik: {result.anorganik_percent}%</span>
                  </div>
                  <div className={styles.ratioItem}>
                    <span className={styles.dotResidu}></span>
                    <span>Residu: {result.residu_percent}%</span>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Benda Terdeteksi + Filter Tab */}
              <div className={styles.objectsCard}>
                <div className={styles.objectsCardHeader}>
                  <div>
                    <h3>Komponen Sampah Terdeteksi ({result.objects.length} Benda)</h3>
                    <p className={styles.objectsCardSubtitle}>
                      Rincian bahan yang dikenali oleh model Vision AI
                    </p>
                  </div>

                  <div className={styles.filterTabs}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${filterCategory === "ALL" ? styles.filterActiveAll : ""}`}
                      onClick={() => setFilterCategory("ALL")}
                    >
                      Semua ({result.objects.length})
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${filterCategory === "ORGANIK" ? styles.filterActiveOrg : ""}`}
                      onClick={() => setFilterCategory("ORGANIK")}
                    >
                      Organik ({countOrg})
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${filterCategory === "ANORGANIK" ? styles.filterActiveInorg : ""}`}
                      onClick={() => setFilterCategory("ANORGANIK")}
                    >
                      Anorganik ({countInorg})
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${filterCategory === "RESIDU" ? styles.filterActiveRes : ""}`}
                      onClick={() => setFilterCategory("RESIDU")}
                    >
                      Residu ({countRes})
                    </button>
                  </div>
                </div>

                {displayedObjects.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, padding: "1rem 0" }}>
                    Tidak ada objek terdeteksi untuk kategori ini.
                  </p>
                ) : (
                  <div className={styles.objectTags}>
                    {displayedObjects.map((obj, idx) => (
                      <span
                        key={idx}
                        className={`${styles.objTag} ${getTagClass(obj.category)}`}
                      >
                        • {obj.label} ({obj.category})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrik Teknis Model */}
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <span>Akurasi Deteksi</span>
                  <strong>{(result.confidenceScore * 100).toFixed(1)}%</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Estimasi Volume</span>
                  <strong>{result.estimatedVolumeLiter} Liter</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Waktu Inferensi</span>
                  <strong>{result.latencyMs} ms</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Model AI Engine</span>
                  <strong>{result.vendorName}</strong>
                </div>
              </div>
            </>
          )}

          {!loading && !error && !result && (
            <div className={styles.placeholder}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Unggah foto sampah di samping untuk melihat hasil analisis dan visual bounding box.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BersekaVisionAIPage;
