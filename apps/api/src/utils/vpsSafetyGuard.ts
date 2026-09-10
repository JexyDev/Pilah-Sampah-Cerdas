/**
 * Project: BERSEKA
 * VPS Safety Guard & Data Governance Module
 * 
 * Mencegah eksekusi skrip seeder, bulk insert, atau manipulasi data dummy 
 * secara tidak sengaja ke database VPS / Production (157.10.252.252).
 */

const VPS_HOST_IDENTIFIERS = [
  "157.10.252.252",
  "psc.makerindo.com",
  "berseka.id",
  "makerindo",
];

export function isTargetingVpsOrProduction(): { isVps: boolean; reason: string } {
  const dbUrl = process.env.DATABASE_URL || "";
  const nodeEnv = process.env.NODE_ENV || "development";

  // 1. Cek DATABASE_URL terhadap host / IP VPS
  for (const identifier of VPS_HOST_IDENTIFIERS) {
    if (dbUrl.includes(identifier)) {
      return {
        isVps: true,
        reason: `DATABASE_URL mengandung host/IP produksi VPS: "${identifier}"`,
      };
    }
  }

  // 2. Cek apakah berjalan di lingkungan produksi (VPS backend)
  if (nodeEnv.toLowerCase() === "production") {
    // Jika di production tapi bukan localhost, pasti VPS
    if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
      return {
        isVps: true,
        reason: `NODE_ENV adalah "production" dan DATABASE_URL tidak mengarah ke localhost`,
      };
    }
  }

  return { isVps: false, reason: "" };
}

/**
 * Memastikan skrip TIDAK berjalan pada database VPS / Production.
 * Jika terdeteksi mengarah ke VPS, proses akan langsung di-abort dengan exit code 1.
 */
export function assertNotProduction(scriptName: string = "Seeder/Script"): void {
  const check = isTargetingVpsOrProduction();

  if (check.isVps) {
    console.error(`\n================================================================================`);
    console.error(`⛔ [VPS SAFETY GUARD] EKSEKUSI DIBLOKIR UNTUK KEAMANAN DATA OPERASIONAL!`);
    console.error(`================================================================================`);
    console.error(`Skrip        : ${scriptName}`);
    console.error(`Alasan Blokir : ${check.reason}`);
    console.error(`Pesan         : Database VPS memiliki data riil (khususnya Mahasiswa KKN, Presensi,`);
    console.error(`                Posko, dan Akun) yang telah diubah secara manual.`);
    console.error(`                Menjalankan seeder atau bulk-insert dummy ke VPS DILARANG KERAS!`);
    console.error(`================================================================================\n`);

    if (process.env.FORCE_ALLOW_VPS_MUTATION !== "I_UNDERSTAND_THE_RISKS_OVERWRITE_VPS") {
      process.exit(1);
    } else {
      console.warn(`⚠️ PERINGATAN KERAS: FORCE_ALLOW_VPS_MUTATION aktif. Melanjutkan atas risiko pengguna...`);
    }
  }
}
