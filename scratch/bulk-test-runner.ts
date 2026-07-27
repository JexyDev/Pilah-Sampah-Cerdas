/**
 * Bulk Test Runner v2 — TrashCare
 * Strategy: bypass HTTP untuk step yang butuh server reload.
 * - Staff & Warga: langsung via Prisma (server belum reload fix)
 * - Setoran, Fasilitas: via HTTP (sudah jalan)
 * - Semua data prefix UJI_
 */

import { PrismaClient, BinStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000/api/v1";

// ============================================================
// Helpers
// ============================================================
async function api(method: string, path: string, body?: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  } catch (e: any) {
    return { status: 0, data: { error: e.message } };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rnd = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(4));
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const LAT_BASE = -6.893;
const LNG_BASE = 107.615;
const CAT_ORGANIC = "e66726bd-c8d5-44e8-872a-6836e6eb7c13";
const CAT_ANORGANIC = "78b69b2d-b8bd-4c87-af31-a2764709a9ea";
const AREA_IDS = Array.from({ length: 50 }, (_, i) => i + 1);
const KEL_DAGO = "88c81c2d-64ec-4f54-a8ce-321b11f91002";
const HASH_PASS = await bcrypt.hash("password123", 10);

// Role IDs dari DB
const ROLES = { SUPER_ADMIN: 1, ADMIN_DLH: 2, CAMAT: 3, LURAH: 4, RW: 5, PETUGAS_RESIDU: 6, WARGA: 7, MAHASISWA_KKN: 8 };

// ============================================================
// Login via HTTP (tetap pakai API karena tidak butuh server fix)
// ============================================================
async function loginViaApi(email: string, password: string): Promise<string | null> {
  const r = await api("POST", "/auth/login", { email, password });
  return r.status === 200 ? r.data.data.accessToken : null;
}

// ============================================================
// STEP 1: Cek & Generate Staff langsung via Prisma
// ============================================================
async function generateStaffViaPrisma(): Promise<Record<string, any[]>> {
  console.log("\n=== STEP 1: Generate Staff via Prisma ===");
  const results: Record<string, any[]> = { camat: [], lurah: [], rw: [], petugas: [], kkn: [] };

  // Cek apakah sudah ada (dari run sebelumnya)
  const existingKkn = await prisma.user.count({ where: { email: { contains: "@uji-trashcare.id" }, role: { name: "MAHASISWA_KKN" } } });
  if (existingKkn >= 20) {
    console.log(`  ✓ KKN sudah ada ${existingKkn} user (skip create)`);
    const kknUsers = await prisma.user.findMany({
      where: { email: { contains: "uji.kkn" } },
      include: { studentProfile: true },
      take: 20,
    });
    results.kkn = kknUsers;
  } else {
    // Camat
    try {
      const u = await prisma.user.create({
        data: {
          name: "UJI_Camat Coblong", email: "uji.camat@uji-trashcare.id",
          password: HASH_PASS, phone: "+62811999002", roleId: ROLES.CAMAT,
        },
      });
      results.camat.push(u); console.log("  ✓ UJI_Camat created");
    } catch { console.log("  ⚠ UJI_Camat sudah ada"); }

    // 3 Lurah
    for (let i = 1; i <= 3; i++) {
      try {
        const u = await prisma.user.create({
          data: {
            name: `UJI_Lurah_00${i}`, email: `uji.lurah.00${i}@uji-trashcare.id`,
            password: HASH_PASS, phone: `+6281199900${i + 2}`, roleId: ROLES.LURAH,
          },
        });
        results.lurah.push(u);
      } catch { }
    }
    console.log(`  ✓ Lurah created: ${results.lurah.length}`);

    // 15 RW
    const rwAreaMap = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 2, 7, 12, 17, 22];
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(3, "0");
      try {
        const u = await prisma.user.create({
          data: {
            name: `UJI_RW_${num}`, email: `uji.rw.${num}@uji-trashcare.id`,
            password: HASH_PASS, phone: `+6281199903${num}`,
            roleId: ROLES.RW, rtRwId: rwAreaMap[i - 1],
          },
        });
        results.rw.push(u);
      } catch { }
    }
    console.log(`  ✓ RW created: ${results.rw.length}`);

    // 15 Petugas
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(3, "0");
      try {
        const u = await prisma.user.create({
          data: {
            name: `UJI_Petugas_${num}`, email: `uji.petugas.${num}@uji-trashcare.id`,
            password: HASH_PASS, phone: `+6281199904${num}`, roleId: ROLES.PETUGAS_RESIDU,
          },
        });
        await prisma.petugasResidu.create({
          data: { userId: u.id, nama: u.name, noWa: u.phone!, assignedZone: `RW ${String(i).padStart(2,"0")}`, whitelistStatus: "APPROVED" },
        });
        results.petugas.push(u);
      } catch { }
    }
    console.log(`  ✓ Petugas created: ${results.petugas.length}`);

    // 20 KKN (10 aktif, 10 expired)
    const now = new Date();
    const past30 = new Date(now.getTime() - 30 * 86400000);
    const future30 = new Date(now.getTime() + 30 * 86400000);
    const past7 = new Date(now.getTime() - 7 * 86400000);

    for (let i = 1; i <= 20; i++) {
      const num = String(i).padStart(3, "0");
      const expired = i > 10;
      try {
        const u = await prisma.user.create({
          data: {
            name: `UJI_KKN_${num}${expired ? "_EXPIRED" : ""}`,
            email: `uji.kkn.${num}@uji-trashcare.id`,
            password: HASH_PASS, phone: `+6281199905${num}`,
            roleId: ROLES.MAHASISWA_KKN,
          },
        });
        await prisma.studentKkn.create({
          data: {
            userId: u.id, nim: `UJI2024${num}`, jurusan: "Teknik Lingkungan",
            fakultas: "Teknik", noWa: u.phone!,
            startDate: past30, endDate: expired ? past7 : future30,
            assignedPolygonId: AREA_IDS[i - 1], whitelistStatus: "APPROVED",
          },
        });
        results.kkn.push(u);
      } catch { }
    }
    console.log(`  ✓ KKN created: ${results.kkn.length}`);
  }

  return results;
}

