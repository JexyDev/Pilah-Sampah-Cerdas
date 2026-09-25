/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Emulator Sensor Gas Metana (CH4) & Telemetri IoT (Agrisense Node)
 * Mengirimkan data telemetri berkala (PPM, Suhu, Kelembaban, Baterai)
 * ke endpoint backend BERSEKA.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Parsing CLI Arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
};
const hasFlag = (flag) => args.includes(flag);

const API_BASE_URL = getArg("--url", process.env.API_URL || "http://localhost:5000");
const INTERVAL_SEC = parseInt(getArg("--interval", "5"), 10);
const FORCE_SPIKE = hasFlag("--spike");
const RUN_ONCE = hasFlag("--once");

// 3 Titik Simulasi Node di Kecamatan Coblong
const DEFAULT_NODES = [
  {
    name: "Sensor Metana TPS Sadang Serang",
    nodeCode: "NODE-COBLONG-01",
    locationName: "TPS Sadang Serang",
    latitude: -6.8845,
    longitude: 107.6251,
    kelurahan: "Sadang Serang",
    rwId: 3,
    apiKey: "key_sim_coblong_01_sadang_serang_99a1",
  },
  {
    name: "Sensor Metana Pasar Dago",
    nodeCode: "NODE-COBLONG-02",
    locationName: "Tempat Sampah Pasar Dago",
    latitude: -6.8789,
    longitude: 107.6158,
    kelurahan: "Dago",
    rwId: 5,
    apiKey: "key_sim_coblong_02_pasar_dago_88b2",
  },
  {
    name: "Sensor Metana TPS Cipaganti",
    nodeCode: "NODE-COBLONG-03",
    locationName: "Bank Sampah Cipaganti RW 02",
    latitude: -6.8912,
    longitude: 107.6085,
    kelurahan: "Cipaganti",
    rwId: 2,
    apiKey: "key_sim_coblong_03_cipaganti_77c3",
  },
];

// ANSI Color Helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

/**
 * Memastikan perangkat simulasi terdaftar di database
 */
async function ensureNodesExist() {
  console.log(`${colors.cyan}[IoT Emulator] Memeriksa registrasi 3 Node Simulasi...${colors.reset}`);
  const nodes = [];

  for (const nodeData of DEFAULT_NODES) {
    let dev = await prisma.ioTDevice.findUnique({
      where: { nodeCode: nodeData.nodeCode },
    });

    if (!dev) {
      console.log(`  -> Mendaftarkan node baru: ${nodeData.nodeCode} (${nodeData.locationName})`);
      dev = await prisma.ioTDevice.create({
        data: {
          name: nodeData.name,
          nodeCode: nodeData.nodeCode,
          locationName: nodeData.locationName,
          latitude: nodeData.latitude,
          longitude: nodeData.longitude,
          status: "ACTIVE",
          apiKey: nodeData.apiKey,
          kelurahan: nodeData.kelurahan,
          rwId: nodeData.rwId,
        },
      });
    }

    nodes.push({
      ...nodeData,
      id: dev.id,
      apiKey: dev.apiKey,
    });
  }

  return nodes;
}

/**
 * Generator nilai telemetri realistis
 */
let cycleCount = 0;
function generateTelemetry(nodeIndex, forceSpike) {
  cycleCount++;

  let ppm = 0;
  // Node 1 (Sadang Serang) sewaktu-waktu mengalami kenaikan jika mode spike aktif atau siklus tertentu
  if (forceSpike && nodeIndex === 0) {
    // Mode Spike: Gas kritis berbahaya (≥ 5.000 ppm)
    ppm = parseFloat((5200 + Math.random() * 1800).toFixed(1));
  } else if (nodeIndex === 1 && cycleCount % 6 === 0) {
    // Mode Waspada (1.000 - 4.999 ppm)
    ppm = parseFloat((1400 + Math.random() * 1200).toFixed(1));
  } else {
    // Mode Normal / Aman (< 1.000 ppm)
    ppm = parseFloat((180 + Math.random() * 550).toFixed(1));
  }

  // Suhu ambient Tempat Sampah (26 - 33 °C)
  const suhu = parseFloat((27.0 + Math.sin(cycleCount / 5) * 3.5 + (Math.random() - 0.5)).toFixed(1));

  // Kelembaban (60 - 82%)
  const kelembaban = parseFloat((68.0 + Math.cos(cycleCount / 5) * 8.0 + (Math.random() - 0.5)).toFixed(1));

  // Baterai (90 - 99%)
  const baterai = parseFloat((98.5 - (cycleCount * 0.05) % 15).toFixed(1));

  return {
    nilaiPpm: ppm,
    suhu,
    kelembaban,
    baterai,
  };
}

/**
 * Mengirim data ke API Ingest
 */
async function sendTelemetry(node, telemetry) {
  const endpoint = `${API_BASE_URL}/api/v1/iot/readings/ingest`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": node.apiKey,
      },
      body: JSON.stringify(telemetry),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(
        `${colors.red}❌ [Gagal Ingest ${node.nodeCode}] HTTP ${response.status}: ${result.message || "Error"}${colors.reset}`
      );
      return;
    }

    const level =
      telemetry.nilaiPpm >= 5000
        ? `${colors.red}${colors.bold}BAHAYA 🚨${colors.reset}`
        : telemetry.nilaiPpm >= 1000
        ? `${colors.yellow}${colors.bold}WASPADA ⚠️${colors.reset}`
        : `${colors.green}AMAN ✔️${colors.reset}`;

    console.log(
      `[${new Date().toLocaleTimeString("id-ID")}] ${colors.cyan}${node.nodeCode}${colors.reset} | ` +
        `CH4: ${colors.bold}${telemetry.nilaiPpm.toLocaleString("id-ID")} ppm${colors.reset} [${level}] | ` +
        `Suhu: ${telemetry.suhu}°C | Lembab: ${telemetry.kelembaban}% | Bat: ${telemetry.baterai}%`
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ [Koneksi Error] Gagal menghubungi ${endpoint}: ${error.message}${colors.reset}`
    );
  }
}

/**
 * Loop Utama Emulator
 */
async function main() {
  console.log(`\n======================================================`);
  console.log(`  🚀 BERSEKA IoT Telemetry Emulator (Agrisense Node)`);
  console.log(`  Target API : ${API_BASE_URL}/api/v1/iot/readings/ingest`);
  console.log(`  Interval   : ${INTERVAL_SEC} detik`);
  console.log(`  Mode Spike : ${FORCE_SPIKE ? "AKTIF (Paksa Status BAHAYA)" : "NORMAL"}`);
  console.log(`======================================================\n`);

  let nodes = [];
  try {
    nodes = await ensureNodesExist();
  } catch (err) {
    console.warn(`[Peringatan] Gagal query Prisma langsung: ${err.message}. Menggunakan default keys.`);
    nodes = DEFAULT_NODES;
  }

  const runCycle = async () => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const telemetry = generateTelemetry(i, FORCE_SPIKE);
      await sendTelemetry(node, telemetry);
    }
  };

  await runCycle();

  if (RUN_ONCE) {
    console.log(`\n${colors.green}✅ Kirim 1 siklus selesai (--once).${colors.reset}`);
    await prisma.$disconnect();
    process.exit(0);
  }

  setInterval(runCycle, INTERVAL_SEC * 1000);
}

main().catch(async (e) => {
  console.error("Fatal Error di Emulator:", e);
  await prisma.$disconnect();
  process.exit(1);
});
