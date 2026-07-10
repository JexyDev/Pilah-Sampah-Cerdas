import React, { useState, useEffect } from "react";

interface Household {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  currentVolume: number; // Liter (Max 25L)
  type: "ORGANIC" | "NON_ORGANIC";
  points: number;
}

const INITIAL_HOUSEHOLDS: Household[] = [
  { id: "1", name: "Bapak Asep", address: "RT 01 / RW 05, No. 12", latitude: -6.654812, longitude: 106.843125, currentVolume: 8.5, type: "ORGANIC", points: 340 },
  { id: "2", name: "Ibu Siti", address: "RT 01 / RW 05, No. 15", latitude: -6.655102, longitude: 106.843512, currentVolume: 23.2, type: "ORGANIC", points: 920 }, // Red (>90%)
  { id: "3", name: "Bapak Jeremy", address: "RT 02 / RW 05, No. 05", latitude: -6.654521, longitude: 106.842812, currentVolume: 12.0, type: "NON_ORGANIC", points: 480 },
  { id: "4", name: "Ibu Lani", address: "RT 02 / RW 05, No. 08", latitude: -6.654998, longitude: 106.842502, currentVolume: 19.5, type: "NON_ORGANIC", points: 780 }, // Yellow (70-90%)
  { id: "5", name: "Bapak Dedi", address: "RT 01 / RW 05, No. 22", latitude: -6.655350, longitude: 106.842990, currentVolume: 4.2, type: "ORGANIC", points: 160 }
];