// ============================================================
// STEP 2: Generate QR Batch via HTTP
// ============================================================
async function generateQrBatch(saToken: string): Promise<{ orgBins: any[]; anoBins: any[] }> {
  console.log("\n=== STEP 2: Generate QR Batch ===");

  await api("POST", "/super-admin/bins/generate-qr", {
    batchCode: "UJI-BATCH-ORG-2026", totalQr: 100, categoryId: CAT_ORGANIC, rtRwId: 1,
  }, saToken);

  await api("POST", "/super-admin/bins/generate-qr", {
    batchCode: "UJI-BATCH-ANO-2026", totalQr: 100, categoryId: CAT_ANORGANIC, rtRwId: 1,
  }, saToken);

  // Ambil dari Prisma langsung
  const orgBins = await prisma.bin.findMany({
    where: { qrBatch: { batchCode: "UJI-BATCH-ORG-2026" }, status: "PRINTED" },
    select: { id: true, qrCode: true },
  });
  const anoBins = await prisma.bin.findMany({
    where: { qrBatch: { batchCode: "UJI-BATCH-ANO-2026" }, status: "PRINTED" },
    select: { id: true, qrCode: true },
  });

  console.log(`  ✓ QR tersedia: ${orgBins.length} organic, ${anoBins.length} anorganic`);
  return { orgBins, anoBins };
}

