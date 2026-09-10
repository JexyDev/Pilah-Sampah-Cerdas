import { prisma } from "../lib/prisma.js";
import * as XLSX from "xlsx";

export interface KknExecutiveFilters {
  kelurahan?: string;
  rw?: string;
  periode?: string;
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
      },
    });

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

    const kelompokIds = kelompokList.map((k) => k.id);

    // 2. Total Kelompok
    const totalKelompok = kelompokList.length;

    // 3. Total DPL
    const uniqueDplIds = Array.from(new Set(kelompokList.map((k) => k.dplId).filter(Boolean))) as string[];
    const totalDpl = uniqueDplIds.length;

    // 4. Mahasiswa KKN
    const studentWhere: any = {};
    if (kelompokIds.length > 0) {
      studentWhere.kelompokId = { in: kelompokIds };
    } else if (isFilteredKel || isFilteredRw) {
      studentWhere.kelompokId = "__none__";
    }

    const students = await prisma.studentKkn.findMany({
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
      },
    });

    const totalMahasiswa = students.length;

    // 5. Total Wilayah (Kelurahan & RW)
    const allKelurahans = ["Cipaganti", "Dago", "Lebakgede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];
    const distinctRws = new Set<string>();
    kelompokList.forEach((k) => {
      if (Array.isArray(k.cakupanRw)) {
        k.cakupanRw.forEach((rw) => distinctRws.add(String(rw)));
      }
    });

    const kelurahanCount = isFilteredKel ? (kelompokList.length > 0 ? 1 : 0) : 6;
    const rwCount = isFilteredRw ? (kelompokList.length > 0 ? 1 : 0) : distinctRws.size;

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
    const sksCounts: Record<string, { sks: number; count: number; label: string }> = {};

    const COLOR_PALETTE: Record<number, string> = {
      0: "#94a3b8",  // Slate - Non-Konversi / Reguler
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

    students.forEach((s: any) => {
      const sksVal = s.sks && s.sks > 0 ? Number(s.sks) : 0;
      const key = String(sksVal);
      if (!sksCounts[key]) {
        sksCounts[key] = {
          sks: sksVal,
          count: 0,
          label: sksVal > 0 ? `${sksVal} SKS` : "Reguler (0 SKS)",
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
        percentage: totalMahasiswa > 0 ? Math.round((item.count / totalMahasiswa) * 100) : 0,
        color: COLOR_PALETTE[item.sks] || "#0284c7",
      }));

    const distribusiSks = {
      totalMahasiswa,
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

    prokerList.forEach((p) => {
      // 1. Dimensi Status Usulan (Mandiri & Terpisah: Disetujui, Belum Disetujui, Ditolak)
      const stUsulan = (p.statusUsulan || "").toUpperCase();
      const stUtama = (p.status || "").toUpperCase();

      if (stUsulan === "DITOLAK" || stUtama === "DITOLAK") {
        usulanDitolak++;
      } else if (
        stUsulan === "DISETUJUI" ||
        stUtama === "DITERIMA" ||
        stUtama === "SEDANG_BERJALAN" ||
        stUtama === "SELESAI"
      ) {
        usulanDisetujui++;
      } else {
        usulanBelumDisetujui++;
      }

      // 2. Dimensi Status Pelaksanaan (Belum, Sedang Berjalan, Selesai)
      const stPelaksanaan = (p.statusPelaksanaan || "").toUpperCase();
      if (stPelaksanaan === "SELESAI" || stUtama === "SELESAI") {
        pelaksanaanSelesai++;
      } else if (stPelaksanaan === "SEDANG_BERJALAN" || stUtama === "SEDANG_BERJALAN") {
        pelaksanaanSedangBerjalan++;
      } else {
        pelaksanaanBelum++;
      }
    });

    const totalProker = prokerList.length;
    const pctUsulanDisetujui = totalProker > 0 ? Math.round((usulanDisetujui / totalProker) * 100) : 0;
    const pctUsulanBelumDisetujui = totalProker > 0 ? Math.round((usulanBelumDisetujui / totalProker) * 100) : 0;
    const pctUsulanDitolak = totalProker > 0 ? Math.max(0, 100 - pctUsulanDisetujui - pctUsulanBelumDisetujui) : 0;

    const pctPelaksanaanBelum = totalProker > 0 ? Math.round((pelaksanaanBelum / totalProker) * 100) : 0;
    const pctPelaksanaanSedangBerjalan = totalProker > 0 ? Math.round((pelaksanaanSedangBerjalan / totalProker) * 100) : 0;
    const pctPelaksanaanSelesai = totalProker > 0 ? Math.max(0, 100 - pctPelaksanaanBelum - pctPelaksanaanSedangBerjalan) : 0;

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
        total: totalProker,
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

    // Real 7-day activities (2 Sep - 8 Sep 2026)
    const sevenDays: { dateStr: string; label: string; start: Date; end: Date }[] = [];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(2026, 8, 8 - i);
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

    const resumeDpl = {
      totalDpl,
      dplAktifCount,
      dplBelumAktifCount: Math.max(0, totalDpl - dplAktifCount),
      persentaseKeaktifan: persentaseKeaktifanDpl,
      totalLogDpl,
      totalKunjunganLapangan: kunjunganCount,
      totalDurasiBimbinganJam,
      rerataBimbinganPerDpl,
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
      })),
    };

    // 16. Perhatian Pimpinan (Real alerts dari database - diletakkan di bawah Top Cards)
    const countAlpaDb = await prisma.activityAttendance.count({
      where: { ...attendanceWhere, status: "ALPA" },
    });
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
      where: kelompokWhere,
      select: {
        id: true,
        name: true,
        schedules: {
          select: {
            attendances: {
              select: { status: true },
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

    const perhatianPimpinan = [
      {
        id: "alpa",
        count: countAlpaDb,
        title: `${countAlpaDb} Mahasiswa Tanpa Keterangan`,
        subtitle: "Terdeteksi alpa dalam presensi lapangan",
        type: "danger",
        link: "/monitoring-kegiatan/presensi?filter=alpa",
      },
      {
        id: "proker_pending",
        count: countPendingProkerDb,
        title: `${countPendingProkerDb} Usulan Program Kerja Belum Disetujui`,
        subtitle: "Menunggu telaah dan persetujuan DPL",
        type: "warning",
        link: "/pelaksanaan/program-kerja?status=BELUM_DISETUJUI",
      },
      {
        id: "proker_ditolak",
        count: countRejectedProkerDb,
        title: `${countRejectedProkerDb} Usulan Program Kerja Ditolak`,
        subtitle: "Memerlukan revisi dari kelompok mahasiswa",
        type: "danger",
        link: "/pelaksanaan/program-kerja?status=DITOLAK",
      },
      {
        id: "low_attendance_group",
        count: under60AttendanceCount,
        title: `${under60AttendanceCount} Kelompok Presensi di Bawah 60%`,
        subtitle: "Perlu pendampingan khusus dan evaluasi lapangan",
        type: "warning",
        link: "/monitoring-kegiatan/laporan-presensi?filter=under60",
      },
      {
        id: "low_proker_group",
        count: under60ProkerCount,
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
        selectedKelurahan: filters.kelurahan || "Semua Kelurahan",
        selectedRw: filters.rw || "Semua RW",
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
      ["INDIKATOR PERHATIAN PIMPINAN", "STATUS / JUMLAH"],
      ...data.perhatianPimpinan.map((a) => [a.title, a.count]),
    ];
    const wsAlert = XLSX.utils.aoa_to_sheet(alertRows);
    XLSX.utils.book_append_sheet(wb, wsAlert, "Perhatian Pimpinan");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  },
};
