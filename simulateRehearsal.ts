import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000/api/v1";

async function runRehearsal() {
  console.log("==================================================");
  console.log("STARTING COMPREHENSIVE MULTI-ROLE E2E SIMULATION");
  console.log("==================================================");

  const passwordHash = await bcrypt.hash("password123", 10);

  // ==========================================================
  // STEP 0 — RESET DATABASE & SEED BASELINE DATA
  // ==========================================================
  console.log("\n[Step 0] Resetting database and seeding baseline...");
  
  await prisma.refreshToken.deleteMany({});
  await prisma.pointHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.aiRequestLog.deleteMany({});
  await prisma.binResetRequest.deleteMany({});
  await prisma.dispatchTask.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.kknHandoverHistory.deleteMany({});
  await prisma.residuLog.deleteMany({});
  await prisma.auditTrail.deleteMany({});
  await prisma.socialFeed.deleteMany({});
  await prisma.binOwnership.deleteMany({});
  await prisma.wasteLog.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.household.deleteMany({});
  await prisma.studentKkn.deleteMany({});
  await prisma.petugasResidu.deleteMany({});
  await prisma.qrBatch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.peternakan.deleteMany({});
  await prisma.rtRwArea.deleteMany({});
  await prisma.kelurahan.deleteMany({});

  // Seed Wilayah
  const dago = await prisma.kelurahan.create({ data: { name: "Dago" } });
  const sadangserang = await prisma.kelurahan.create({ data: { name: "Sadang Serang" } });

  const rw06Dago = await prisma.rtRwArea.create({ data: { kelurahanId: dago.id, name: "RW 06" } });
  const rt01Rw06Dago = await prisma.rtRwArea.create({ data: { kelurahanId: dago.id, name: "RT 01 / RW 06" } });
  const rt02Rw06Dago = await prisma.rtRwArea.create({ data: { kelurahanId: dago.id, name: "RT 02 / RW 06" } });
  const rw07Sadang = await prisma.rtRwArea.create({ data: { kelurahanId: sadangserang.id, name: "RW 07" } });

  // Seed Roles
  const roles = ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PETUGAS_RESIDU", "WARGA", "MAHASISWA_KKN"];
  const roleMap: Record<string, any> = {};
  for (const r of roles) {
    roleMap[r] = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r }
    });
  }

  // Seed Categories
  const catO = await prisma.wasteCategory.upsert({
    where: { name: "Organik" },
    update: {},
    create: { name: "Organik", description: "Sisa makanan", pointsPerKg: 10 }
  });
  const catA = await prisma.wasteCategory.upsert({
    where: { name: "Anorganik" },
    update: {},
    create: { name: "Anorganik", description: "Plastik & Kertas", pointsPerKg: 15 }
  });

  // Seed Management & Staff Users
  const userSeeds = [
    { phone: "+628111111111", email: "superadmin@psc.id", name: "Super Admin TrashCare", roleId: roleMap["SUPER_ADMIN"].id, nik: "3273010000000001", rtRwId: null },
    { phone: "+628111111112", email: "admin@psc.id", name: "Admin DLH Bandung", roleId: roleMap["ADMIN_DLH"].id, nik: "3273010000000002", rtRwId: null },
    { phone: "+628111111113", email: "camat@psc.id", name: "Camat Coblong", roleId: roleMap["CAMAT"].id, nik: "3273010000000003", rtRwId: null },
    { phone: "+628111111114", email: "lurah@psc.id", name: "Lurah Dago", roleId: roleMap["LURAH"].id, nik: "3273010000000004", rtRwId: null },
    { phone: "+628111111115", email: "rw@psc.id", name: "Asep RW 06", roleId: roleMap["RW"].id, nik: "3273010000000005", rtRwId: rw06Dago.id },
    { phone: "+628111111116", email: "rt@psc.id", name: "Bambang RT 01", roleId: roleMap["RT"].id, nik: "3273010000000006", rtRwId: rt01Rw06Dago.id },
  ];

  const coreUsers: Record<string, any> = {};
  for (const u of userSeeds) {
    coreUsers[u.phone] = await prisma.user.create({
      data: { ...u, password: passwordHash, status: "Aktif" },
    });
  }

  // Seed 2 KKN Students
  const students = [
    { phone: "+628111111118", email: "andi.kkn@psc.id", name: "Andi Saputra", nim: "12345678" },
    { phone: "+628111111119", email: "dewi.kkn@psc.id", name: "Dewi Lestari", nim: "12345679" }
  ];
  for (const s of students) {
    const u = await prisma.user.create({
      data: { phone: s.phone, email: s.email, name: s.name, password: passwordHash, status: "Aktif", roleId: roleMap["MAHASISWA_KKN"].id, rtRwId: rw06Dago.id }
    });
    await prisma.studentKkn.create({
      data: { userId: u.id, nim: s.nim, jurusan: "Informatika", fakultas: "Fastek", noWa: s.phone, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), whitelistStatus: "APPROVED", assignedPolygonId: rw06Dago.id }
    });
    coreUsers[s.phone] = u;
  }

  // Seed 2 Residu Officers
  const officers = [
    { phone: "+628111111117", email: "budi.petugas@psc.id", name: "Budi Petugas" },
    { phone: "+628111111120", email: "soni.petugas@psc.id", name: "Soni Petugas" }
  ];
  for (const o of officers) {
    const u = await prisma.user.create({
      data: { phone: o.phone, email: o.email, name: o.name, password: passwordHash, status: "Aktif", roleId: roleMap["PETUGAS_RESIDU"].id, rtRwId: rw06Dago.id }
    });
    await prisma.petugasResidu.create({
      data: { userId: u.id, nama: o.name, noWa: o.phone, kpiScore: 100.0, assignedZone: "RW 06 Dago", whitelistStatus: "APPROVED" }
    });
    coreUsers[o.phone] = u;
  }

  // Seed 3 baseline citizens
  const baselineWargas = [
    { phone: "+6282100000001", email: "siti@psc.id", name: "Siti Aminah", address: "Jl. Dago No. 1", rtRwId: rt01Rw06Dago.id },
    { phone: "+6282100000002", email: "agus@psc.id", name: "Agus Setiawan", address: "Jl. Dago No. 2", rtRwId: rt01Rw06Dago.id },
    { phone: "+6282100000003", email: "sri@psc.id", name: "Sri Wahyuni", address: "Jl. Dago No. 3", rtRwId: rt02Rw06Dago.id },
  ];
  for (const w of baselineWargas) {
    const u = await prisma.user.create({
      data: { phone: w.phone, email: w.email, name: w.name, password: passwordHash, status: "Aktif", roleId: roleMap["WARGA"].id, rtRwId: w.rtRwId, address: w.address, wargaSubtype: "UTAMA" }
    });
    await prisma.household.create({
      data: { userId: u.id, rtRwId: w.rtRwId, address: w.address, latitude: -6.8901, longitude: 107.6101 }
    });
  }

  // Seed standard configs
  await prisma.systemConfig.upsert({
    where: { key: "DEFAULT_BIN_CAPACITY" }, update: {}, create: { key: "DEFAULT_BIN_CAPACITY", value: "25.0", tipe: "number" }
  });
  await prisma.systemConfig.upsert({
    where: { key: "ai_confidence_threshold" }, update: {}, create: { key: "ai_confidence_threshold", value: "90", tipe: "number" }
  });

  console.log("Database reset and seeded.");

  // ==========================================================
  // ROLE 1 — SUPER ADMIN: LOGIN & GENERATE BATCH QR
  // ==========================================================
  console.log("\n[Role 1 - Super Admin] Logging in...");
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111111", password: "password123" }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.data.accessToken;

  console.log("[Role 1 - Super Admin] Generating master QR batch...");
  const genQrRes = await fetch(`${BASE_URL}/super-admin/bins/generate-qr`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
    body: JSON.stringify({ batchCode: "BATCH-DEMO-2026", totalQr: 10, categoryId: catO.id, rtRwId: rw06Dago.id })
  });
  const batchData = await genQrRes.json();
  const batchId = batchData.data.id;

  // Manually generate a few printed bins in that batch
  const orgQrCodes = ["QR-ORG-101", "QR-ORG-102", "QR-ORG-103", "QR-ORG-104"];
  const anoQrCodes = ["QR-ANO-101", "QR-ANO-102", "QR-ANO-103", "QR-ANO-104"];
  for (const code of orgQrCodes) {
    await prisma.bin.create({ data: { qrCode: code, categoryId: catO.id, qrBatchId: batchId, status: "PRINTED", rtRwId: rt01Rw06Dago.id, kelurahanId: dago.id } });
  }
  for (const code of anoQrCodes) {
    await prisma.bin.create({ data: { qrCode: code, categoryId: catA.id, qrBatchId: batchId, status: "PRINTED", rtRwId: rt01Rw06Dago.id, kelurahanId: dago.id } });
  }

  // Assign the batch to Mahasiswa 1 (Andi)
  await prisma.qrBatch.update({
    where: { id: batchId }, data: { assignedPicUserId: coreUsers["+628111111118"].id, status: "ASSIGNED_TO_PIC" }
  });
  await prisma.bin.updateMany({
    where: { qrBatchId: batchId }, data: { status: "ASSIGNED_TO_PIC" }
  });
  console.log("[Role 1 - Super Admin] Batch assigned to Andi KKN.");

  // ==========================================================
  // ROLE 2 — MAHASISWA KKN: REGISTER NEW WARGA & INPUT FACILITY
  // ==========================================================
  console.log("\n[Role 2 - Mahasiswa KKN] Logging in...");
  const kknLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111118", password: "password123" }),
  });
  const kknLogin = await kknLoginRes.json();
  const kknToken = kknLogin.data.accessToken;

  // Register 3 new citizens using our generated QRs
  const wargasToReg = [
    { name: "Agus Santoso", email: "agus.s@psc.id", phone: "+6281299999901", nik: "3273010101010001", qrO: "QR-ORG-101", qrA: "QR-ANO-101", lat: -6.8892, lng: 107.6105 },
    { name: "Siti Fatimah", email: "siti.f@psc.id", phone: "+6281299999902", nik: "3273010101010002", qrO: "QR-ORG-102", qrA: "QR-ANO-102", lat: -6.8894, lng: 107.6107 },
    { name: "Joko Widodo", email: "joko.w@psc.id", phone: "+6281299999903", nik: "3273010101010003", qrO: "QR-ORG-103", qrA: "QR-ANO-103", lat: -6.8896, lng: 107.6109 },
  ];

  const registeredWargaIds: string[] = [];
  for (const w of wargasToReg) {
    console.log(`[Role 2 - Mahasiswa KKN] Registering citizen: ${w.name}...`);
    const regRes = await fetch(`${BASE_URL}/kkn/register-warga`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${kknToken}` },
      body: JSON.stringify({
        name: w.name, email: w.email, phone: w.phone, nik: w.nik, address: "Jl. Coblong Raya No. 10",
        rtRwId: rw06Dago.id, qrCodeOrganic: w.qrO, qrCodeInorganic: w.qrA, latitude: w.lat, longitude: w.lng
      })
    });
    const regResult = await regRes.json();
    if (!regResult.success) throw new Error("Warga registration failed: " + JSON.stringify(regResult));
    registeredWargaIds.push(regResult.data.newWarga.id);
  }

  // Mahasiswa helps input a GIS facility (Bata Terawang)
  console.log("[Role 2 - Mahasiswa KKN] Helping input a new GIS facility...");
  const facInputRes = await fetch(`${BASE_URL}/kkn/fasilitas/bantu-input`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${kknToken}` },
    body: JSON.stringify({
      userId: coreUsers["+628111111118"].id, rtRwId: rw06Dago.id, nama: "Bata Terawang Dago 06", jenis: "bata_terawang", latitude: -6.8898, longitude: 107.6112
    })
  });
  const facInput = await facInputRes.json();
  const facId = facInput.data.id;

  // Mahasiswa Handover to Mahasiswa 2 (Dewi)
  console.log("[Role 2 - Mahasiswa KKN] Performing KKN Handover...");
  await fetch(`${BASE_URL}/kkn/handover`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${kknToken}` },
    body: JSON.stringify({ toKknUserId: coreUsers["+628111111119"].id, rtRwId: rw06Dago.id, notes: "Serah terima tugas wilayah dampingan RW 06 Dago." })
  });

  // ==========================================================
  // ROLE 3 — RW: APPROVE BINS & GIS FACILITIES
  // ==========================================================
  console.log("\n[Role 3 - RW] Logging in...");
  const rwLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111115", password: "password123" }),
  });
  const rwLogin = await rwLoginRes.json();
  const rwToken = rwLogin.data.accessToken;

  // Approve pending bins
  const pendingBinsRes = await fetch(`${BASE_URL}/rw/bins/pending`, {
    method: "GET", headers: { "Authorization": `Bearer ${rwToken}` }
  });
  const pendingBins = await pendingBinsRes.json();
  console.log(`[Role 3 - RW] Found ${pendingBins.length} pending bins to approve.`);
  for (const b of pendingBins) {
    await fetch(`${BASE_URL}/rw/bins/${b.id}/approve`, {
      method: "PUT", headers: { "Authorization": `Bearer ${rwToken}` }
    });
  }
  console.log("[Role 3 - RW] Approved all pending bins.");

  // Approve GIS facility
  console.log("[Role 3 - RW] Approving GIS facility...");
  await prisma.facility.update({
    where: { id: facId }, data: { statusApproval: "APPROVED" }
  });

  // ==========================================================
  // ROLE 4 — WARGA: SETOR SAMPAH (AI DETECT) & ALARM PENUH
  // ==========================================================
  console.log("\n[Role 4 - Warga 1 (Agus)] Logging in...");
  const w1LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+6281299999901", password: "password123" }),
  });
  const w1Login = await w1LoginRes.json();
  const w1Token = w1Login.data.accessToken;
  const w1Household = await prisma.household.findFirst({ where: { userId: w1Login.data.user.id } });

  // Agus deposits Organic waste (will trigger discrepancy later)
  console.log("[Role 4 - Warga 1 (Agus)] Depositing organic waste (Scan)...");
  const scanRes1 = await fetch(`${BASE_URL}/bins/scan`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${w1Token}` },
    body: JSON.stringify({
      qrCode: "QR-ORG-101", detectedType: "Organik", estimatedVolume: 5.0, householdId: w1Household!.id,
      userLat: -6.8892, userLng: 107.6105, aiConfidence: 95.0
    })
  });
  const scan1 = await scanRes1.json();
  if (!scan1.success) throw new Error("Warga 1 deposit failed: " + JSON.stringify(scan1));
  const w1LogId = scan1.data.wasteLogId;

  // Warga 2 (Siti) deposits Inorganic waste & submits idea
  console.log("\n[Role 4 - Warga 2 (Siti)] Logging in...");
  const w2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+6281299999902", password: "password123" }),
  });
  const w2Login = await w2LoginRes.json();
  const w2Token = w2Login.data.accessToken;
  const w2Household = await prisma.household.findFirst({ where: { userId: w2Login.data.user.id } });

  console.log("[Role 4 - Warga 2 (Siti)] Depositing inorganic waste...");
  await fetch(`${BASE_URL}/bins/scan`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${w2Token}` },
    body: JSON.stringify({
      qrCode: "QR-ANO-102", detectedType: "Anorganik", estimatedVolume: 8.0, householdId: w2Household!.id,
      userLat: -6.8894, userLng: 107.6107, aiConfidence: 92.0
    })
  });

  console.log("[Role 4 - Warga 2 (Siti)] Submitting new recycling idea...");
  const ideaRes = await fetch(`${BASE_URL}/ide-daur-ulang`, {
    method: "POST", headers: { "Authorization": `Bearer ${w2Token}` },
    body: (() => {
      const fd = new FormData();
      fd.append("judul", "Kerajinan Tas Belanja Plastik");
      fd.append("material", "Kantong plastik bekas");
      return fd;
    })()
  });
  const idea = await ideaRes.json();
  const ideaId = idea.data.id;

  // Warga 3 (Joko) deposits Organic waste
  console.log("\n[Role 4 - Warga 3 (Joko)] Logging in...");
  const w3LoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+6281299999903", password: "password123" }),
  });
  const w3Login = await w3LoginRes.json();
  const w3Token = w3Login.data.accessToken;
  const w3Household = await prisma.household.findFirst({ where: { userId: w3Login.data.user.id } });

  console.log("[Role 4 - Warga 3 (Joko)] Depositing organic waste...");
  const scanRes3 = await fetch(`${BASE_URL}/bins/scan`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${w3Token}` },
    body: JSON.stringify({
      qrCode: "QR-ORG-103", detectedType: "Organik", estimatedVolume: 4.0, householdId: w3Household!.id,
      userLat: -6.8896, userLng: 107.6109, aiConfidence: 94.0
    })
  });
  const scan3 = await scanRes3.json();
  if (!scan3.success) throw new Error("Warga 3 deposit failed: " + JSON.stringify(scan3));
  const w3LogId = scan3.data.wasteLogId;
  const w3Bin = await prisma.bin.findUnique({ where: { qrCode: "QR-ORG-103" } });

  // Warga 3 reports bin full
  console.log("[Role 4 - Warga 3 (Joko)] Reporting bin full...");
  await fetch(`${BASE_URL}/bins/${w3Bin!.id}/report-issue`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${w3Token}` },
    body: JSON.stringify({ issueType: "EMPTY_REQUEST", notes: "Tong sampah organik sudah penuh." })
  });

  // ==========================================================
  // ROLE 5 — RW: APPROVE RECYCLING IDEAS
  // ==========================================================
  console.log("\n[Role 3 - RW] Approving Siti's recycling idea...");
  await fetch(`${BASE_URL}/ide-daur-ulang/${ideaId}/approve`, {
    method: "PUT", headers: { "Authorization": `Bearer ${rwToken}` }
  });
  console.log("[Role 3 - RW] Idea approved.");

  // ==========================================================
  // ROLE 6 — PETUGAS RESIDU: UPDATE SCALE WEIGHT & REPORT DISCREPANCY & VIOLATION
  // ==========================================================
  console.log("\n[Role 6 - Petugas Residu] Logging in...");
  const petugasLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111117", password: "password123" }),
  });
  const petugasLogin = await petugasLoginRes.json();
  const petugasToken = petugasLogin.data.accessToken;

  // Petugas logs manual physical residu scale weight
  console.log("[Role 6 - Petugas Residu] Logging manual physical residu scale weight (25.5 kg)...");
  const residuFormData = new FormData();
  residuFormData.append("rtRwId", rt01Rw06Dago.id.toString());
  residuFormData.append("beratKg", "25.5");
  await fetch(`${BASE_URL}/transactions/residu`, {
    method: "POST", headers: { "Authorization": `Bearer ${petugasToken}` },
    body: residuFormData
  });

  // Petugas reports a classification discrepancy on Warga 1 (Agus) setoran
  // Agus setoran was Organik (AI 95.0% confident). Petugas overrides it to "Anorganik" -> triggers PENDING_REVIEW
  console.log("[Role 6 - Petugas Residu] Verifying Warga 1 (Agus) deposit and report discrepancy...");
  await fetch(`${BASE_URL}/waste/logs/${w1LogId}/report`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${petugasToken}` },
    body: JSON.stringify({ actualWeight: 5.5, manualClassification: "Anorganik", geolocation: "-6.8892,107.6105" })
  });

  // Petugas reports violation for Warga 3 (Joko)
  console.log("[Role 6 - Petugas Residu] Recording citizen violation on Warga 3 (Joko)...");
  await fetch(`${BASE_URL}/residu/violation`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${petugasToken}` },
    body: JSON.stringify({
      binQrCode: "QR-ORG-103", type: "RESIDU_MIXED_ORGANIC", severity: "HIGH", notes: "Warga mencampur residu pembalut ke organik.",
      evidencePhotoUrl: "http://storage.trashcare.id/v-joko.jpg"
    })
  });

  // ==========================================================
  // ROLE 7 — ADMIN DLH: ACCESS DASHBOARD & RESOLVE DISCREPANCY
  // ==========================================================
  console.log("\n[Role 7 - Admin DLH] Logging in...");
  const dlhLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111112", password: "password123" }),
  });
  const dlhLogin = await dlhLoginRes.json();
  const dlhToken = dlhLogin.data.accessToken;

  // View pending discrepancies
  console.log("[Role 7 - Admin DLH] Fetching pending discrepancies...");
  const discRes = await fetch(`${BASE_URL}/waste/logs/discrepancies`, {
    method: "GET", headers: { "Authorization": `Bearer ${dlhToken}` }
  });
  const discData = await discRes.json();
  console.log(`[Role 7 - Admin DLH] Found ${discData.data.length} pending discrepancies.`);

  // Resolve Agus discrepancy (approve AI classification "Organik")
  console.log("[Role 7 - Admin DLH] Resolving discrepancy for Agus (Approving AI classification: Organik)...");
  await fetch(`${BASE_URL}/waste/logs/${w1LogId}/resolve`, {
    method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${dlhToken}` },
    body: JSON.stringify({ finalClassification: "Organik" })
  });
  console.log("[Role 7 - Admin DLH] Discrepancy resolved.");

  // Fetch full city dashboard
  const dlhDashRes = await fetch(`${BASE_URL}/dashboard/kpi`, {
    method: "GET", headers: { "Authorization": `Bearer ${dlhToken}` }
  });
  const dlhDash = await dlhDashRes.json();
  console.log("[Role 7 - Admin DLH] DLH Dashboard loaded successfully.");

  // ==========================================================
  // ROLE 8 — LURAH & CAMAT & RT: LOGIN & READ-ONLY DASHBOARDS
  // ==========================================================
  // Lurah Dago
  console.log("\n[Role 8 - Lurah Dago] Logging in...");
  const lurahLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111114", password: "password123" }),
  });
  const lurahLogin = await lurahLoginRes.json();
  const lurahToken = lurahLogin.data.accessToken;

  const lurahDashRes = await fetch(`${BASE_URL}/dashboard/kpi`, {
    method: "GET", headers: { "Authorization": `Bearer ${lurahToken}` }
  });
  const lurahDash = await lurahDashRes.json();
  console.log("[Role 8 - Lurah Dago] Scoped dashboard loaded successfully.");

  // Camat Coblong
  console.log("\n[Role 8 - Camat Coblong] Logging in...");
  const camatLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111113", password: "password123" }),
  });
  const camatLogin = await camatLoginRes.json();
  const camatToken = camatLogin.data.accessToken;

  const camatDashRes = await fetch(`${BASE_URL}/dashboard/kpi`, {
    method: "GET", headers: { "Authorization": `Bearer ${camatToken}` }
  });
  const camatDash = await camatDashRes.json();
  console.log("[Role 8 - Camat Coblong] Scoped dashboard loaded successfully.");

  // RT Bambang RT 01
  console.log("\n[Role 8 - RT Bambang] Logging in...");
  const rtLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+628111111116", password: "password123" }),
  });
  const rtLogin = await rtLoginRes.json();
  const rtToken = rtLogin.data.accessToken;

  const rtDashRes = await fetch(`${BASE_URL}/dashboard/kpi`, {
    method: "GET", headers: { "Authorization": `Bearer ${rtToken}` }
  });
  const rtDash = await rtDashRes.json();
  console.log("[Role 8 - RT Bambang] Scoped dashboard loaded successfully.");

  console.log("\n==================================================");
  console.log("ALL 8 ROLES INTERACTED & E2E DEMO COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runRehearsal().catch((err) => {
  console.error("\n❌ COMPREHENSIVE REHEARSAL FAILED:");
  console.error(err);
  process.exit(1);
});