// ============================================================
// STEP 3: Generate 100 Warga + Household + BinOwnership via Prisma
// ============================================================
async function generateWargaViaPrisma(orgBins: any[], anoBins: any[]): Promise<any[]> {
  console.log("\n=== STEP 3: Generate 100 Warga + Household + Bins via Prisma ===");

  // Cek existing
  const existingWarga = await prisma.user.findMany({
    where: { email: { contains: "uji.warga." } },
    include: { households: true },
  });
  if (existingWarga.length >= 100) {
    console.log(`  ✓ ${existingWarga.length} warga sudah ada (skip create)`);
    // Ambil bin yang dimiliki tiap warga
    const wargaIds = existingWarga.map((w) => w.id);
    const ownerships = await prisma.binOwnership.findMany({
      where: { userId: { in: wargaIds } },
      include: { bin: { select: { id: true, qrCode: true, latitude: true, longitude: true } } },
    });
    const ownershipMap = new Map<string, typeof ownerships[0]>();
    for (const o of ownerships) ownershipMap.set(o.userId, o);

    return existingWarga.map((w) => {
      const ownership = ownershipMap.get(w.id);
      return {
        id: w.id, email: w.email || "", password: "password123",
        lat: Number(w.households[0]?.latitude) || LAT_BASE,
        lng: Number(w.households[0]?.longitude) || LNG_BASE,
        householdId: w.households[0]?.id,
        index: parseInt((w.email || "").match(/uji\.warga\.(\d+)/)?.[1] || "1"),
        orgBinId: ownership?.binId,
        orgQr: ownership?.bin?.qrCode,
      };
    });
  }

  const wargaList: any[] = [];
  let orgIdx = 0;

  for (let i = 1; i <= 100; i++) {
    const num = String(i).padStart(3, "0");
    const areaId = AREA_IDS[(i - 1) % 50];
    const lat = LAT_BASE + rnd(-0.012, 0.012);
    const lng = LNG_BASE + rnd(-0.012, 0.012);
    const phone = `+62812${String(1000000 + i).slice(1)}`;
    const email = `uji.warga.${num}@uji-trashcare.id`;

    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          name: `UJI_Warga_${num}`, email, password: HASH_PASS,
          phone, roleId: ROLES.WARGA, wargaSubtype: "UTAMA", rtRwId: areaId,
        },
      });

      // Create household
      const household = await prisma.household.create({
        data: {
          userId: user.id, address: `Jl. UJI No. ${i}`,
          rtRwId: areaId, latitude: lat, longitude: lng,
        },
      });

      // Assign organic bin (if available)
      const orgBin = orgBins[orgIdx];
      if (orgBin) {
        await prisma.binOwnership.create({
          data: { binId: orgBin.id, userId: user.id, type: "UTAMA" },
        });

        // Update bin status based on distribution:
        // 70%: ACTIVE_BOUND, 20%: juga ACTIVE_BOUND (setelah reject-approve), 10%: PENDING_APPROVAL
        const newStatus: BinStatus = i <= 90 ? BinStatus.ACTIVE_BOUND : BinStatus.PENDING_APPROVAL;
        await prisma.bin.update({
          where: { id: orgBin.id },
          data: { status: newStatus, userId: user.id, rtRwId: areaId, latitude: lat, longitude: lng, kelurahanId: KEL_DAGO },
        });
        orgIdx++;
      }

      wargaList.push({ id: user.id, email, password: "password123", lat, lng, householdId: household.id, index: i, orgBinId: orgBin?.id, orgQr: orgBin?.qrCode });
      if (i % 20 === 0) console.log(`  ✓ ${i}/100 warga created`);
    } catch (e: any) {
      const msg = e.message?.includes("Unique") ? "EMAIL_ALREADY_IN_USE" : e.message?.slice(0, 60);
      if (i <= 5) console.log(`  ✗ Warga_${num}: ${msg}`);
      // Try to find existing
      const existing = await prisma.user.findUnique({ where: { email }, include: { households: true } });
      if (existing) {
        wargaList.push({
          id: existing.id, email, password: "password123",
          lat: Number(existing.households[0]?.latitude) || lat,
          lng: Number(existing.households[0]?.longitude) || lng,
          householdId: existing.households[0]?.id,
          index: i,
        });
        if (orgBins[orgIdx] && !existing.households[0]) orgIdx++;
      }
    }
  }

  const sukses = wargaList.filter((w) => w.householdId).length;
  console.log(`\n  Total warga: ${wargaList.length}, dengan household: ${sukses}`);
  return wargaList;
}

