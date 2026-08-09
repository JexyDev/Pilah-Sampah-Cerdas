import React, { useState, useRef } from "react";
import styles from "./SimulasiModelAI.module.css";

interface PredictionResult {
  detectedType: "ORGANIC" | "NON_ORGANIC";
  confidenceScore: number;
  estimatedVolumeLiter: number;
  organik_percent: number;
  non_organik_percent: number;
  vendorName: string;
}

const SimulasiModelAI: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    runPrediction(file);
  };

  const runPrediction = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    const t0 = performance.now();
    try {
      const response = await fetch("/api/v1/waste/classify", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("psc_access_token")}`,
        },
      });

      const t1 = performance.now();
      setLatency(Math.round(t1 - t0));

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 422) {
          throw new Error(
            "Tidak terdeteksi objek sampah pada gambar (Tingkat Keyakinan AI < 40%). Coba foto dengan pencahayaan lebih baik."
          );
        }
        throw new Error(errJson.message || "Gagal memproses gambar");
      }

      const data = await response.json();
      setResult(data.data || data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses gambar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🤖 Simulasi Model AI TrashCare</h1>
        <p>Pengujian Real-Time Klasifikasi Sampah (YOLOv8-seg ONNX Engine)</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Upload Section */}
        <div className={styles.uploadSection}>
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
            <p>Seret & taruh foto sampah di sini, atau klik untuk memilih</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: "none" }}
            />
          </div>

          {preview && (
            <div className={styles.previewContainer}>
              <img src={preview} alt="Preview" />
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className={styles.resultsSection}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Menganalisis gambar dengan model AI...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className={styles.resultsCard}>
              <div className={styles.resultHeader}>
                <h2>Kategori Dominan</h2>
                <span className={`${styles.typePill} ${result.detectedType === "ORGANIC" ? styles.organic : styles.inorganic}`}>
                  {result.detectedType === "ORGANIC" ? "Organik" : "Anorganik"}
                </span>
              </div>

              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <span>Akurasi (Confidence)</span>
                  <strong>{(result.confidenceScore * 100).toFixed(1)}%</strong>
                </div>
                <div className={styles.statBox}>
                  <span>Estimasi Volume</span>
                  <strong>{result.estimatedVolumeLiter.toFixed(1)} Liter</strong>
                </div>
                <div className={styles.statBox}>
                  <span>Waktu Inferensi (Latency)</span>
                  <strong>{latency || 0} ms</strong>
                </div>
                <div className={styles.statBox}>
                  <span>Vendor Mesin AI</span>
                  <strong>{result.vendorName}</strong>
                </div>
              </div>

              <div className={styles.compositionContainer}>
                <div className={styles.compositionLabels}>
                  <span className={styles.labelOrg}>Organik: {result.organik_percent}%</span>
                  <span className={styles.labelInorg}>Anorganik: {result.non_organik_percent}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barOrganic}
                    style={{ width: `${result.organik_percent}%` }}
                  ></div>
                  <div
                    className={styles.barInorganic}
                    style={{ width: `${result.non_organik_percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !result && (
            <div className={styles.placeholder}>
              <p>Unggah foto untuk melihat hasil inferensi AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulasiModelAI;
