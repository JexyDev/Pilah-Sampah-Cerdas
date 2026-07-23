import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000/api/v1";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_super_secure_key_123";

function generateToken(userId: string, roleName: string, rtRwId?: number) {
  return jwt.sign({ userId, role: roleName, rtRwId }, JWT_ACCESS_SECRET, { expiresIn: "24h" });
}

async function apiRequest(path: string, method: string, token: string | null, body?: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  let json: any = null;
  try {
    json = await response.json();
  } catch (e) {
    // No json
  }
  return { status: response.status, data: json };
}

async function run() {
  console.log("=== MEMULAI SIMULASI DATA UJI REALISTIS PSC ===");

  try {
    // 0. Prapemrosesan / Pembersihan
    const rtrw = await prisma.rtRwArea.findFirst();
    if (!rtrw) {
      console.error("Gagal: Tidak ada area RT/RW di database. Jalankan seed terlebih dahulu.");
      return;
    }
    console.log(`Menggunakan RT/RW: ${rtrw.name} (ID: ${rtrw.id})`);

    const organicCat = await prisma.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
    const inorganicCat = await prisma.wasteCategory.findFirst({ where: { name: "NON_ORGANIC" } });
    if (!organicCat || !inorganicCat) {
      console.error("Gagal: Kategori sampah ORGANIC/NON_ORGANIC tidak ditemukan.");
      return;
    }

    // Pembersihan data uji sebelumnya agar idempoten
    console.log("Membersihkan data uji lama dengan awalan 'TEST_'...");
    await prisma.pointHistory.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.ideDaurUlang.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.facility.deleteMany({ where: { nama: { startsWith: "TEST_" } } });
    await prisma.wasteLog.deleteMany({ where: { household: { user: { name: { startsWith: "TEST_" } } } } });
    await prisma.binResetRequest.deleteMany({ where: { OR: [ { user: { name: { startsWith: "TEST_" } } }, { reviewedBy: { name: { startsWith: "TEST_" } } } ] } });
    await prisma.binOwnership.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.household.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.notification.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.refreshToken.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    
    // Unbind bins from test users before deleting bins/users
    await prisma.bin.updateMany({
      where: { user: { name: { startsWith: "TEST_" } } },
      data: { userId: null }
    });

    await prisma.bin.deleteMany({ where: { qrCode: { startsWith: "TEST_" } } });
    await prisma.studentKkn.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.petugasResidu.deleteMany({ where: { user: { name: { startsWith: "TEST_" } } } });
    await prisma.user.deleteMany({ where: { name: { startsWith: "TEST_" } } });

    // Ambil/buat role
    const roleKkn = await prisma.role.findFirst({ where: { name: "MAHASISWA_KKN" } });
    const roleWarga = await prisma.role.findFirst({ where: { name: "WARGA" } });
    const roleRw = await prisma.role.findFirst({ where: { name: "RW" } });
    const rolePetugas = await prisma.role.findFirst({ where: { name: "PETUGAS_RESIDU" } });
    const roleDlh = await prisma.role.findFirst({ where: { name: "ADMIN_DLH" } });

    if (!roleKkn || !roleWarga || !roleRw || !rolePetugas || !roleDlh) {
      console.error("Gagal: Satu atau lebih role tidak ditemukan.");
      return;
    }

    // 1. Pembuatan Akun & Skenario 1 (Mahasiswa KKN & Warga)
    console.log("\n=== SKENARIO 1: AKTIVASI QR BIN & REGISTRASI WARGA ===");
    
    // a. Buat Mahasiswa KKN
    const studentUser = await prisma.user.create({
      data: {
        name: "TEST_Mahasiswa_01",
        email: "test_mahasiswa_01@example.com",
        password: "password123",
        nik: "1111222233334444",
        status: "Aktif",
        roleId: roleKkn.id,
        rtRwId: rtrw.id,
        phone: "08123456781",
        studentProfile: {
          create: {
            nim: "TEST_NIM_01",
            jurusan: "Teknik Lingkungan",
            fakultas: "FTSL",
            noWa: "08123456781",
            whitelistStatus: "APPROVED", // Auto approved in staging
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        }
      }
    });
    const kknToken = generateToken(studentUser.id, "MAHASISWA_KKN", rtrw.id);
    console.log(`Mahasiswa TEST_Mahasiswa_01 terbuat dengan ID: ${studentUser.id}`);

    // b. Buat printed bin untuk di-claim
    const bin1 = await prisma.bin.create({
      data: {
        qrCode: "TEST_QR_ORGANIK_01",
        categoryId: organicCat.id,
        rtRwId: rtrw.id,
        status: "PRINTED",
        maxCapacityLiter: 25.0,
      }
    });
    console.log(`Bin Printed: ${bin1.qrCode}`);

    // c. KKN Claim QR
    const claimRes = await apiRequest("/kkn/qr/claim", "POST", kknToken, {
      qrCode: "TEST_QR_ORGANIK_01",
      latitude: -6.882,
      longitude: 107.614,
    });
    console.log(`KKN Klaim QR: Status ${claimRes.status}`, claimRes.data);

    // d. KKN Register Warga
    const regWargaRes = await apiRequest("/kkn/register-warga", "POST", kknToken, {
      name: "TEST_Warga_01",
      email: "test_warga_01@example.com",
      phone: "08123456782",
      nik: "3273110293770001",
      address: "Jl. Dago Giri No. 12",
      rtRwId: rtrw.id,
      binQrCode: "TEST_QR_ORGANIK_01",
      binCategoryId: organicCat.id,
      latitude: -6.882,
      longitude: 107.614,
      maxCapacityLiter: 25.0,
    });
    console.log(`KKN Registrasi Warga: Status ${regWargaRes.status}`, regWargaRes.data);

    // Verifikasi QR Status PENDING_APPROVAL
    const binAfterReg = await prisma.bin.findUnique({ where: { qrCode: "TEST_QR_ORGANIK_01" } });
    console.log(`Status QR setelah registrasi: ${binAfterReg?.status} (Expected: PENDING_APPROVAL)`);

    // e. Buat RW dan Setujui
    const rwUser = await prisma.user.create({
      data: {
        name: "TEST_RW_01",
        email: "test_rw_01@example.com",
        password: "password123",
        nik: "1111222233334445",
        status: "Aktif",
        roleId: roleRw.id,
        rtRwId: rtrw.id,
        phone: "08123456783",
      }
    });
    const rwToken = generateToken(rwUser.id, "RW", rtrw.id);

    const approveRes = await apiRequest(`/bins/${binAfterReg?.id}/approve-activation`, "PUT", rwToken);
    console.log(`RW Menyetujui Bin: Status ${approveRes.status}`, approveRes.data);

    // Verifikasi Poin & Status Akhir
    const binAfterApprove = await prisma.bin.findUnique({ where: { qrCode: "TEST_QR_ORGANIK_01" } });
    console.log(`Status QR akhir: ${binAfterApprove?.status} (Expected: ACTIVE_BOUND)`);

    const wargaUser = await prisma.user.findFirst({ where: { name: "TEST_Warga_01" } });
    const wargaPoints = await prisma.pointHistory.aggregate({
      where: { userId: wargaUser?.id },
      _sum: { points: true }
    });
    const kknPoints = await prisma.pointHistory.aggregate({
      where: { userId: studentUser.id },
      _sum: { points: true }
    });
    console.log(`Poin awal Warga: ${wargaPoints._sum.points} Pts (Expected: +50)`);
    console.log(`Poin awal KKN: ${kknPoints._sum.points} Pts (Expected: +10)`);


    // 2. Skenario 2: Warga Setoran Sampah 5 Hari Berturut-turut
    console.log("\n=== SKENARIO 2: WARGA SETOR SAMPAH HARIAN (5 HARI STREAK) ===");
    const wargaToken = generateToken(wargaUser!.id, "WARGA", rtrw.id);
    
    // a. Buat bin kedua (anorganik) langsung terikat agar warga bisa menyetor kedua jenis
    const bin2 = await prisma.bin.create({
      data: {
        qrCode: "TEST_QR_ANORGANIK_01",
        categoryId: inorganicCat.id,
        rtRwId: rtrw.id,
        status: "ACTIVE_BOUND",
        userId: wargaUser!.id,
        maxCapacityLiter: 25.0,
      }
    });
    await prisma.binOwnership.create({
      data: { binId: bin2.id, userId: wargaUser!.id, type: "TAMBAHAN" }
    });

    const household = await prisma.household.findFirst({ where: { userId: wargaUser!.id } });

    // Masukkan data transaksi setoran berturut-turut
    // Hari 1 s.d. 4 lewat Prisma secara manual memanipulasi tanggal
    // Hari ke-5 dilakukan via scan API riil untuk memicu streak logic!
    const dates = [
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    ];

    for (let idx = 0; idx < dates.length; idx++) {
      const d = dates[idx];
      // Setoran organik
      await prisma.wasteLog.create({
        data: {
          householdId: household!.id,
          binId: bin1.id,
          categoryId: organicCat.id,
          weightKg: 2.0,
          volumeLiter: 5.0,
          aiClassification: "ORGANIC",
          aiConfidence: 95.0,
          requestId: randomUUID(),
          createdAt: d,
        }
      });
      // Poin setoran (+200 poin per setoran)
      await prisma.pointHistory.create({
        data: {
          userId: wargaUser!.id,
          points: 400, // 2kg * 100pt/kg * 2.0 multiplier
          description: `Setoran sampah harian - Hari ke-${idx + 1}`,
          kategori: "REDUKSI_TONASE",
          createdAt: d,
        }
      });
    }
    console.log("Telah mensimulasikan setoran hari ke-1 s.d. 4 di database.");

    // Hari ke-5: Setor via API
    const scanRes = await apiRequest("/bins/scan", "POST", wargaToken, {
      qrCode: "TEST_QR_ORGANIK_01",
      detectedType: "ORGANIC",
      estimatedVolume: 5.0,
      householdId: household!.id,
      userLat: -6.882,
      userLng: 107.614,
    });
    console.log(`Scan Setoran Hari ke-5 (API): Status ${scanRes.status}`, scanRes.data);

    // Verifikasi total poin akhir warga setelah streak
    const finalWargaPoints = await prisma.pointHistory.aggregate({
      where: { userId: wargaUser!.id },
      _sum: { points: true }
    });
    console.log(`Total Poin Akhir Warga: ${finalWargaPoints._sum.points} Pts`);


    // 3. Skenario 3: Tong Penuh -> Angkut Petugas Residu (Beda Klasifikasi)
    console.log("\n=== SKENARIO 3: TONG PENUH -> TIMBANGAN PETUGAS RESIDU ===");
    
    // a. Report full
    const reportFullRes = await apiRequest(`/bins/${bin1.id}/report-issue`, "POST", wargaToken, {
      issueType: "EMPTY_REQUEST",
      notes: "Tong sampah organik TEST_Warga_01 sudah penuh meluap!"
    });
    console.log(`Warga Lapor Tong Penuh: Status ${reportFullRes.status}`, reportFullRes.data);

    // b. Buat Petugas Residu
    const petugasUser = await prisma.user.create({
      data: {
        name: "TEST_Petugas_01",
        email: "test_petugas_01@example.com",
        password: "password123",
        nik: "1111222233334446",
        status: "Aktif",
        roleId: rolePetugas.id,
        rtRwId: rtrw.id,
        phone: "08123456784",
        petugasProfile: {
          create: {
            nama: "TEST_Petugas_01",
            noWa: "08123456784",
            assignedZone: "DAGO_UTARA",
          }
        }
      }
    });
    const petugasToken = generateToken(petugasUser.id, "PETUGAS_RESIDU", rtrw.id);
    console.log(`Petugas TEST_Petugas_01 terbuat dengan ID: ${petugasUser.id}`);

    // Dapatkan log transaksi terakhir untuk setoran hari ke-5
    const lastLog = await prisma.wasteLog.findFirst({
      where: { householdId: household!.id },
      orderBy: { createdAt: "desc" }
    });

    // c. Petugas timbang dengan discrepancy (AI = ORGANIC, Petugas input NON_ORGANIC, AI conf = 95%)
    await prisma.wasteLog.update({
      where: { id: lastLog!.id },
      data: {
        aiConfidence: 95.0,
        aiClassification: "ORGANIC"
      }
    });

    const reportWasteRes = await apiRequest(`/waste/logs/${lastLog!.id}/report`, "POST", petugasToken, {
      actualWeight: 3.5,
      manualClassification: "NON_ORGANIC",
      geolocation: "TEST_Geo_01",
    });
    console.log(`Petugas Lapor Timbangan: Status ${reportWasteRes.status}`, reportWasteRes.data);

    // Verifikasi Status Discrepancy
    const updatedLog = await prisma.wasteLog.findUnique({ where: { id: lastLog!.id } });
    console.log(`Status Diskrepansi Log: ${updatedLog?.discrepancyStatus} (Expected: PENDING_REVIEW)`);


    // 4. Skenario 4: Ide Daur Ulang & Input Fasilitas GIS
    console.log("\n=== SKENARIO 4: IDE DAUR ULANG & INPUT FASILITAS GIS ===");
    
    // a. Submit Ide Daur Ulang
    const submitIdeaRes = await apiRequest("/gamification/recycle-ideas", "POST", wargaToken, {
      judul: "TEST_Kerajinan_Botol_Plastik",
      material: "Botol Plastik Bekas PET",
      foto: "http://mock-storage/idea.jpg",
    });
    console.log(`Warga Ajukan Ide: Status ${submitIdeaRes.status}`, submitIdeaRes.data);

    const ideaId = submitIdeaRes.data.data.id;

    // b. RW Approve Ide Daur Ulang
    const approveIdeaRes = await apiRequest(`/gamification/recycle-ideas/${ideaId}/approve`, "PUT", rwToken);
    console.log(`RW Setujui Ide: Status ${approveIdeaRes.status}`, approveIdeaRes.data);

    // Verifikasi Poin ide daur ulang warga
    const ideaPoin = await prisma.pointHistory.findFirst({
      where: { userId: wargaUser!.id, description: { contains: "TEST_Kerajinan_Botol_Plastik" } }
    });
    console.log(`Poin Daur Ulang Warga: ${ideaPoin?.points || 0} Pts (Expected: +50)`);

    // c. Mahasiswa input Fasilitas GIS
    const inputGISRes = await apiRequest("/kkn/fasilitas/bantu-input", "POST", kknToken, {
      userId: wargaUser!.id,
      rtRwId: rtrw.id,
      nama: "TEST_Rumah_Maggot_01",
      jenis: "rumah_maggot",
      latitude: -6.883,
      longitude: 107.615,
    });
    console.log(`KKN Input Fasilitas GIS: Status ${inputGISRes.status}`, inputGISRes.data);


    // 5. Skenario 5: Edge Cases
    console.log("\n=== SKENARIO 5: NOTIFIKASI ESKALASI & BIN TIDAK AKTIF ===");

    // a. Buat Notifikasi Eskalasi langsung di database untuk memicu radar superadmin/lurah
    const DLHUser = await prisma.user.create({
      data: {
        name: "TEST_AdminDLH_01",
        email: "test_dlh_01@example.com",
        password: "password123",
        nik: "1111222233334447",
        status: "Aktif",
        roleId: roleDlh.id,
        rtRwId: rtrw.id,
        phone: "08123456785",
      }
    });

    const escNotif = await prisma.notification.create({
      data: {
        userId: DLHUser.id,
        title: "Eskalasi Pengangkutan Residu",
        message: "[ESKALASI] Tempat sampah TEST_QR_ORGANIK_01 tidak diangkut petugas selama lebih dari window waktu!",
        isRead: false,
      }
    });
    console.log(`Notifikasi eskalasi terbuat: ${escNotif.title}`);

    // b. Simulasikan bin tidak aktif (30 hari tanpa aktivitas)
    // Ubah status dan update tanggal di DB untuk bin2 (TEST_QR_ANORGANIK_01)
    await prisma.bin.update({
      where: { id: bin2.id },
      data: {
        status: "INACTIVE",
        updatedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      }
    });
    console.log("Mensimulasikan status tempat sampah TEST_QR_ANORGANIK_01 menjadi INACTIVE (30 hari tanpa aktivitas)");

    console.log("\n=== SIMULASI DATA UJI SELESAI DENGAN SUKSES! ===");

  } catch (error) {
    console.error("Kesalahan fatal saat eksekusi simulasi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