// ============================================================
// STEP 4: Login warga via HTTP, generate setoran
// ============================================================
async function generateSetoran(wargaList: any[]): Promise<{ total: number; errors: number; sampleErrors: string[] }> {
  console.log("\n=== STEP 4: Generate Setoran Sampah (30 hari) ===");

  const validWarga = wargaList.filter((w) => w.householdId && w.orgQr);
  console.log(`  Warga dengan QR: ${validWarga.length}`);

  // Ambil koordinat bin yang akurat dari DB (geofencing 10m strict)
  const binCoords: Map<string, { lat: number; lng: number }> = new Map();
  const binIds = validWarga.map((w) => w.orgBinId).filter(Boolean);
  if (binIds.length > 0) {
    const bins = await prisma.bin.findMany({
      where: { id: { in: binIds } },
      select: { id: true, latitude: true, longitude: true },
    });
    for (const b of bins) {
      if (b.latitude && b.longitude) {
        binCoords.set(b.id, { lat: Number(b.latitude), lng: Number(b.longitude) });
      }
    }
  }
  console.log(`  Koordinat bin tersedia: ${binCoords.size}`);

  let totalSetoran = 0, totalError = 0;
  const sampleErrors: string[] = [];
  const confOptions = [0.52, 0.65, 0.75, 0.82, 0.91, 0.95, 0.99];
  const cats = ["ORGANIC", "NON_ORGANIC"];

  // Login semua warga dulu (batch)
  const wargaTokens: Map<string, string> = new Map();
  for (let i = 0; i < Math.min(validWarga.length, 80); i++) {
    const w = validWarga[i];
    const token = await loginViaApi(w.email, w.password);
    if (token) wargaTokens.set(w.id, token);
    await sleep(30);
  }
  console.log(`  Berhasil login: ${wargaTokens.size}/80 warga`);

  for (let wi = 0; wi < Math.min(validWarga.length, 80); wi++) {
    const w = validWarga[wi];
    const wToken = wargaTokens.get(w.id);
    if (!wToken || !w.householdId || !w.orgQr) continue;

    // Gunakan koordinat bin yang exact (dalam radius 10m = ±0.00004°)
    const binPos = binCoords.get(w.orgBinId) || { lat: w.lat, lng: w.lng };

    const isRutin = wi < 40;
    const allDays = Array.from({ length: 30 }, (_, d) => d);
    const activeDays = isRutin ? allDays : allDays.sort(() => Math.random() - 0.5).slice(0, rndInt(8, 22));

    for (const daysAgo of activeDays) {
      // Drift max ±0.00004° ≈ 4.4m (dalam radius 10m)
      const microDrift = 0.00004;
      // Selalu kirim ORGANIC (semua bin uji dari batch ORGANIC)
      const r = await api("POST", "/bins/scan", {
        qrCode: w.orgQr,
        detectedType: "ORGANIC",
        estimatedVolume: rnd(0.3, 1.5), // Volume kecil agar tidak overflow cepat
        householdId: w.householdId,
        userLat: binPos.lat + rnd(-microDrift, microDrift),
        userLng: binPos.lng + rnd(-microDrift, microDrift),
        aiConfidence: confOptions[rndInt(0, confOptions.length - 1)],
        evidencePhotoUrl: `https://storage.uji.id/dummy/${w.index}_${daysAgo}.jpg`,
      }, wToken);

      if (r.status === 200 || r.status === 201) {
        totalSetoran++;
      } else {
        totalError++;
        const errMsg = `[W${wi + 1}] ${r.status}: ${JSON.stringify(r.data?.error || r.data?.code || r.data).slice(0, 60)}`;
        if (sampleErrors.length < 10) sampleErrors.push(errMsg);
      }
      await sleep(15);
    }

    if ((wi + 1) % 10 === 0) {
      console.log(`  ✓ ${wi + 1}/80 warga selesai. Setoran: ${totalSetoran}, Error: ${totalError}`);
    }
  }

  console.log(`\n  ✓ Total setoran: ${totalSetoran}, Error: ${totalError}`);
  if (sampleErrors.length > 0) {
    console.log("  Sample error setoran:");
    sampleErrors.forEach((e) => console.log("    -", e));
  }
  return { total: totalSetoran, errors: totalError, sampleErrors };
}

// ============================================================
// STEP 5: Fasilitas GIS via HTTP
// ============================================================
async function generateFasilitas(saToken: string): Promise<void> {
  console.log("\n=== STEP 5: Generate Fasilitas GIS ===");

  // Cek existing
  const existing = await prisma.facility.count({ where: { nama: { startsWith: "UJI_Fasilitas_" } } });
  if (existing >= 10) {
    console.log(`  ✓ ${existing} fasilitas sudah ada (skip)`);
    return;
  }

  const facilityTypes = ["loseda", "bata_terawang", "rumah_maggot", "bank_sampah", "loseda",
    "bata_terawang", "rumah_maggot", "bank_sampah", "loseda", "rumah_maggot"] as any[];
  let created = 0;

  for (let i = 0; i < 10; i++) {
    const r = await api("POST", "/facilities", {
      jenis: facilityTypes[i],
      nama: `UJI_Fasilitas_${String(i + 1).padStart(2, "0")}_${facilityTypes[i]}`,
      pic: `UJI_PIC_${i + 1}`,
      kontak: `+6281199980${String(i + 1).padStart(2, "0")}`,
      kapasitas: rnd(50, 500),
      latitude: LAT_BASE + rnd(-0.015, 0.015),
      longitude: LNG_BASE + rnd(-0.015, 0.015),
      rtRwId: AREA_IDS[i * 5],
    }, saToken);

    if (r.status === 201) {
      created++;
      const facilId = r.data.data?.id;
      if (facilId) {
        for (let w = 1; w <= 4; w++) {
          await api("POST", `/facilities/${facilId}/production`, {
            materialMasukKg: rnd(10, 100), outputKg: rnd(5, 50),
            jenisOutput: w % 2 === 0 ? "Pre-Pupa" : "Maggot Kering",
            periode: `2026-W${String(28 + w).padStart(2, "0")}`,
          }, saToken);
          await sleep(50);
        }
      }
    } else {
      console.log(`  ✗ Fasilitas ${i + 1}: ${r.status} ${JSON.stringify(r.data).slice(0, 80)}`);
    }
    await sleep(100);
  }
  console.log(`  ✓ Fasilitas created: ${created}/10`);
}

