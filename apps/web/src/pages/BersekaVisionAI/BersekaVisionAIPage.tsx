/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Demonstrasi & Pengujian AISAh Vision AI Engine
 * Model: AISAh Multi-Modal Vision Engine (Qwen2.5-VL Backbone + Rule Engine Deterministik)
 * Standar Warna: Organik (Hijau), Anorganik (Kuning), Residu (Merah)
 */

import React, { useState, useRef, useEffect } from "react";
import styles from "./BersekaVisionAI.module.css";

interface BoundingBoxObject {
  box_2d: [number, number, number, number];
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
  const [loadingStep, setLoadingStep] = useState<string>("Mengoptimalkan foto...");
  const [result, setResult] = useState<VisionDetectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "ORGANIK" | "ANORGANIK" | "RESIDU">("ALL");
  const [copied, setCopied] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Siklus teks progres analisis AISAh agar pengguna mengetahui proses komputasi AI
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (loading) {
      setLoadingStep("Mengunggah dan membaca piksel foto sampah...");
      timer1 = setTimeout(() => {
        setLoadingStep("AISAh Vision Engine mengidentifikasi komponen objek...");
      }, 900);
      timer2 = setTimeout(() => {
        setLoadingStep("Mengklasifikasikan bahan ke Organik, Anorganik, dan Residu...");
      }, 2000);
      timer3 = setTimeout(() => {
        setLoadingStep("Menghitung rasio komposisi dan rekomendasi Tempat Sampah...");
      }, 3200);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [loading]);

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

