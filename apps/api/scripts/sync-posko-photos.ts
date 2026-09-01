/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Script Sinkronisasi Foto Posko KKN dari tabel `fasilitas` ke tabel `posko_kkn`.
 */

import { prisma } from "../src/lib/prisma.js";
import { poskoKknService } from "../src/services/poskoKknService.js";

async function main() {
  console.log("=== MEMULAI SINKRONISASI FOTO POSKO KKN ===");
  const count = await poskoKknService.syncPoskoPhotosWithFacilities();
  console.log(`=== SINKRONISASI SELESAI: ${count} Posko berhasil disinkronkan fotonya ===`);

  const allPoskos = await poskoKknService.getAllPosko();
  console.log("\n=== STATUS FOTO SEMUA POSKO KKN ===");
  allPoskos.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.kelompokName}] ${p.nama} -> Foto: ${p.foto || "BELUM ADA FOTO"}`);
  });
}

main()
  .catch((err) => {
    console.error("Gagal sinkronisasi posko photos:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