export default function App() {
  const [households, setHouseholds] = useState<Household[]>(INITIAL_HOUSEHOLDS);
  const [selectedHh, setSelectedHh] = useState<Household | null>(null);
  const [hoveredHh, setHoveredHh] = useState<Household | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Simulator state
  const [simUserId, setSimUserId] = useState("user-jeremy");
  const [simHhId, setSimHhId] = useState("1");
  const [simVolume, setSimVolume] = useState(5.0);
  const [simType, setSimType] = useState<"ORGANIC" | "NON_ORGANIC">("ORGANIC");
  const [simLog, setSimLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute stats
  const activeHouseholds = households.length;
  const totalVolume = households.reduce((sum, h) => sum + h.currentVolume, 0).toFixed(1);
  const interventionCount = households.filter((h) => h.currentVolume >= 22.5).length; // 90% of 25L is 22.5L
  const averageCompliance = (
    (households.filter((h) => h.currentVolume < 22.5).length / households.length) *
    100
  ).toFixed(1);

  // Map projection utilities (maps GPS coordinates to SVG coordinate system)
  const mapWidth = 600;
  const mapHeight = 350;

  // Coordinate boundaries of our simulated neighborhood
  const minLat = -6.656000;
  const maxLat = -6.654000;
  const minLng = 106.842000;
  const maxLng = 106.844000;

  const getSvgCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    // In SVG, Y coordinate goes down, so we subtract from mapHeight to invert
    const y = mapHeight - ((lat - minLat) / (maxLat - minLat)) * mapHeight;
    return { x, y };
  };

  const addLog = (msg: string) => {
    setSimLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);
  };

  // Simulates scanning bin and sending to local backend API
  const handleSimulateScan = async () => {
    setIsProcessing(true);
    addLog(`Memulai simulasi deteksi AI & scan QR...`);

    const targetHh = households.find(h => h.id === simHhId);
    if (!targetHh) return;

    try {
      // Step 1: Detect AI simulation via local backend (Optional check)
      addLog(`Mengirim foto sampah ke AI Mock service (/api/v1/waste/detect-mock)...`);
      const detectResponse = await fetch("http://localhost:3000/api/v1/waste/detect-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: simUserId })
      });

      let aiResultType = simType;
      let aiVolume = simVolume;

      if (detectResponse.ok) {
        const detectData = await detectResponse.json();
        addLog(`Respon AI: Terdeteksi sampah ${detectData.data.detectedType} estimasi ${detectData.data.volumeEstimate} Liter.`);
        aiResultType = detectData.data.detectedType;
        aiVolume = detectData.data.volumeEstimate;
      } else {
        const errorData = await detectResponse.json().catch(() => ({}));
        addLog(`Peringatan: API backend offline/error (${errorData.error || "MOCK MODE"}). Menggunakan data input form.`);
      }

      // Step 2: Post transaction to backend `/api/v1/bins/scan`
      addLog(`Memindai QR Code Tong Sampah: QR-${targetHh.name.toUpperCase().replace(" ", "-")}...`);
      const scanResponse = await fetch("http://localhost:3000/api/v1/bins/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: `QR-BIN-${targetHh.name.toUpperCase().replace(" ", "-")}`,
          userId: simUserId,
          detectedType: aiResultType,
          estimatedVolume: aiVolume,
          householdId: targetHh.id
        })
      });

      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        const weightKg = scanData.data.weightKg;
        const pts = scanData.data.pointsAwarded;
        addLog(`Sukses Trello Card 3: Sampah ${weightKg} kg masuk. Poin +${pts}.`);

        // Update local React state to reflect changes
        setHouseholds(prev => prev.map(h => {
          if (h.id === targetHh.id) {
            return {
              ...h,
              currentVolume: Math.min(25.0, h.currentVolume + aiVolume),
              points: h.points + pts
            };
          }
          return h;
        }));
      } else {
        const errData = await scanResponse.json();
        addLog(`Ditolak: ${errData.message || "Kesalahan API"}`);
        if (errData.error === "BIN_OVERFLOW") {
          addLog("Status transaksi: Selesai - Tidak Tersimpan (Notifikasi dikirim).");
        }
      }

    } catch (err) {
      addLog(`Koneksi Backend gagal. Melakukan pembaruan lokal (Client Mock Mode)...`);
      // Fallback local update if backend port is not running
      const currentVal = targetHh.currentVolume;
      if (currentVal + simVolume > 25.0) {
        addLog("Ditolak: Kapasitas tong terlampaui! (Indikator Merah > 25L)");
        addLog("Status: Selesai - Tidak Tersimpan (Alert dipicu)");
      } else {
        setHouseholds(prev => prev.map(h => {
          if (h.id === targetHh.id) {
            const addedPoints = Math.round(simVolume * (simType === "ORGANIC" ? 40 : 20));
            return {
              ...h,
              currentVolume: currentVal + simVolume,
              points: h.points + addedPoints
            };
          }
          return h;
        }));
        addLog(`Berhasil: Menambahkan ${simVolume}L sampah ${simType} ke ${targetHh.name}.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const [currentRole, setCurrentRole] = useState<"ADMIN" | "PETUGAS_KELURAHAN" | "PETUGAS_RW" | "PETUGAS_RT" | "WARGA">("ADMIN");

  // Filter households based on role permission
  const filteredHouseholds = households.filter((h) => {
    if (currentRole === "PETUGAS_RT") {
      return h.address.includes("RT 01"); // RT 01 only for simulation
    }
    if (currentRole === "PETUGAS_RW") {
      return h.address.includes("RW 05"); // RW 05 only
    }
    return true; // ADMIN, PETUGAS_KELURAHAN, WARGA sees all (or filtered on dashboard views)
  });

  // Compute stats based on filtered view
  const activeHouseholds = filteredHouseholds.length;
  const totalVolume = filteredHouseholds.reduce((sum, h) => sum + h.currentVolume, 0).toFixed(1);
  const interventionCount = filteredHouseholds.filter((h) => h.currentVolume >= 22.5).length; // 90% of 25L is 22.5L
  const averageCompliance = activeHouseholds > 0 ? (
    (filteredHouseholds.filter((h) => h.currentVolume < 22.5).length / activeHouseholds) *
    100
  ).toFixed(1) : "100.0";


  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-section">
          <h1>pilahsampah.id</h1>
          <span>Smart GIS Monitoring System</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Peran Switcher */}
          <div className="role-banner">
            <span>Preview Peran:</span>
            <select 
              value={currentRole} 
              onChange={(e) => setCurrentRole(e.target.value as any)}
              style={{ background: "#0f172a", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", padding: "2px 8px", fontSize: "0.8rem", cursor: "pointer" }}
            >
              <option value="ADMIN">Admin Kecamatan</option>
              <option value="PETUGAS_KELURAHAN">Petugas Kelurahan</option>
              <option value="PETUGAS_RW">Petugas RW</option>
              <option value="PETUGAS_RT">Petugas RT 01</option>
              <option value="WARGA">Warga (Citizen Portal)</option>
            </select>
            <span className={`role-badge role-${currentRole.toLowerCase().replace("_", "-")}`}>
              {currentRole}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setHouseholds(INITIAL_HOUSEHOLDS)}>Reset Data</button>
        </div>
      </header>

      {currentRole === "WARGA" ? (
        /* Citizen view layout (Trello Card 4 UX Flow & design.md compliance) */
        <main className="main-content" style={{ gridTemplateColumns: "1fr" }}>
          <div className="panel" style={{ background: "radial-gradient(circle at top left, rgba(16, 185, 129, 0.08), transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2>Halo, Bapak Budi Santoso! 👋</h2>
                <p className="text-body" style={{ marginTop: "0.25rem" }}>Mari pilah sampah dari rumah untuk Coblong Bersih & Asri.</p>
              </div>
              <div className="stat-card" style={{ padding: "1rem 2rem", margin: 0 }}>
                <span className="stat-title">Poin Anda</span>
                <span className="stat-value" style={{ color: "#3b82f6" }}>2.840 Poin</span>
                <span className="stat-desc">#3 Paling Sadar di RT 01</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div className="household-card" style={{ border: "1px solid rgba(16, 185, 129, 0.2)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(16, 185, 129, 0.02)" }}>
                <div>
                  <h3 style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🟢</span> Sampah Organik
                  </h3>
                  <p className="text-body" style={{ marginTop: "0.5rem" }}>Tong sampah dedaunan, sisa sayur, sisa buah, dan sisa makanan.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                  <span>Estimasi Volume: <strong>8.5 Liter</strong></span>
                  <span style={{ color: "var(--warning)" }}>34% Kapasitas</span>
                </div>
                <button className="btn btn-md" style={{ width: "100%", background: "linear-gradient(to right, #10b981, #059669)" }} onClick={() => { setSimType("ORGANIC"); handleSimulateScan(); }}>
                  Kirim Foto Sampah Organik
                </button>
              </div>

              <div className="household-card" style={{ border: "1px solid rgba(59, 130, 246, 0.2)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(59, 130, 246, 0.02)" }}>
                <div>
                  <h3 style={{ color: "#3b82f6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🔵</span> Sampah Anorganik
                  </h3>
                  <p className="text-body" style={{ marginTop: "0.5rem" }}>Tong sampah plastik, kertas, kardus, botol kaca, dan logam.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                  <span>Estimasi Volume: <strong>12.0 Liter</strong></span>
                  <span style={{ color: "var(--danger)" }}>48% Kapasitas</span>
                </div>
                <button className="btn btn-md" style={{ width: "100%", background: "linear-gradient(to right, #3b82f6, #2563eb)" }} onClick={() => { setSimType("NON_ORGANIC"); handleSimulateScan(); }}>
                  Kirim Foto Sampah Anorganik
                </button>
              </div>
            </div>

            {/* Voucher Redemption */}
            <div className="panel-title">Tukarkan Poin Menjadi Voucher Belanja</div>
            <div className="voucher-grid">
              <div className="voucher-card">
                <div>
                  <span style={{ fontSize: "1.5rem" }}>🛍️</span>
                  <h4 style={{ margin: "0.5rem 0 0.25rem 0" }}>Voucher Alfamart Rp10k</h4>
                  <span className="text-body">1.000 Poin</span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>Tukarkan</button>
              </div>
              <div className="voucher-card">
                <div>
                  <span style={{ fontSize: "1.5rem" }}>🍜</span>
                  <h4 style={{ margin: "0.5rem 0 0.25rem 0" }}>Paket Sembako Dago</h4>
                  <span className="text-body">2.500 Poin</span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>Tukarkan</button>
              </div>
              <div className="voucher-card">
                <div>
                  <span style={{ fontSize: "1.5rem" }}>🔌</span>
                  <h4 style={{ margin: "0.5rem 0 0.25rem 0" }}>Token Listrik PLN 20k</h4>
                  <span className="text-body">2.000 Poin</span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>Tukarkan</button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Professional GIS / Admin / Petugas view layout (Bogor -> Coblong theme) */
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-title">Rata-rata Kepatuhan RT</span>
              <span className="stat-value">{averageCompliance}%</span>
              <span className="stat-desc">Status Kepatuhan Kelurahan</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Volume Terkumpul</span>
              <span className="stat-value">{totalVolume} L</span>
              <span className="stat-desc">Kapasitas Maksimal Terkumpul</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Rumah Tangga Terdaftar</span>
              <span className="stat-value">{activeHouseholds}</span>
              <span className="stat-desc">Titik Sensor Lokasi GPS</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Tong Penuh (Intervensi)</span>
              <span className="stat-value" style={{ color: interventionCount > 0 ? "var(--danger)" : "inherit" }}>
                {interventionCount}
              </span>
              <span className="stat-desc danger">Volume Bins &gt; 90% (22.5L)</span>
            </div>
          </section>

          <main className="main-content">
            {/* PANEL Left: GIS Map */}
            <div className="panel">
              <div className="panel-title">
                <span>Peta Spasial Distribusi Sampah Warga</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Kecamatan Coblong, Kota Bandung</span>
              </div>
              
              <div className="gis-container">
                <svg className="gis-svg" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
                  {/* Background grid */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* simulated neighborhood zones */}
                  {/* RT 01 Area */}
                  {(currentRole !== "PETUGAS_RT" || currentRole === "PETUGAS_RT") && (
                    <polygon 
                      points="50,50 320,30 280,320 60,300" 
                      className="zone-polygon" 
                      style={{ fill: "rgba(16, 185, 129, 0.03)", stroke: "rgba(16, 185, 129, 0.15)" }} 
                    />
                  )}
                  <text x="70" y="80" fill="rgba(16, 185, 129, 0.4)" fontSize="12" fontWeight="bold">RT 01 / RW 05</text>

                  {/* RT 02 Area */}
                  {currentRole !== "PETUGAS_RT" && (
                    <polygon 
                      points="320,30 550,60 520,310 280,320" 
                      className="zone-polygon" 
                      style={{ fill: "rgba(59, 130, 246, 0.03)", stroke: "rgba(59, 130, 246, 0.15)" }} 
                    />
                  )}
                  {currentRole !== "PETUGAS_RT" && (
                    <text x="450" y="90" fill="rgba(59, 130, 246, 0.4)" fontSize="12" fontWeight="bold">RT 02 / RW 05</text>
                  )}

                  {/* Households pins plotted on SVG */}
                  {filteredHouseholds.map((hh) => {
                    const { x, y } = getSvgCoords(hh.latitude, hh.longitude);
                    
                    // Color mapping: green if safe, yellow if high, red if full (>90%)
                    const percentage = (hh.currentVolume / 25.0) * 100;
                    let color = "var(--primary)";
                    if (percentage >= 90) color = "var(--danger)";
                    else if (percentage >= 70) color = "var(--warning)";

                    return (
                      <g 
                        key={hh.id} 
                        className="gis-pin" 
                        style={{ color }}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedHh(hh)}
                        onMouseMove={(e) => handleMouseMove(e, hh)}
                        onMouseLeave={() => setHoveredHh(null)}
                      >
                        {/* Ring animation for warning/danger pins */}
                        {percentage >= 70 && (
                          <circle r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle r="8" fill="currentColor" />
                        <circle r="4" fill="#fff" />
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredHh && (
                  <div className="gis-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    <div style={{ fontWeight: "bold" }}>{hoveredHh.name}</div>
                    <div>Volume: {hoveredHh.currentVolume} / 25L</div>
                    <div>Status: {((hoveredHh.currentVolume / 25) * 100).toFixed(0)}% Penuh</div>
                  </div>
                )}
              </div>
              
              {/* Selected Household Detail */}
              {selectedHh && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "1rem" }}>Detail Rumah Tangga: {selectedHh.name}</span>
                    <button className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setSelectedHh(null)}>Tutup</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                    <div>Alamat: {selectedHh.address}</div>
                    <div>Koordinat: {selectedHh.latitude.toFixed(6)}, {selectedHh.longitude.toFixed(6)}</div>
                    <div>Tipe Sensor: Tong {selectedHh.type}</div>
                    <div>Akumulasi Poin: {selectedHh.points} Pts</div>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL Right: Capacity Indicators */}
            <div className="panel">
              <div className="panel-title">
                <span>Kapasitas Tong Sampah Warga</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sensor Real-Time</span>
              </div>

              <div className="household-list">
                {filteredHouseholds.map((hh) => {
                  const percentage = (hh.currentVolume / 25.0) * 100;
                  let barClass = "success";
                  if (percentage >= 90) barClass = "danger";
                  else if (percentage >= 70) barClass = "warning";

                  return (
                    <div key={hh.id} className="household-card">
                      <div className="hh-header">
                        <span className="hh-name">{hh.name}</span>
                        <span className="hh-meta">Tipe: {hh.type}</span>
                      </div>
                      <div className="progress-container">
                        <div 
                          className={`progress-bar ${barClass}`} 
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                      <div className="progress-labels">
                        <span>{hh.currentVolume.toFixed(1)} / 25.0 Liter</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{hh.address}</span>
                        {/* Only RT can empty direct, other roles disable/hidden based on permission */}
                        {(currentRole === "ADMIN" || currentRole === "PETUGAS_RT" || currentRole === "PETUGAS_RW") && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ height: "24px", fontSize: "0.7rem" }}
                            onClick={() => handleEmptyBin(hh.id)}
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL Bottom: Simulator Control Panel */}
            <div className="panel simulator-panel">
              <div className="panel-title">
                <span>Simulasi Transaksi Setoran Sampah Warga</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Koneksi API / Local Fallback</span>
              </div>

              <div className="simulator-form">
                <div className="form-group">
                  <label>Pilih Warga</label>
                  <select value={simHhId} onChange={(e) => setSimHhId(e.target.value)}>
                    {filteredHouseholds.map(h => (
                      <option key={h.id} value={h.id}>{h.name} - {h.address}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kategori Sampah</label>
                  <select value={simType} onChange={(e) => setSimType(e.target.value as any)}>
                    <option value="ORGANIC">Organik</option>
                    <option value="NON_ORGANIC">Non-Organik</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Volume Estimasi (L)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    max="10.0" 
                    value={simVolume} 
                    onChange={(e) => setSimVolume(parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <button 
                    className="btn btn-md" 
                    style={{ width: "100%" }} 
                    onClick={handleSimulateScan}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Memproses..." : "Kirim Simulasi Transaksi"}
                  </button>
                </div>
              </div>

              {/* Simulation Output Terminal */}
              <div style={{ marginTop: "1rem", background: "#060913", borderRadius: "8px", padding: "1rem", border: "1px solid var(--border-color)", fontFamily: "monospace", fontSize: "0.8rem" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.25rem" }}>
                  Terminal Hasil Simulasi API (Real-Time)
                </div>
                <div style={{ height: "120px", overflowY: "auto", display: "flex", flexDirection: "column-reverse" }}>
                  {simLog.length === 0 ? (
                    <div style={{ color: "#4b5563" }}>Belum ada log transaksi. Klik tombol kirim di atas untuk memulai simulasi.</div>
                  ) : (
                    simLog.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: "0.25rem", color: log.includes("Ditolak") || log.includes("Peringatan") ? "var(--danger)" : log.includes("Sukses") || log.includes("Berhasil") ? "var(--primary)" : "inherit" }}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
