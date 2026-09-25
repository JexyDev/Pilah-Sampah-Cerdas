import { prisma } from "../lib/prisma.js";
import * as XLSX from "xlsx";
import { isTestKelompok, isTestStudent, isTestUser } from "../utils/filterTestingUtils.js";

export interface KknExecutiveFilters {
  kelurahan?: string;
  rw?: string;
  periode?: string;
  kelompok?: string;
  includeTestAccounts?: boolean;
}

export const kknExecutiveService = {
  /**
   * Mengambil data lengkap untuk Dashboard Eksekutif KKN Pimpinan
   * 100% Real-time Aggregation dari Database PostgreSQL
   */
  async getExecutiveDashboard(filters: KknExecutiveFilters = {}) {
    const rawKel = filters.kelurahan ? filters.kelurahan.replace(/^Kel\.\s*/i, "").trim() : "";
    const isFilteredKel = rawKel && rawKel !== "ALL" && rawKel !== "Semua Kelurahan" && rawKel !== "Semua Wilayah";
    const kelFilterNormalized = isFilteredKel ? rawKel : undefined;

    const rawRw = filters.rw ? filters.rw.trim() : "";
    const isFilteredRw = rawRw && rawRw !== "ALL" && rawRw !== "Semua RW";

    // 1. Where clause helper
    const kelompokWhere: any = {};
    if (kelFilterNormalized) {
      const isLebakGede = kelFilterNormalized.toLowerCase().replace(/\s+/g, "") === "lebakgede";
      if (isLebakGede) {
        kelompokWhere.OR = [
          { kelurahan: { contains: "Lebak Gede", mode: "insensitive" } },
          { kelurahan: { contains: "Lebakgede", mode: "insensitive" } },
        ];
      } else {
        kelompokWhere.kelurahan = {
          contains: kelFilterNormalized,
          mode: "insensitive",
        };
      }
    }

    // Ambil kelompok KKN sesuai filter kelurahan
    let kelompokList = await prisma.kelompokKkn.findMany({
      where: kelompokWhere,
      select: {
        id: true,
        name: true,
        kelurahan: true,
        cakupanRw: true,
        dplId: true,
        dplNamaMentah: true,
        dpl: { select: { id: true, name: true, phone: true, nip: true, isTestAccount: true } },
      },
    });

    // 100% Data Aktual: Filter kelompok testing/dummy
    if (!filters.includeTestAccounts) {
      kelompokList = kelompokList.filter((k) => !isTestKelompok(k));
    }

    // Filter RW di memori jika ada filter RW
    if (isFilteredRw) {
      const rwNum = parseInt(rawRw.replace(/\D/g, ""), 10);
      if (!isNaN(rwNum)) {
        kelompokList = kelompokList.filter((k) => {
          if (!Array.isArray(k.cakupanRw)) return false;
          return k.cakupanRw.some((item) => {
            const num = parseInt(String(item).replace(/\D/g, ""), 10);
            return num === rwNum;
          });
        });
      }
    }

    // Filter Kelompok spesifik jika ada filter kelompok
    const rawKelompok = filters.kelompok ? filters.kelompok.trim() : "";
    const isFilteredKelompok = rawKelompok && rawKelompok !== "ALL" && rawKelompok !== "Semua Kelompok";
    if (isFilteredKelompok) {
      kelompokList = kelompokList.filter(
        (k) =>
          k.id === rawKelompok ||
          k.name.toLowerCase().trim() === rawKelompok.toLowerCase().trim() ||
          k.name.toLowerCase().includes(rawKelompok.toLowerCase().trim())
      );
    }

    const kelompokIds = kelompokList.map((k) => k.id);

    // 2. Total Kelompok Aktual
    const totalKelompok = kelompokList.length;

    // 3. Total DPL Aktual (Validasi nama dan email DPL non-testing)
    const rawUniqueDplIds = Array.from(new Set(kelompokList.map((k) => k.dplId).filter(Boolean))) as string[];
    const dplUsersRaw = await prisma.user.findMany({
      where: { id: { in: rawUniqueDplIds } },
      select: { id: true, name: true, phone: true, email: true, nip: true, programStudi: true },
    });
    const realDplUsers = dplUsersRaw.filter((d) => !isTestUser(d));
    const realDplMap = new Map(realDplUsers.map((d) => [d.id, d]));
    const uniqueDplIds = rawUniqueDplIds.filter((id) => realDplMap.has(id));
    const totalDpl = uniqueDplIds.length;

    // 4. Mahasiswa KKN Aktual
    const studentWhere: any = {};
    if (kelompokIds.length > 0) {
      studentWhere.kelompokId = { in: kelompokIds };
    } else if (isFilteredKel || isFilteredRw) {
      studentWhere.kelompokId = "__none__";
    }

    const studentsRaw = await prisma.studentKkn.findMany({
      where: studentWhere,
      select: {
        id: true,
        userId: true,
        nim: true,
        jurusan: true,
        fakultas: true,
        kelompokId: true,
        assignedRwId: true,
        jenjangPendidikan: true,
        sks: true,
        noWa: true,
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            isTestAccount: true,
          },
        },
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
          },
        },
      },
    });

    // 100% Data Aktual: Filter akun mahasiswa testing / dummy
    const students = filters.includeTestAccounts
      ? studentsRaw
      : studentsRaw.filter((s) => !isTestStudent(s));

    const totalMahasiswa = students.length;
    const realStudentIds = students.map((s) => s.id);
    const realStudentUserIds = students.map((s) => s.userId).filter(Boolean);
    const realStudentUserIdsSet = new Set(realStudentUserIds);

    // 5. Total Wilayah (Kelurahan & RW) - 100% Real Fetch Database PostgreSQL
    const allKelurahans = ["Cipaganti", "Dago", "Lebakgede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];

    // Kumpulkan distinct RW dari kelompok dengan menyertakan konteks Kelurahan agar nomor RW antar-kelurahan tidak saling menimpa
    const distinctRws = new Set<string>();
    kelompokList.forEach((k) => {
      if (Array.isArray(k.cakupanRw)) {
        const kelKey = (k.kelurahan || "").trim().toLowerCase();
        k.cakupanRw.forEach((rw) => {
          if (rw !== undefined && rw !== null && String(rw).trim() !== "") {
            distinctRws.add(`${kelKey}_${String(rw).trim()}`);
          }
        });
      }
    });

    const totalKelurahanDb = await prisma.kelurahan.count();
    // Kondisi Prisma untuk mengecualikan RW dummy/test (nama mengandung "99", "dummy", atau "test")
    // Selaras dengan logika filter frontend di DashboardEksekutifKkn.tsx (num < 90)
    const nonTestRwWhere = {
      NOT: [
        { name: { contains: "99", mode: "insensitive" as const } },
        { name: { contains: "dummy", mode: "insensitive" as const } },
        { name: { contains: "test", mode: "insensitive" as const } },
      ],
    };
    const totalRwKecamatan = await prisma.rw.count({ where: nonTestRwWhere });

    let kelurahanCount = totalKelurahanDb;
    if (isFilteredKel) {
      kelurahanCount = kelompokList.length > 0 ? 1 : 0;
    } else if (isFilteredKelompok) {
      const distinctKel = new Set(kelompokList.map((k) => (k.kelurahan || "").trim()).filter(Boolean));
      kelurahanCount = distinctKel.size;
    }

    let rwCount = 0;
    if (isFilteredRw) {
      rwCount = kelompokList.length > 0 ? 1 : 0;
    } else if (isFilteredKelompok) {
      // Jika difilter per kelompok spesifik, ambil RW cakupan kelompok tersebut
      rwCount = distinctRws.size;
    } else if (isFilteredKel) {
      // Jika difilter per kelurahan, ambil total RW riil kelurahan tersebut dari tabel rw (kecualikan dummy/test)
      const isLebakGede = kelFilterNormalized.toLowerCase().replace(/\s+/g, "") === "lebakgede";
      rwCount = await prisma.rw.count({
        where: isLebakGede
          ? {
              ...nonTestRwWhere,
              OR: [
                { kelurahan: { name: { contains: "Lebak Gede", mode: "insensitive" } } },
                { kelurahan: { name: { contains: "Lebakgede", mode: "insensitive" } } },
              ],
            }
          : {
              ...nonTestRwWhere,
              kelurahan: {
                name: { contains: kelFilterNormalized, mode: "insensitive" },
              },
            },
      });
    } else {
      // Kondisi default (Semua Kelurahan): Total seluruh RW riil terdaftar di kecamatan dari tabel rw
      rwCount = totalRwKecamatan; // sudah bersih karena totalRwKecamatan kini menggunakan nonTestRwWhere
    }

    // 6. Sebaran Program Studi Mahasiswa
    const prodiMap = new Map<string, number>();
    students.forEach((s) => {
      let raw = (s.jurusan || "Lainnya").trim();
      // Normalisasi nama prodi
      raw = raw.replace(/^S1\s+/i, "");
      raw = raw.replace(/\s+S1$/i, "");
      if (raw.toLowerCase() === "teknik informatika" || raw.toLowerCase() === "informatika") {
        raw = "Teknik Komputer & IF";
      }
      prodiMap.set(raw, (prodiMap.get(raw) || 0) + 1);
    });

    const sortedProdi = Array.from(prodiMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    let sebaranProdi: Array<{ name: string; count: number }> = [];
    if (sortedProdi.length > 0) {
      const top5 = sortedProdi.slice(0, 5);
      const remainingCount = sortedProdi.slice(5).reduce((acc, curr) => acc + curr.count, 0);
      sebaranProdi = [
        ...top5,
        { name: "Program Studi Lainnya", count: remainingCount },
      ];
    }

    // 7. Distribusi Beban SKS Dinamis & Real-time (100% Zero Hardcode)
    // Mahasiswa dengan beban 0 SKS / null disembunyikan dari chart distribusi beban karena merupakan data belum lengkap dari Excel
    const sksCounts: Record<string, { sks: number; count: number; label: string }> = {};

    const COLOR_PALETTE: Record<number, string> = {
      6: "#f59e0b",  // Amber
      11: "#0ea5e9", // Sky Blue
      12: "#3b82f6", // Blue
      13: "#6366f1", // Indigo
      14: "#8b5cf6", // Violet
      17: "#ec4899", // Pink
      18: "#f43f5e", // Rose
      19: "#10b981", // Emerald
      20: "#059669", // Dark Emerald / MBKM Penuh
    };

    let totalMahasiswaDenganSks = 0;
    let belumTerdataCount = 0;

    students.forEach((s: any) => {
      const sksVal = s.sks && Number(s.sks) > 0 ? Number(s.sks) : 0;
      if (sksVal <= 0) {
        belumTerdataCount++;
        return; // Sembunyikan 0 SKS / belum terdata dari distribusi beban SKS
      }

      totalMahasiswaDenganSks++;
      const key = String(sksVal);
      if (!sksCounts[key]) {
        sksCounts[key] = {
          sks: sksVal,
          count: 0,
          label: `${sksVal} SKS`,
        };
      }
      sksCounts[key].count++;
    });

    const breakdown = Object.values(sksCounts)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        sks: item.sks,
        label: item.label,
        count: item.count,
        percentage: totalMahasiswaDenganSks > 0 ? Math.round((item.count / totalMahasiswaDenganSks) * 100) : 0,
        color: COLOR_PALETTE[item.sks] || "#0284c7",
      }));

    const distribusiSks = {
      totalMahasiswa: totalMahasiswaDenganSks, // Total mahasiswa dengan konversi SKS valid untuk angka di tengah donut chart
      totalMahasiswaSemua: totalMahasiswa,
      totalMahasiswaDenganSks,
      belumTerdataCount,
      breakdown,
    };

    // 8. Sebaran Mahasiswa per Wilayah
    const mhsWilayahMap: Record<string, number> = {
      Cipaganti: 0,
      Dago: 0,
      Lebakgede: 0,
      "Lebak Siliwangi": 0,
      "Sadang Serang": 0,
      Sekeloa: 0,
    };

    // Mapping kelompok id ke kelurahan
    const kelompokKelurahanMap = new Map<string, string>();
    kelompokList.forEach((k) => {
      let kel = (k.kelurahan || "").trim();
      if (kel.toLowerCase().includes("lebak") && kel.toLowerCase().includes("gede")) kel = "Lebakgede";
      else if (kel.toLowerCase().includes("lebak") && kel.toLowerCase().includes("siliwangi")) kel = "Lebak Siliwangi";
      else if (kel.toLowerCase().includes("sadang")) kel = "Sadang Serang";
      else if (kel.toLowerCase().includes("cipaganti")) kel = "Cipaganti";
      else if (kel.toLowerCase().includes("dago")) kel = "Dago";
      else if (kel.toLowerCase().includes("sekeloa")) kel = "Sekeloa";
      kelompokKelurahanMap.set(k.id, kel);
    });

    students.forEach((s) => {
      const kel = kelompokKelurahanMap.get(s.kelompokId || "");
      if (kel && mhsWilayahMap[kel] !== undefined) {
        mhsWilayahMap[kel]++;
      }
    });

    const sebaranMahasiswaPerWilayah = Object.entries(mhsWilayahMap).map(([kelurahan, count]) => ({
      kelurahan,
      count,
    }));

    // 9. Sebaran DPL per Wilayah
    const dplWilayahMap: Record<string, Set<string>> = {
      Cipaganti: new Set(),
      Dago: new Set(),
      Lebakgede: new Set(),
      "Lebak Siliwangi": new Set(),
      "Sadang Serang": new Set(),
      Sekeloa: new Set(),
    };

    kelompokList.forEach((k) => {
      if (k.dplId) {
        let kel = (k.kelurahan || "").trim();
        if (kel.toLowerCase().includes("lebak") && kel.toLowerCase().includes("gede")) kel = "Lebakgede";
        else if (kel.toLowerCase().includes("lebak") && kel.toLowerCase().includes("siliwangi")) kel = "Lebak Siliwangi";
        else if (kel.toLowerCase().includes("sadang")) kel = "Sadang Serang";
        else if (kel.toLowerCase().includes("cipaganti")) kel = "Cipaganti";
        else if (kel.toLowerCase().includes("dago")) kel = "Dago";
        else if (kel.toLowerCase().includes("sekeloa")) kel = "Sekeloa";

        if (dplWilayahMap[kel]) {
          dplWilayahMap[kel].add(k.dplId);
        }
      }
    });

    const sebaranDplPerWilayah = Object.entries(dplWilayahMap).map(([kelurahan, set]) => ({
      kelurahan,
      count: set.size,
    }));

    // 10. Status Program Kerja
    const prokerWhere: any = {};
    if (kelompokIds.length > 0) {
      prokerWhere.kelompokId = { in: kelompokIds };
    } else if (isFilteredKel || isFilteredRw) {
      prokerWhere.kelompokId = "__none__";
    }

    const prokerList = await prisma.programKerjaKkn.findMany({
      where: prokerWhere,
      select: {
        id: true,
        status: true,
        statusUsulan: true,
        statusPelaksanaan: true,
      },
    });

    let usulanDisetujui = 0;
    let usulanBelumDisetujui = 0;
    let usulanDitolak = 0;

    let pelaksanaanBelum = 0;
    let pelaksanaanSedangBerjalan = 0;
    let pelaksanaanSelesai = 0;
    let totalProkerDisetujui = 0;

    prokerList.forEach((p) => {
      // 1. Dimensi Status Usulan (Mandiri & Terpisah: Disetujui, Belum Disetujui, Ditolak)
      const stUsulan = (p.statusUsulan || "").toUpperCase();
      const stUtama = (p.status || "").toUpperCase();

      const isDisetujui =
        stUsulan === "DISETUJUI" ||
        stUtama === "DITERIMA" ||
        stUtama === "SEDANG_BERJALAN" ||
        stUtama === "SELESAI";

      if (stUsulan === "DITOLAK" || stUtama === "DITOLAK") {
        usulanDitolak++;
      } else if (isDisetujui) {
        usulanDisetujui++;
      } else {
        usulanBelumDisetujui++;
      }

      // 2. Dimensi Status Pelaksanaan (HANYA untuk proker yang telah disetujui)
      if (isDisetujui) {
        totalProkerDisetujui++;
        const stPelaksanaan = (p.statusPelaksanaan || "").toUpperCase();
        if (stPelaksanaan === "SELESAI" || stUtama === "SELESAI") {
          pelaksanaanSelesai++;
        } else if (stPelaksanaan === "SEDANG_BERJALAN" || stUtama === "SEDANG_BERJALAN") {
          pelaksanaanSedangBerjalan++;
        } else {
          pelaksanaanBelum++;
        }
      }
    });

    const totalProker = prokerList.length;
    const pctUsulanDisetujui = totalProker > 0 ? Math.round((usulanDisetujui / totalProker) * 100) : 0;
    const pctUsulanBelumDisetujui = totalProker > 0 ? Math.round((usulanBelumDisetujui / totalProker) * 100) : 0;
    const pctUsulanDitolak = totalProker > 0 ? Math.round((usulanDitolak / totalProker) * 100) : 0;

    const pctPelaksanaanBelum = totalProkerDisetujui > 0 ? Math.round((pelaksanaanBelum / totalProkerDisetujui) * 100) : 0;
    const pctPelaksanaanSedangBerjalan = totalProkerDisetujui > 0 ? Math.round((pelaksanaanSedangBerjalan / totalProkerDisetujui) * 100) : 0;
    const pctPelaksanaanSelesai = totalProkerDisetujui > 0 ? Math.round((pelaksanaanSelesai / totalProkerDisetujui) * 100) : 0;

    const statusProker = {
      total: totalProker,
      // Dimensi Status Usulan (Mandiri & Terpisah sesuai Notulensi A.2)
      usulan: {
        total: totalProker,
        disetujui: { count: usulanDisetujui, percentage: pctUsulanDisetujui },
        belumDisetujui: { count: usulanBelumDisetujui, percentage: pctUsulanBelumDisetujui },
        ditolak: { count: usulanDitolak, percentage: pctUsulanDitolak },
      },
      // Dimensi Status Pelaksanaan (Belum, Sedang Berjalan, Sudah Selesai)
      pelaksanaan: {
        total: totalProkerDisetujui,
        belum: { count: pelaksanaanBelum, percentage: pctPelaksanaanBelum },
        sedangBerjalan: { count: pelaksanaanSedangBerjalan, percentage: pctPelaksanaanSedangBerjalan },
        selesai: { count: pelaksanaanSelesai, percentage: pctPelaksanaanSelesai },
      },
      // Kompatibilitas alur lama
      diusulkan: { count: usulanBelumDisetujui, percentage: pctUsulanBelumDisetujui },
      disetujui: { count: usulanDisetujui, percentage: pctUsulanDisetujui },
      ditolak: { count: usulanDitolak, percentage: pctUsulanDitolak },
      sedangDilaksanakan: { count: pelaksanaanSedangBerjalan, percentage: pctPelaksanaanSedangBerjalan },
      selesai: { count: pelaksanaanSelesai, percentage: pctPelaksanaanSelesai },
    };

    // 11. Presensi Mahasiswa
    const studentUserIds = students.map((s) => s.userId);
    const attendanceWhere: any = {};
    if (studentUserIds.length > 0) {
      attendanceWhere.studentId = { in: studentUserIds };
    } else if (isFilteredKel || isFilteredRw) {
      attendanceWhere.studentId = "__none__";
    }

    const attendanceStats = await prisma.activityAttendance.groupBy({
      by: ["status"],
      where: attendanceWhere,
      _count: { id: true },
    });

    let hadirCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let alpaCount = 0;

    attendanceStats.forEach((st) => {
      const s = (st.status || "").toUpperCase();
      if (s.includes("HADIR") || s === "BERLANGSUNG" || s === "SELESAI") {
        hadirCount += st._count.id;
      } else if (s === "IZIN") {
        izinCount += st._count.id;
      } else if (s === "SAKIT") {
        sakitCount += st._count.id;
      } else if (s === "ALPA") {
        alpaCount += st._count.id;
      }
    });

    const totalAttendanceSample = hadirCount + izinCount + sakitCount + alpaCount;

    let finalHadir = 0;
    let finalIzin = 0;
    let finalSakit = 0;
    let finalAlpa = 0;
    let pctHadir = 0;
    let pctIzin = 0;
    let pctSakit = 0;
    let pctAlpa = 0;

    if (totalAttendanceSample > 0 && totalMahasiswa > 0) {
      finalHadir = Math.round((hadirCount / totalAttendanceSample) * totalMahasiswa);
      finalIzin = Math.round((izinCount / totalAttendanceSample) * totalMahasiswa);
      finalSakit = Math.round((sakitCount / totalAttendanceSample) * totalMahasiswa);
      finalAlpa = Math.max(0, totalMahasiswa - finalHadir - finalIzin - finalSakit);

      pctIzin = Math.round((finalIzin / totalMahasiswa) * 1000) / 10;
      pctSakit = Math.round((finalSakit / totalMahasiswa) * 1000) / 10;
      pctAlpa = Math.round((finalAlpa / totalMahasiswa) * 1000) / 10;
      pctHadir = Math.round((100 - pctIzin - pctSakit - pctAlpa) * 10) / 10;
    }

    const presensiMahasiswa = {
      percentageHadir: pctHadir,
      breakdown: [
        { label: "Hadir", count: finalHadir, percentage: pctHadir, color: "#009966" },
        { label: "Izin", count: finalIzin, percentage: pctIzin, color: "#f97316" },
        { label: "Sakit", count: finalSakit, percentage: pctSakit, color: "#eab308" },
        { label: "Tanpa Keterangan", count: finalAlpa, percentage: pctAlpa, color: "#64748b" },
      ],
    };

    // 12. Rasio Kehadiran terhadap Target 200 Jam
    // Akumulasi jam riil (ActivityAttendance + PresensiMandiri)
    const totalMinutesAgg = await prisma.activityAttendance.aggregate({
      where: attendanceWhere,
      _sum: { actualInZoneMinutes: true },
    });

    const mandiriWhere: any = {};
    if (studentUserIds.length > 0) {
      mandiriWhere.studentId = { in: studentUserIds };
    } else if (isFilteredKel || isFilteredRw) {
      mandiriWhere.studentId = "__none__";
    }

    const totalMandiriAgg = await prisma.presensiMandiri.aggregate({
      where: mandiriWhere,
      _sum: { durasiMenit: true },
    });

    const totalActualMinutes = (totalMinutesAgg._sum.actualInZoneMinutes || 0) + (totalMandiriAgg._sum.durasiMenit || 0);
    const totalHoursRaw = totalActualMinutes / 60;
    const currentAvgHours = totalMahasiswa > 0 ? Math.round(totalHoursRaw / totalMahasiswa) : 0;
    const targetHours = 200;
    const rasioPercentage = Math.round((currentAvgHours / targetHours) * 100);
    const remainingHours = Math.max(0, targetHours - currentAvgHours);

    // Weekly Trends: 8-week KKN period (August - October 2026)
    const weeklyDefs = [
      { week: "M1", start: new Date("2026-08-12T00:00:00Z"), end: new Date("2026-08-18T23:59:59Z") },
      { week: "M2", start: new Date("2026-08-19T00:00:00Z"), end: new Date("2026-08-25T23:59:59Z") },
      { week: "M3", start: new Date("2026-08-26T00:00:00Z"), end: new Date("2026-09-01T23:59:59Z") },
      { week: "M4", start: new Date("2026-09-02T00:00:00Z"), end: new Date("2026-09-08T23:59:59Z") },
      { week: "M5", start: new Date("2026-09-09T00:00:00Z"), end: new Date("2026-09-15T23:59:59Z") },
      { week: "M6", start: new Date("2026-09-16T00:00:00Z"), end: new Date("2026-09-22T23:59:59Z") },
      { week: "M7", start: new Date("2026-09-23T00:00:00Z"), end: new Date("2026-09-29T23:59:59Z") },
      { week: "M8", start: new Date("2026-09-30T00:00:00Z"), end: new Date("2026-10-06T23:59:59Z") },
    ];

    const weeklyAttendances = await prisma.activityAttendance.findMany({
      where: attendanceWhere,
      select: { attendedAt: true, actualInZoneMinutes: true },
    });

    let runningMinutes = 0;
    const weeklyTrends = weeklyDefs.map((w) => {
      const weekMins = weeklyAttendances
        .filter((a) => a.attendedAt >= w.start && a.attendedAt <= w.end)
        .reduce((sum, curr) => sum + (curr.actualInZoneMinutes || 0), 0);
      runningMinutes += weekMins;
      const avgH = totalMahasiswa > 0 ? Math.round(runningMinutes / totalMahasiswa / 60) : 0;
      return {
        week: w.week,
        avgHours: avgH,
        target: 200,
      };
    });

    const rasioKehadiranTrend = {
      currentAvgHours,
      targetHours,
      percentage: rasioPercentage,
      remainingHours,
      weeklyTrends,
    };

    // 13. Aktivitas Terkini (Log Mahasiswa & DPL)
    const logMhsWhere: any = {};
    if (kelompokIds.length > 0) {
      logMhsWhere.kelompokId = { in: kelompokIds };
    } else if (isFilteredKel || isFilteredRw) {
      logMhsWhere.kelompokId = "__none__";
    }

    const logDplWhere: any = {};
    if (kelompokIds.length > 0) {
      logDplWhere.kelompokId = { in: kelompokIds };
    } else if (isFilteredKel || isFilteredRw) {
      logDplWhere.kelompokId = "__none__";
    }

    const countLogMhs = await prisma.logbookKkn.count({
      where: logMhsWhere,
    });
    const countLogDpl = await prisma.logbookDpl.count({
      where: logDplWhere,
    });

    const totalLogMahasiswa = countLogMhs;
    const totalLogDpl = countLogDpl;

    // Real 7-day activities dynamically anchored to latest logbook or current date
    const latestLog = await prisma.logbookKkn.findFirst({
      where: logMhsWhere,
      orderBy: { tanggalKegiatan: "desc" },
      select: { tanggalKegiatan: true },
    });
    const anchorDate = latestLog?.tanggalKegiatan ? new Date(latestLog.tanggalKegiatan) : new Date();

    const sevenDays: { dateStr: string; label: string; start: Date; end: Date }[] = [];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      const dayNum = d.getDate();
      const monthStr = monthsShort[d.getMonth()];
      const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const start = new Date(`${dateIso}T00:00:00.000Z`);
      const end = new Date(`${dateIso}T23:59:59.999Z`);
      sevenDays.push({
        dateStr: dateIso,
        label: `${dayNum} ${monthStr}`,
        start,
        end,
      });
    }

    const rangeStart = sevenDays[0].start;
    const rangeEnd = sevenDays[sevenDays.length - 1].end;

    const [recentMhsLogs, recentDplLogs] = await Promise.all([
      prisma.logbookKkn.findMany({
        where: {
          ...logMhsWhere,
          tanggalKegiatan: { gte: rangeStart, lte: rangeEnd },
        },
        select: { tanggalKegiatan: true },
      }),
      prisma.logbookDpl.findMany({
        where: {
          ...logDplWhere,
          tanggal: { gte: rangeStart, lte: rangeEnd },
        },
        select: { tanggal: true },
      }),
    ]);

    const aktivitasChartData = sevenDays.map((day) => {
      const mhsCount = recentMhsLogs.filter((l) => {
        const dStr = new Date(l.tanggalKegiatan).toISOString().slice(0, 10);
        return dStr === day.dateStr;
      }).length;
      const dplCount = recentDplLogs.filter((l) => {
        const dStr = new Date(l.tanggal).toISOString().slice(0, 10);
        return dStr === day.dateStr;
      }).length;
      return {
        date: day.label,
        mahasiswa: mhsCount,
        dpl: dplCount,
      };
    });

    const aktivitasTerkini = {
      totalLogMahasiswa,
      totalLogDpl,
      chartData: aktivitasChartData,
    };

    // 14. Lini Masa Terkini (Real query dari tabel timeline_kkn)
    const dbTimelines = await prisma.timelineKkn.findMany({
      where: {
        fase: { not: "Pra-Kegiatan" },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    });

    const liniMasaTerkini = dbTimelines.map((t) => {
      const isActive = t.statusPelaksanaan === "SEDANG_BERJALAN";
      const isCompleted = t.statusPelaksanaan === "SELESAI";
      return {
        id: t.id,
        title: t.kegiatanUtama,
        dateRange: `${t.tahapMinggu} • ${t.tanggal}`,
        status: isActive ? "Sedang Berlangsung" : isCompleted ? "Selesai" : "Akan Datang",
        badgeType: isActive ? "active" : isCompleted ? "completed" : "upcoming",
      };
    });

    // 15. Resume Aktivitas DPL (Ringkasan Statistik Keaktifan DPL sesuai Notulensi A.4)
    const dplLogbookStats = await prisma.logbookDpl.groupBy({
      by: ["dplId"],
      where: logDplWhere,
      _count: { id: true },
      _sum: { durasiMenit: true },
    });

    const activeDplIdSet = new Set(dplLogbookStats.map((d) => d.dplId));
    const dplAktifCount = activeDplIdSet.size;
    const persentaseKeaktifanDpl = totalDpl > 0 ? Math.round((dplAktifCount / totalDpl) * 100) : 0;

    const kunjunganCount = await prisma.logbookDpl.count({
      where: {
        ...logDplWhere,
        kategori: { contains: "Kunjungan", mode: "insensitive" },
      },
    });

    const totalDurasiBimbinganMenit = dplLogbookStats.reduce(
      (acc, curr) => acc + (curr._sum.durasiMenit || 0),
      0
    );
    const totalDurasiBimbinganJam = Math.round(totalDurasiBimbinganMenit / 60);
    const rerataBimbinganPerDpl = dplAktifCount > 0 ? Math.round((totalDurasiBimbinganJam / dplAktifCount) * 10) / 10 : 0;

    const recentDplLogEntries = await prisma.logbookDpl.findMany({
      where: logDplWhere,
      orderBy: { tanggal: "desc" },
      take: 4,
      include: {
        dpl: { select: { name: true, nip: true } },
        kelompok: { select: { name: true, kelurahan: true } },
      },
    });

    // Map kelompok per DPL untuk detail list
    const dplGroupsMap = new Map<string, Array<{ id: string; name: string; kelurahan: string; cakupanRw: any }>>();
    kelompokList.forEach((k) => {
      if (k.dplId && realDplMap.has(k.dplId)) {
        const list = dplGroupsMap.get(k.dplId) || [];
        list.push({
          id: k.id,
          name: k.name,
          kelurahan: k.kelurahan,
          cakupanRw: typeof k.cakupanRw === "object" ? JSON.stringify(k.cakupanRw) : String(k.cakupanRw ?? ""),
        });
        dplGroupsMap.set(k.dplId, list);
      }
    });

    const dplStatsMap = new Map(dplLogbookStats.map((s) => [s.dplId, s]));

    const dplTerisiList = uniqueDplIds
      .filter((id) => activeDplIdSet.has(id))
      .map((id) => {
        const u = realDplMap.get(id);
        const stats = dplStatsMap.get(id);
        const groups = dplGroupsMap.get(id) || [];
        const durasiJam = Math.round(((stats?._sum?.durasiMenit || 0) / 60) * 10) / 10;
        return {
          id,
          name: u?.name || "Dosen Pembimbing",
          nip: u?.nip || "-",
          phone: u?.phone || null,
          email: u?.email || null,
          programStudi: u?.programStudi || "-",
          totalLog: stats?._count?.id || 0,
          totalJam: durasiJam,
          kelompok: groups,
        };
      })
      .sort((a, b) => b.totalLog - a.totalLog || a.name.localeCompare(b.name));

    const dplKosongList = uniqueDplIds
      .filter((id) => !activeDplIdSet.has(id))
      .map((id) => {
        const u = realDplMap.get(id);
        const groups = dplGroupsMap.get(id) || [];
        return {
          id,
          name: u?.name || "Dosen Pembimbing",
          nip: u?.nip || "-",
          phone: u?.phone || null,
          email: u?.email || null,
          programStudi: u?.programStudi || "-",
          totalLog: 0,
          totalJam: 0,
          kelompok: groups,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const resumeDpl = {
      totalDpl,
      dplAktifCount,
      dplBelumAktifCount: Math.max(0, totalDpl - dplAktifCount),
      persentaseKeaktifan: persentaseKeaktifanDpl,
      totalLogDpl,
      totalKunjunganLapangan: kunjunganCount,
      totalDurasiBimbinganJam,
      rerataBimbinganPerDpl,
      dplTerisiList,
      dplKosongList,
      recentActivities: recentDplLogEntries.map((l) => ({
        id: l.id,
        dplName: l.dpl?.name || "DPL",
        nip: l.dpl?.nip || "-",
        kelompokName: l.kelompok?.name || "Kelompok KKN",
        kelurahan: l.kelompok?.kelurahan || "-",
        tanggal: new Date(l.tanggal).toISOString().slice(0, 10),
        kategori: l.kategori || "Bimbingan Lapangan",
        tempat: l.tempat || "Posko KKN",
        deskripsi: l.deskripsi || "",
        durasiMenit: l.durasiMenit ?? 120,
        waktuMulai: l.waktuMulai || null,
        waktuSelesai: l.waktuSelesai || null,
      })),
    };

    // 16. Perhatian Pimpinan (Real alerts dari database - diletakkan di bawah Top Cards)
    const countPendingProkerDb = await prisma.programKerjaKkn.count({
      where: { ...prokerWhere, status: "BELUM_DISETUJUI" },
    });
    const countRejectedProkerDb = await prisma.programKerjaKkn.count({
      where: {
        ...prokerWhere,
        OR: [{ status: "DITOLAK" }, { statusUsulan: "DITOLAK" }],
      },
    });

    // Hitung real kelompok di bawah ambang batas 60% (Presensi & Proker sesuai instruksi user: keduanya)
    const kelompokWithAtt = await prisma.kelompokKkn.findMany({
      where: {
        ...kelompokWhere,
        id: { in: kelompokIds },
      },
      select: {
        id: true,
        name: true,
        schedules: {
          select: {
            attendances: {
              select: { status: true, studentId: true },
            },
          },
        },
        programKerja: {
          select: {
            status: true,
            statusPelaksanaan: true,
          },
        },
      },
    });

    let under60AttendanceCount = 0;
    let under60ProkerCount = 0;

    kelompokWithAtt.forEach((k) => {
      // Presensi
      let totalAtt = 0;
      let hadirAtt = 0;
      k.schedules.forEach((s) => {
        s.attendances.forEach((a) => {
          if (!realStudentUserIdsSet.has(a.studentId)) return;
          totalAtt++;
          const st = (a.status || "").toUpperCase();
          if (st.includes("HADIR") || st === "BERLANGSUNG" || st === "SELESAI") {
            hadirAtt++;
          }
        });
      });
      const ratioAtt = totalAtt > 0 ? (hadirAtt / totalAtt) * 100 : 0;
      if (ratioAtt < 60) {
        under60AttendanceCount++;
      }

      // Proker Selesai
      const totalP = k.programKerja.length;
      const selesaiP = k.programKerja.filter(
        (p) => (p.statusPelaksanaan || "").toUpperCase() === "SELESAI" || (p.status || "").toUpperCase() === "SELESAI"
      ).length;
      const ratioP = totalP > 0 ? (selesaiP / totalP) * 100 : 0;
      if (ratioP < 60) {
        under60ProkerCount++;
      }
    });

    // 16.b Agregasi Alpa Real Database (Zero False Logic - Analisis Logika Manusia)
    // Total record baris log kehadiran alpa terakumulasi di lapangan (khusus mahasiswa aktual)
    const totalAlpaLogs = await prisma.activityAttendance.count({
      where: { ...attendanceWhere, status: "ALPA" },
    });

    // Agregasi jumlah alpa per mahasiswa secara riil
    const alpaPerStudent = await prisma.activityAttendance.groupBy({
      by: ["studentId"],
      where: { ...attendanceWhere, status: "ALPA" },
      _count: { id: true },
    });

    const uniqueStudentsEverAlpa = alpaPerStudent.length;

    // Filter mahasiswa alpa kritis (akumulasi alpa >= 3 kali tanpa keterangan)
    // Standar operasional KKN: >= 3x alpa memerlukan intervensi DPL & arahan pimpinan
    const criticalAlpaMap = new Map<string, number>();
    alpaPerStudent.forEach((item) => {
      if (item._count.id >= 3 && realStudentUserIdsSet.has(item.studentId)) {
        criticalAlpaMap.set(item.studentId, item._count.id);
      }
    });

    const kelompokMap = new Map(kelompokList.map((k) => [k.id, k]));

    const criticalAlpaStudents = students
      .filter((s) => criticalAlpaMap.has(s.userId) && !isTestStudent(s))
      .map((s) => {
        const k = kelompokMap.get(s.kelompokId || "");
        const d = k?.dplId ? realDplMap.get(k.dplId) : null;
        return {
          id: s.id,
          userId: s.userId,
          name: s.user?.name || "Mahasiswa",
          nim: s.nim || "-",
          jurusan: s.jurusan || "-",
          kelompokId: s.kelompokId,
          kelompokName: k?.name || "Kelompok KKN",
          kelurahan: k?.kelurahan || "-",
          dplName: d?.name || "DPL Belum Ditentukan",
          dplPhone: d?.phone || null,
          phone: s.noWa || s.user?.phone || null,
          alpaCount: criticalAlpaMap.get(s.userId) || 0,
        };
      })
      .filter((s) => !isTestKelompok({ name: s.kelompokName, dplNamaMentah: s.dplName }))
      .sort((a, b) => b.alpaCount - a.alpaCount);

    const countCriticalAlpaStudents = criticalAlpaStudents.length;

    const perhatianPimpinan = [
      {
        id: "alpa",
        count: countCriticalAlpaStudents,
        unit: "Mahasiswa",
        title: `${countCriticalAlpaStudents} Mahasiswa Tanpa Keterangan Kritis (≥ 3 Hari)`,
        subtitle: `${countCriticalAlpaStudents} mahasiswa akumulasi tanpa keterangan tinggi (dari ${totalAlpaLogs} total log insiden), butuh evaluasi DPL`,
        type: "danger",
        link: "/monitoring-kegiatan/presensi?filter=critical_alpa",
        metadata: {
          criticalStudentsCount: countCriticalAlpaStudents,
          totalAlpaLogs,
          uniqueStudentsEverAlpa,
        },
      },
      {
        id: "proker_pending",
        count: countPendingProkerDb,
        unit: "Proker",
        title: `${countPendingProkerDb} Usulan Program Kerja Belum Disetujui`,
        subtitle: "Menunggu telaah dan persetujuan DPL",
        type: "warning",
        link: "/pelaksanaan/program-kerja?statusUsulan=BELUM_DISETUJUI",
      },
      {
        id: "proker_ditolak",
        count: countRejectedProkerDb,
        unit: "Proker Ditolak",
        title: `${countRejectedProkerDb} Usulan Program Kerja Ditolak`,
        subtitle: "Memerlukan revisi dari kelompok mahasiswa",
        type: "danger",
        link: "/pelaksanaan/program-kerja?statusUsulan=DITOLAK",
      },
      {
        id: "low_attendance_group",
        count: under60AttendanceCount,
        unit: "Kelompok",
        title: `${under60AttendanceCount} Kelompok Presensi di Bawah 60%`,
        subtitle: "Perlu pembimbingan khusus dan evaluasi lapangan",
        type: "warning",
        link: "/monitoring-kegiatan/laporan-presensi?filter=under60",
      },
      {
        id: "low_proker_group",
        count: under60ProkerCount,
        unit: "Kelompok",
        title: `${under60ProkerCount} Kelompok Capaian Proker < 60%`,
        subtitle: "Progres pelaksanaan program kerja tertunda",
        type: "warning",
        link: "/pelaksanaan/program-kerja?filter=under60",
      },
    ];

    // Response Data Lengkap
    return {
      lastUpdated: new Date().toISOString(),
      summary: {
        totalWilayah: {
          kelurahanCount,
          rwCount,
          totalRwKecamatan,
          label: `${kelurahanCount} Kelurahan • ${rwCount} RW`,
        },
        totalKelompok: {
          count: totalKelompok,
          label: `${totalKelompok} Kelompok`,
        },
        totalMahasiswa: {
          count: totalMahasiswa,
          label: `${totalMahasiswa} Orang`,
        },
        totalDpl: {
          count: totalDpl,
          label: `${totalDpl} Dosen`,
        },
        rasioKehadiran: {
          percentage: rasioPercentage,
          totalHours: currentAvgHours,
          targetHours,
          remainingHours,
          label: `${rasioPercentage}%`,
          sublabel: `${currentAvgHours} dari target ${targetHours} jam`,
        },
      },
      sebaranProdi,
      distribusiSks,
      sebaranMahasiswaPerWilayah,
      sebaranDplPerWilayah,
      statusProker,
      presensiMahasiswa,
      rasioKehadiranTrend,
      aktivitasTerkini,
      liniMasaTerkini,
      perhatianPimpinan,
      criticalAlpaStudents,
      resumeDpl,
      filterOptions: {
        periodeOptions: [
          { value: "2026", label: "Periode KKN 2026" },
          { value: "ALL", label: "Semua Periode" },
        ],
        kelurahanOptions: [
          { value: "Semua Kelurahan", label: "Semua Kelurahan" },
          ...allKelurahans.map((k) => ({ value: k, label: `Kel. ${k}` })),
        ],
        kelompokOptions: [
          { value: "Semua Kelompok", label: "Semua Kelompok" },
          ...kelompokList.map((k) => ({ value: k.name, label: k.name, kelurahan: k.kelurahan || "" })),
        ],
        selectedKelurahan: filters.kelurahan || "Semua Kelurahan",
        selectedRw: filters.rw || "Semua RW",
        selectedKelompok: filters.kelompok || "Semua Kelompok",
        selectedPeriode: filters.periode || "2026",
      },
    };
  },

  /**
   * Ekspor Laporan Lengkap Dashboard Eksekutif KKN ke Spreadsheet Excel
   */
  async exportExecutiveReport(filters: KknExecutiveFilters = {}) {
    const data = await this.getExecutiveDashboard(filters);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Eksekutif
    const summaryRows = [
      ["LAPORAN EKSEKUTIF KKN PIMPINAN - BERSEKA"],
      ["Waktu Ekspor", new Date().toLocaleString("id-ID")],
      ["Filter Kelurahan", filters.kelurahan || "Semua Kelurahan"],
      ["Filter RW", filters.rw || "Semua RW"],
      ["Filter Kelompok", filters.kelompok || "Semua Kelompok"],
      [],
      ["METRIK UTAMA", "NILAI"],
      ["Jumlah Wilayah", data.summary.totalWilayah.label],
      ["Kelompok Mahasiswa", data.summary.totalKelompok.label],
      ["Total Mahasiswa", data.summary.totalMahasiswa.label],
      ["Total DPL", data.summary.totalDpl.label],
      ["Rasio Kehadiran", `${data.summary.rasioKehadiran.percentage}% (${data.summary.rasioKehadiran.sublabel})`],
      [],
      ["STATUS PROGRAM KERJA", "JUMLAH", "PERSENTASE"],
      ["Diusulkan", data.statusProker.diusulkan.count, `${data.statusProker.diusulkan.percentage}%`],
      ["Disetujui", data.statusProker.disetujui.count, `${data.statusProker.disetujui.percentage}%`],
      ["Sedang Dilaksanakan", data.statusProker.sedangDilaksanakan.count, `${data.statusProker.sedangDilaksanakan.percentage}%`],
      ["Selesai Dilaksanakan", data.statusProker.selesai.count, `${data.statusProker.selesai.percentage}%`],
      ["Total Program Kerja", data.statusProker.total, "100%"],
      [],
      ["PRESENSI MAHASISWA", "JUMLAH", "PERSENTASE"],
      ...data.presensiMahasiswa.breakdown.map((b) => [b.label, b.count, `${b.percentage}%`]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Eksekutif");

    // Sheet 2: Sebaran Prodi
    const prodiRows = [
      ["PROGRAM STUDI", "JUMLAH MAHASISWA"],
      ...data.sebaranProdi.map((p) => [p.name, p.count]),
    ];
    const wsProdi = XLSX.utils.aoa_to_sheet(prodiRows);
    XLSX.utils.book_append_sheet(wb, wsProdi, "Sebaran Prodi");

    // Sheet 3: Sebaran Wilayah
    const wilayahRows = [
      ["KELURAHAN", "JUMLAH MAHASISWA", "JUMLAH DPL"],
      ...data.sebaranMahasiswaPerWilayah.map((m) => {
        const dpl = data.sebaranDplPerWilayah.find((d) => d.kelurahan === m.kelurahan);
        return [m.kelurahan, m.count, dpl ? dpl.count : 0];
      }),
    ];
    const wsWilayah = XLSX.utils.aoa_to_sheet(wilayahRows);
    XLSX.utils.book_append_sheet(wb, wsWilayah, "Sebaran Wilayah");

    // Sheet 4: Perhatian Pimpinan
    const alertRows = [
      ["INDIKATOR PERHATIAN PIMPINAN", "STATUS / JUMLAH", "SATUAN", "KETERANGAN"],
      ...data.perhatianPimpinan.map((a: any) => [a.title, a.count, a.unit || "Entitas", a.subtitle || ""]),
    ];
    const wsAlert = XLSX.utils.aoa_to_sheet(alertRows);
    XLSX.utils.book_append_sheet(wb, wsAlert, "Perhatian Pimpinan");

    // Sheet 5: Rincian Mahasiswa Tanpa Keterangan Kritis
    if (data.criticalAlpaStudents && data.criticalAlpaStudents.length > 0) {
      const criticalMhsRows = [
        ["NIM", "NAMA MAHASISWA", "PROGRAM STUDI", "KELOMPOK", "KELURAHAN", "DPL PENGAMPU", "NO TELEPON", "JUMLAH TANPA KETERANGAN"],
        ...data.criticalAlpaStudents.map((m: any) => [
          m.nim,
          m.name,
          m.jurusan,
          m.kelompokName,
          m.kelurahan,
          m.dplName,
          m.phone || "-",
          m.alpaCount,
        ]),
      ];
      const wsCritical = XLSX.utils.aoa_to_sheet(criticalMhsRows);
      XLSX.utils.book_append_sheet(wb, wsCritical, "Mahasiswa Tanpa Keterangan");
    }

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  },

  /**
   * Mengambil data fasilitas tata kelola sampah untuk tampilan peta GIS
   * Mengecualikan fasilitas jenis posko_kkn (bukan fasilitas tata kelola sampah)
   */
  async getWasteFacilitiesGis(filters: { kelurahan?: string; rw?: string } = {}) {
    // Normalisasi label Indonesia dari jenis fasilitas
    const namaJenisMap: Record<string, string> = {
      loseda: "Loseda/Proseda",
      bata_terawang: "Bata Terawang",
      rumah_maggot: "Rumah Maggot",
      bank_sampah: "Bank Sampah",
      tps: "TPS",
      buruan_sae: "Buruan SAE",
      poc: "POC",
    };

    // Bangun where clause untuk filter kelurahan (melalui relasi rw → kelurahan)
    const facilityWhere: any = {
      jenis: { not: "posko_kkn" },
    };

    if (filters.kelurahan) {
      const rawKel = filters.kelurahan.replace(/^Kel\.\s*/i, "").trim();
      if (rawKel && rawKel !== "ALL" && rawKel !== "Semua Kelurahan") {
        facilityWhere.rw = {
          kelurahan: {
            name: { contains: rawKel, mode: "insensitive" },
          },
        };
      }
    }

    const facilities = await prisma.facility.findMany({
      where: facilityWhere,
      select: {
        id: true,
        jenis: true,
        nama: true,
        alamat: true,
        latitude: true,
        longitude: true,
        statusApproval: true,
        pic: true,
        kontak: true,
        kapasitas: true,
        foto: true,
        rw: {
          select: {
            id: true,
            name: true,
            kelurahan: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { jenis: "asc" },
    });

    // Filter RW di memori jika ada filter RW
    let result = facilities;
    if (filters.rw) {
      const rawRw = filters.rw.trim();
      if (rawRw && rawRw !== "ALL" && rawRw !== "Semua RW") {
        const rwNum = parseInt(rawRw.replace(/\D/g, ""), 10);
        result = facilities.filter((f) => {
          if (!f.rw) return false;
          if (!isNaN(rwNum)) {
            const rwNumFromName = parseInt(f.rw.name.replace(/\D/g, ""), 10);
            return rwNumFromName === rwNum;
          }
          return f.rw.name.toLowerCase().includes(rawRw.toLowerCase());
        });
      }
    }

    return result.map((f) => ({
      id: f.id,
      jenis: f.jenis,
      namaJenis: namaJenisMap[f.jenis] ?? f.jenis,
      nama: f.nama,
      alamat: f.alamat ?? null,
      latitude: f.latitude ? Number(f.latitude) : null,
      longitude: f.longitude ? Number(f.longitude) : null,
      kelurahan: f.rw?.kelurahan?.name ?? null,
      rwNama: f.rw?.name ?? null,
      statusApproval: f.statusApproval,
      pic: f.pic ?? null,
      kontak: f.kontak ?? null,
      kapasitas: f.kapasitas ?? null,
      foto: f.foto ?? null,
    }));
  },

  /**
   * Mengambil data tempat sampah yang sudah teraktivasi (bukan status PRINTED)
   * Status teraktivasi: ASSIGNED_TO_PIC, ACTIVE_BOUND
   * Dikembalikan dengan informasi kelurahan dan RW
   */
  async getActivatedBinsBreakdown(filters: { kelurahan?: string; rw?: string } = {}) {
    // Status yang dianggap "teraktivasi" (bukan PRINTED/BROKEN/INACTIVE)
    const activatedStatuses = ["ASSIGNED_TO_PIC", "ACTIVE_BOUND"] as const;

    const binWhere: any = {
      status: { in: activatedStatuses },
    };

    // Filter kelurahan via relasi langsung kelurahanId → Kelurahan
    if (filters.kelurahan) {
      const rawKel = filters.kelurahan.replace(/^Kel\.\s*/i, "").trim();
      if (rawKel && rawKel !== "ALL" && rawKel !== "Semua Kelurahan") {
        binWhere.kelurahan = {
          name: { contains: rawKel, mode: "insensitive" },
        };
      }
    }

    // Filter RW via relasi rwId → Rw
    if (filters.rw) {
      const rawRw = filters.rw.trim();
      if (rawRw && rawRw !== "ALL" && rawRw !== "Semua RW") {
        const rwNum = parseInt(rawRw.replace(/\D/g, ""), 10);
        if (!isNaN(rwNum)) {
          binWhere.rw = {
            name: { contains: String(rwNum), mode: "insensitive" },
          };
        }
      }
    }

    const bins = await prisma.bin.findMany({
      where: binWhere,
      select: {
        id: true,
        qrCode: true,
        status: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        maxCapacityLiter: true,
        binType: true,
        category: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, phone: true },
        },
        registeredByStudent: {
          select: { id: true, name: true },
        },
        kelurahan: {
          select: { id: true, name: true },
        },
        rw: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: bins.length,
      bins: bins.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        kelurahan: b.kelurahan?.name ?? null,
        rwNama: b.rw?.name ?? null,
        status: b.status,
        statusBaku:
          b.status === "ACTIVE_BOUND"
            ? "AKTIF_TERPASANG"
            : b.status === "BROKEN"
              ? "RUSAK"
              : b.status === "INACTIVE"
                ? "NON_AKTIF"
                : "TERCETAK",
        statusDisplay:
          b.status === "ACTIVE_BOUND"
            ? "Aktif Terpasang"
            : b.status === "BROKEN"
              ? "Rusak"
              : b.status === "INACTIVE"
                ? "Tidak Aktif"
                : "Tercetak",
        deskripsiLokasi: null,
        tipeKepemilikan: b.user ? "RUMAH_TANGGA" : "KOMUNAL_RW",
        binType: b.binType ?? null,
        createdAt: b.createdAt,
        tanggalAktivasi: b.createdAt,
        latitude: b.latitude ? Number(b.latitude) : null,
        longitude: b.longitude ? Number(b.longitude) : null,
        kategoriNama: b.category?.name ?? null,
        pemilikNama: b.user?.name ?? null,
        pemilikPhone: b.user?.phone ?? null,
        pendaftarNama: b.registeredByStudent?.name ?? null,
        kapasitasLiter: b.maxCapacityLiter ? Number(b.maxCapacityLiter) : 25,
      })),
    };
  },

  /**
   * Menghitung tingkat kepatuhan per kelurahan berdasarkan data aktual Bin
   * Kepatuhan = persentase Bin berstatus ACTIVE_BOUND dari total Bin per kelurahan
   */
  async getComplianceOverlay(filters: { kelurahan?: string; rw?: string } = {}) {
    // Bangun filter kelurahan
    const kelurahanWhere: any = {};
    if (filters.kelurahan) {
      const rawKel = filters.kelurahan.replace(/^Kel\.\s*/i, "").trim();
      if (rawKel && rawKel !== "ALL" && rawKel !== "Semua Kelurahan") {
        kelurahanWhere.name = { contains: rawKel, mode: "insensitive" };
      }
    }

    // Ambil semua kelurahan yang punya Bin
    const kelurahanList = await prisma.kelurahan.findMany({
      where: kelurahanWhere,
      select: {
        id: true,
        name: true,
        bins: {
          where: filters.rw
            ? (() => {
                const rawRw = filters.rw.trim();
                if (rawRw && rawRw !== "ALL" && rawRw !== "Semua RW") {
                  const rwNum = parseInt(rawRw.replace(/\D/g, ""), 10);
                  if (!isNaN(rwNum)) {
                    return { rw: { name: { contains: String(rwNum), mode: "insensitive" } } };
                  }
                }
                return {};
              })()
            : {},
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Hanya kelurahan yang punya minimal 1 Bin
    const result = kelurahanList
      .filter((kel) => kel.bins.length > 0)
      .map((kel) => {
        const totalBin = kel.bins.length;
        const binAktif = kel.bins.filter((b) => b.status === "ACTIVE_BOUND").length;
        const persentaseAktif = totalBin > 0 ? Math.round((binAktif / totalBin) * 100) : 0;

        let tingkat: string;
        let warna: string;
        if (persentaseAktif >= 70) {
          tingkat = "TINGGI";
          warna = "#22c55e";
        } else if (persentaseAktif >= 40) {
          tingkat = "SEDANG";
          warna = "#eab308";
        } else {
          tingkat = "RENDAH";
          warna = "#ef4444";
        }

        return {
          kelurahan: kel.name,
          totalBin,
          binAktif,
          persentaseAktif,
          tingkat,
          warna,
        };
      });

    return result;
  },
};
