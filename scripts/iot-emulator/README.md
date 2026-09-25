# 🛰️ BERSEKA IoT Sensor CH4 & Telemetry Emulator (Agrisense Node)

Emulator mandiri berbasis Node.js untuk mensimulasikan transmisi data telemetri gas metana (CH4), suhu, kelembaban, dan level baterai dari perangkat Agrisense Node ke backend BERSEKA.

## 📌 Titik Simulasi Node (Kecamatan Coblong)
1. **TPS Sadang Serang** (`NODE-COBLONG-01`) - Kelurahan Sadang Serang
2. **Tempat Sampah Pasar Dago** (`NODE-COBLONG-02`) - Kelurahan Dago
3. **Bank Sampah Cipaganti** (`NODE-COBLONG-03`) - Kelurahan Cipaganti

---

## 🚀 Cara Menjalankan

Masuk ke folder emulator:
```bash
cd scripts/iot-emulator
```

### 1. Mode Standar (Interval 5 detik)
```bash
node emulator.js
# atau
npm start
```

### 2. Mode Sekali Kirim (`--once`)
Mengirim 1 paket telemetri untuk seluruh node lalu keluar (cocok untuk automated test/cron):
```bash
node emulator.js --once
# atau
npm run once
```

### 3. Mode Uji Peringatan Bahaya (`--spike`)
Memaksa Node 1 mengirimkan konsentrasi CH4 kritis di atas 5.000 ppm (memicu status **BAHAYA**, audio buzzer, dan notifikasi darurat):
```bash
node emulator.js --spike
# atau
npm run spike
```

### 4. Kustomisasi Parameter
- `--interval <detik>` : Mengatur jeda pengiriman (contoh: `--interval 2`)
- `--url <api_url>`     : Mengatur URL tujuan API (default: `http://localhost:5000`)