  /**
   * Kompresi foto otomatis di browser sebelum diunggah ke server API
   * Memastikan foto kamera HP (12MP - 50MP, 8MB+) diperkecil secara efisien (<350KB)
   * tanpa menurunkan akurasi pengenalan objek.
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1280;
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedB64 = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressedB64);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Format file tidak didukung. Harap pilih file foto gambar (JPG, PNG, WebP).");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setCopied(false);
      setFilterCategory("ALL");

      // Auto-compress
      const compressedB64 = await compressImage(file);
      setPreview(compressedB64);

      // Gulir otomatis ke panel hasil pada perangkat mobile (layar sempit)
      if (window.innerWidth < 1024 && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }

      await runVisionAnalysis(compressedB64);
    } catch (err: any) {
      setError(err.message || "Gagal memproses file foto.");
      setLoading(false);
    }
  };

  const runVisionAnalysis = async (base64Image: string) => {
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
        throw new Error(resData.message || "Gagal melakukan analisis AISAh Vision.");
      }

      setResult(resData.data);

      // Pastikan hasil terlihat di HP setelah loading selesai
      if (window.innerWidth < 1024 && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kendala koneksi ke server AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const itemsList = result.objects.map((o) => `${o.label} (${o.category})`).join(", ");
    const text = `📋 HASIL ANALISIS AISAh VISION AI (BERSEKA)
• Rekomendasi Utama: Tempat Sampah ${result.rekomendasi_tempat_sampah.toUpperCase()}
• Komposisi: Organik ${result.organik_percent}% | Anorganik ${result.anorganik_percent}% | Residu ${result.residu_percent}%
• Komponen Terdeteksi (${result.objects.length}): ${itemsList}
• Estimasi Volume: ${result.estimatedVolumeLiter} Liter
• Ringkasan: ${result.ringkasan_eksekutif}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getSummaryCardClass = (category: string) => {
    if (category === "ORGANIK") return styles.summaryOrganik;
    if (category === "ANORGANIK") return styles.summaryAnorganik;
    return styles.summaryResidu;
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

  const displayedObjects = result?.objects.filter((obj) => {
    if (filterCategory === "ALL") return true;
    return obj.category === filterCategory;
  }) || [];

  const countOrg = result?.objects.filter((o) => o.category === "ORGANIK").length || 0;
  const countInorg = result?.objects.filter((o) => o.category === "ANORGANIK").length || 0;
  const countRes = result?.objects.filter((o) => o.category === "RESIDU").length || 0;

  return (
    <div className={styles.container}>
      {/* Hidden File Inputs */}
      {/* 1. Kamera HP Langsung (Environment / Belakang) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />
      {/* 2. Galeri / File Picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.brandBadge}>
          <span className={styles.brandBadgeDot}></span>
          AISAh Vision AI Engine • BERSEKA
        </div>
        <h1>Deteksi Cerdas Pemilahan Sampah</h1>
        <p>
          Arahkan kamera smartphone ke sampel atau tumpukan sampah. AISAh secara instan mengidentifikasi
          komponen material dan memberikan rekomendasi Tempat Sampah yang sesuai standar nasional.
        </p>
      </header>

      <div className={styles.mainGrid}>
        {/* Kolom Kiri: Input Kamera, Preview & Panduan Warna */}
        <div className={styles.leftColumn}>
          {/* Action Buttons (Dioptimalkan untuk HP) */}
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.btnCamera}
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Foto Langsung (Kamera HP)</span>
            </button>

            <button
              type="button"
              className={styles.btnGallery}
              onClick={() => galleryInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Pilih dari Galeri</span>
            </button>
          </div>

          {/* Preview Gambar Foto Sampah */}
          {preview ? (
            <div className={styles.previewContainer}>
              <img src={preview} alt="Pratinjau Sampah" className={styles.imagePreview} />
              <div className={styles.previewActions}>
                <span className={styles.previewBadge}>
                  <span className={styles.previewBadgeDot}></span>
                  Foto Sampah Aktif
                </span>
                <button
                  type="button"
                  className={styles.btnRetake}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>Ganti Foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={dropzoneRef}
              className={styles.dropzone}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => galleryInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <h3>Seret & Letakkan Foto Sampah di Sini</h3>
              <p>Mendukung format JPG, PNG, atau WebP resolusi tinggi</p>
            </div>
          )}

          {/* Panduan Warna Resmi Tempat Sampah */}
          <div className={styles.legendBar}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotOrganik}`}></div>
              <span>Organik (Hijau - Kompos)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotAnorganik}`}></div>
              <span>Anorganik (Kuning - Daur Ulang)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotResidu}`}></div>
              <span>Residu (Merah - TPA)</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Analisis Cerdas AISAh */}
        <div ref={resultsRef} className={styles.resultsSection}>
          {loading && (
            <div className={styles.loadingBox}>
              <div className={styles.spinner}></div>
              <h3>AISAh Sedang Menganalisis Foto...</h3>
              <p className={styles.loadingStepText}>{loadingStep}</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p>⚠️ {error}</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Card Rekomendasi Utama Tempat Sampah */}
              <div className={`${styles.summaryCard} ${getSummaryCardClass(result.kategori_utama)}`}>
                <div className={styles.summaryHeader}>
                  <div>
                    <span className={styles.labelMuted}>Rekomendasi Pemilahan Utama</span>
                    <h2 className={styles.kategoriTitle}>{result.kategori_utama}</h2>
                  </div>
                  <div className={`${styles.binBadge} ${getBadgeClass(result.kategori_utama)}`}>
                    Tempat Sampah {result.rekomendasi_tempat_sampah.toUpperCase()}
                  </div>
                </div>

                <p className={styles.ringkasanText}>{result.ringkasan_eksekutif}</p>

                {/* Tombol Salin Laporan Analisis */}
                <div className={styles.cardActionRow}>
                  <button
                    type="button"
                    className={`${styles.btnCopy} ${copied ? styles.btnCopySuccess : ""}`}
                    onClick={handleCopySummary}
                  >
                    {copied ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Salin Hasil Analisis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bar Komposisi Dinamis 3 Warna (Hijau, Kuning, Merah) */}
              <div className={styles.compositionCard}>
                <h3>Komposisi Material Sampah</h3>
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
                    <span className={`${styles.legendDot} ${styles.dotOrganik}`}></span>
                    <span>Organik: {result.organik_percent}%</span>
                  </div>
                  <div className={styles.ratioItem}>
                    <span className={`${styles.legendDot} ${styles.dotAnorganik}`}></span>
                    <span>Anorganik: {result.anorganik_percent}%</span>
                  </div>
                  <div className={styles.ratioItem}>
                    <span className={`${styles.legendDot} ${styles.dotResidu}`}></span>
                    <span>Residu: {result.residu_percent}%</span>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Benda yang Dikenali AISAh */}
              <div className={styles.objectsCard}>
                <div className={styles.objectsCardHeader}>
                  <div className={styles.objectsCardTitleRow}>
                    <h3>Komponen Sampah Teridentifikasi ({result.objects.length} Benda)</h3>
                    <p className={styles.objectsCardSubtitle}>
                      Dikenali secara visual oleh AISAh Vision Engine
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
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, padding: "0.5rem 0" }}>
                    Tidak ada objek yang sesuai dengan filter kategori ini.
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

              {/* Metrik Teknis AISAh Engine */}
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <span>Tingkat Keyakinan (Confidence)</span>
                  <strong>{(result.confidenceScore * 100).toFixed(1)}%</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Estimasi Volume Fisik</span>
                  <strong>{result.estimatedVolumeLiter} Liter</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Waktu Inferensi AI</span>
                  <strong>{result.latencyMs} ms</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Model AI Engine</span>
                  <strong>AISAh Vision (v2.0)</strong>
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
              <p>Ambil foto sampah lewat kamera HP atau pilih file dari galeri untuk memulai pemilahan otomatis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BersekaVisionAIPage;