// ============================================================
// STEP 6: Ide Daur Ulang via Prisma
// ============================================================
async function generateIdeDaurUlang(wargaList: any[]): Promise<void> {
  console.log("\n=== STEP 6: Generate Ide Daur Ulang ===");

  const existing = await prisma.ideDaurUlang.count({ where: { judul: { startsWith: "UJI_Ide_" } } });
  if (existing >= 20) {
    console.log(`  ✓ ${existing} ide sudah ada (skip)`);
    return;
  }

  const validWarga = wargaList.filter((w) => w.id).slice(0, 20);
  let created = 0;
  const ideIds: string[] = [];

  for (let i = 0; i < validWarga.length; i++) {
    try {
      const ide = await prisma.ideDaurUlang.create({
        data: {
          userId: validWarga[i].id,
          judul: `UJI_Ide_${String(i + 1).padStart(2, "0")}: Daur Ulang ${i % 2 === 0 ? "Plastik" : "Kertas"}`,
          material: i % 2 === 0 ? "Botol Plastik PET" : "Koran Bekas",
          foto: `https://storage.uji.id/ide/dummy_${i + 1}.jpg`,
          statusApproval: "PENDING",
        },
      });
      ideIds.push(ide.id);
      created++;
    } catch { }
  }

  // Approve 8, reject 7, 5 pending
  let approved = 0, rejected = 0;
  for (let i = 0; i < ideIds.length; i++) {
    const status = i < 8 ? "APPROVED" : i < 15 ? "REJECTED" : "PENDING";
    if (status !== "PENDING") {
      await prisma.ideDaurUlang.update({ where: { id: ideIds[i] }, data: { statusApproval: status } });
      if (status === "APPROVED") approved++; else rejected++;
    }
  }
  console.log(`  ✓ Ide created: ${created}, Approved: ${approved}, Rejected: ${rejected}, Pending: ${created - approved - rejected}`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  TrashCare Bulk Test Runner v2 — MULAI          ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Waktu: ${new Date().toISOString()}\n`);
  console.log("Strategy: Prisma langsung untuk data, HTTP untuk endpoint bisnis");

  const report: Record<string, any> = {};

  try {
    const saToken = await loginViaApi("superadmin@psc.id", "password123");
    if (!saToken) throw new Error("Superadmin login gagal!");
    console.log("✓ Superadmin token OK");

    await generateStaffViaPrisma();

    const { orgBins, anoBins } = await generateQrBatch(saToken);
    report.qr = { organic: orgBins.length, anorganic: anoBins.length };

    const wargaList = await generateWargaViaPrisma(orgBins, anoBins);
    report.warga = { total: wargaList.length, withHousehold: wargaList.filter((w) => w.householdId).length };

    const setoranResult = await generateSetoran(wargaList);
    report.setoran = setoranResult;

    await generateFasilitas(saToken);
    await generateIdeDaurUlang(wargaList);

    // Final DB counts
    const [wargaCount, setoranCount, facilCount, ideCount] = await Promise.all([
      prisma.user.count({ where: { role: { name: "WARGA" }, email: { contains: "uji" } } }),
      prisma.wasteLog.count(),
      prisma.facility.count({ where: { nama: { startsWith: "UJI_" } } }),
      prisma.ideDaurUlang.count({ where: { judul: { startsWith: "UJI_" } } }),
    ]);

    report.dbCounts = { wargaUji: wargaCount, totalWasteLog: setoranCount, fasilitasUji: facilCount, ideUji: ideCount };

  } catch (err: any) {
    console.error("\n[FATAL]:", err.message || err);
    report.fatalError = err.message;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  RINGKASAN AKHIR                                 ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nSelesai: ${new Date().toISOString()}`);
}

main().catch((e) => { console.error(e); prisma.$disconnect(); });
