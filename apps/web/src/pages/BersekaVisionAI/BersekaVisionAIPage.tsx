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
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
    runVisionAnalysis(file);
  };

  const runVisionAnalysis = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("psc_access_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/v1/ai/vision-detect", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal menganalisis visual sampah.");
      }

      const resData = await response.json();
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

  const getBboxClass = (category: string) => {
    if (category === "ORGANIK") return styles.bboxOrganik;
    if (category === "ANORGANIK") return styles.bboxAnorganik;
    return styles.bboxResidu;
  };

  const getTagClass = (category: string) => {
    if (category === "ORGANIK") return styles.tagOrg;
    if (category === "ANORGANIK") return styles.tagInorg;
    return styles.tagRes;
  };

  const getCategoryColor = (category: string) => {
    if (category === "ORGANIK") return "#10b981";
    if (category === "ANORGANIK") return "#0ea5e9";
    return "#ef4444";
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>BERSEKA Vision Grounding AI v2.0</div>
        <h1>Deteksi Cerdas Sampah 3 Klasifikasi</h1>
        <p>
          Pemilahan otomatis Organik, Anorganik, dan Residu dilengkapi identifikasi objek dan
          koordinat visual Bounding Box secara real-time.
        </p>
      </header>

      <div className={styles.mainGrid}>
        {/* Kolom Kiri: Upload & Visualisasi Bounding Box */}
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
            <div className={styles.dropzoneText}>
              Pilih foto sampah atau seret gambar ke area ini
            </div>
            <div className={styles.dropzoneSub}>
              Mendukung format JPG, PNG, WebP (Maks. 10MB)
            </div>
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

              {result && result.objects.length > 0 && (
                <svg
                  className={styles.svgOverlay}
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                >
                  {result.objects.map((obj, idx) => {
                    const [ymin, xmin, ymax, xmax] = obj.box_2d;
                    const width = Math.max(0, xmax - xmin);
                    const height = Math.max(0, ymax - ymin);
                    const isHovered = hoveredIndex === idx;
                    const catColor = getCategoryColor(obj.category);

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Kotak Bounding Box */}
                        <rect
                          x={xmin}
                          y={ymin}
                          width={width}
                          height={height}
                          className={`${styles.bboxRect} ${getBboxClass(obj.category)}`}
                          style={isHovered ? { strokeWidth: 6, fillOpacity: 0.4 } : {}}
                        />

                        {/* Background Tag Label */}
                        <rect
                          x={xmin}
                          y={Math.max(0, ymin - 36)}
                          width={Math.min(320, Math.max(120, obj.label.length * 15 + 24))}
                          height={34}
                          fill={catColor}
                          className={styles.bboxTagBg}
                        />

                        {/* Teks Label Nama Benda */}
                        <text
                          x={xmin + 10}
                          y={Math.max(22, ymin - 14)}
                          className={styles.bboxLabel}
                        >
                          {obj.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          )}

          {/* Legenda Warna Bounding Box */}
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
              <h3>Menganalisis Visual Sampah...</h3>
              <p>
                Menghubungi engine Qwen2.5-VL untuk segmentasi visual grounding dan estimasi
                komposisi 3 kategori.
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
              {/* Rekomendasi Tempat Sampah Utama */}
              <div className={styles.topDecisionCard}>
                <div className={styles.decisionHeader}>
                  <span className={styles.decisionTitle}>Kategori Dominan</span>
                  <span className={`${styles.mainBadge} ${getBadgeClass(result.kategori_utama)}`}>
                    {result.kategori_utama}
                  </span>
                </div>
                <p className={styles.binInstruction}>
                  Instruksi Pemilahan: Buang ke{" "}
                  <span>Tempat Sampah {result.rekomendasi_tempat_sampah}</span>
                </p>
                <p className={styles.executiveSummary}>{result.ringkasan_eksekutif}</p>
              </div>

              {/* Bar Komposisi 3 Warna */}
              <div className={styles.compositionSection}>
                <div className={styles.compHeader}>Komposisi Sampah Terdeteksi</div>
                <div className={styles.triColorBar}>
                  <div
                    className={styles.barOrg}
                    style={{ width: `${result.organik_percent}%` }}
                    title={`Organik: ${result.organik_percent}%`}
                  ></div>
                  <div
                    className={styles.barInorg}
                    style={{ width: `${result.anorganik_percent}%` }}
                    title={`Anorganik: ${result.anorganik_percent}%`}
                  ></div>
                  <div
                    className={styles.barRes}
                    style={{ width: `${result.residu_percent}%` }}
                    title={`Residu: ${result.residu_percent}%`}
                  ></div>
                </div>
                <div className={styles.compLabels}>
                  <span className={styles.compLblOrg}>Organik: {result.organik_percent}%</span>
                  <span className={styles.compLblInorg}>Anorganik: {result.anorganik_percent}%</span>
                  <span className={styles.compLblRes}>Residu: {result.residu_percent}%</span>
                </div>
              </div>

              {/* Rincian Objek Spesifik Terdeteksi */}
              <div className={styles.inventorySection}>
                <div className={styles.inventoryTitle}>
                  Objek Spesifik Terdeteksi ({result.objects.length} Benda):
                </div>
                {result.objects.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                    Tidak ada objek individual yang terisolasi secara terpisah.
                  </p>
                ) : (
                  <div className={styles.objectTags}>
                    {result.objects.map((obj, idx) => (
                      <span
                        key={idx}
                        className={`${styles.objTag} ${getTagClass(obj.category)}`}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={
                          hoveredIndex === idx
                            ? { transform: "scale(1.05)", fontWeight: "800" }
                            : {}
                        }
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
