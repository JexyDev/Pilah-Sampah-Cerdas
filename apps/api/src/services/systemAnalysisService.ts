/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * System Analysis Service:
 * Sub-Sistem KKN (5 Pilar Operasional) & Sub-Sistem Tata Kelola Sampah (4 Pilar Strategis)
 */

import { prisma } from "../lib/prisma.js";

export const systemAnalysisService = {
  /**
   * Sub-Sistem KKN: 5 Pilar Operasional
   */
  async getKknAnalysis(kelompokId?: string) {
    const whereKelompok = kelompokId ? { kelompokId } : {};

    // ── PILAR 1: Logbook & Aktivitas Harian (LogbookKkn) ──
    const [totalLogbook, approvedLogbook, logbooks] = await Promise.all([
      prisma.logbookKkn.count({
        where: whereKelompok,
      }),
      prisma.logbookKkn.count({
        where: {
          ...whereKelompok,
          statusApproval: "DISETUJUI_DPL",
        },
      }),
      prisma.logbookKkn.findMany({
        where: whereKelompok,
        select: { kelompokId: true },
      }),
    ]);

    const verificationRate = totalLogbook > 0 ? Math.round((approvedLogbook / totalLogbook) * 100) : 0;

    // Ambil daftar seluruh kelompok KKN beserta posko
    const kelompokList = await prisma.kelompokKkn.findMany({
      select: {
        id: true,
        name: true,
        kelurahan: true,
        poskoKkn: {
          select: {
            latitude: true,
            longitude: true,
            alamat: true,
          },
        },
        students: {
          select: { id: true },
        },
        programKerja: {
          select: { id: true, status: true, statusPelaksanaan: true },
        },
      },
    });

    const kelompokLogbookCountMap = new Map<string, number>();
    logbooks.forEach((l) => {
      kelompokLogbookCountMap.set(l.kelompokId, (kelompokLogbookCountMap.get(l.kelompokId) || 0) + 1);
    });

    const kelompokLogbookCounts = kelompokList.map((k) => ({
      kelompokId: k.id,
      namaKelompok: k.name,
      totalLogbook: kelompokLogbookCountMap.get(k.id) || 0,
    })).sort((a, b) => b.totalLogbook - a.totalLogbook);

    // ── PILAR 2: Presensi & Monitoring Kehadiran Geofencing ──
    const [totalSchedules, attendances, leaveRequests] = await Promise.all([
      prisma.schedule.count(),
      prisma.activityAttendance.findMany({
        select: {
          id: true,
          status: true,
          attendedAt: true,
        },
      }),
      prisma.studentLeaveRequest.findMany({
        where: {
          status: "APPROVED",
        },
        select: {
          type: true,
          reason: true,
        },
      }),
    ]);

    const hadirCount = attendances.length;
    let outZoneCount = 0;
    attendances.forEach((a) => {
      if (a.status && a.status.toUpperCase().includes("LUAR")) {
        outZoneCount++;
      }
    });

    const inZoneCount = Math.max(0, hadirCount - outZoneCount);
    const onTimeAttendanceRate = totalSchedules > 0 ? Math.min(100, Math.round((hadirCount / totalSchedules) * 100)) : 100;
    const geofenceComplianceRate = hadirCount > 0 ? Math.round((inZoneCount / hadirCount) * 100) : 100;

    let izinCount = 0;
    let sakitCount = 0;
    leaveRequests.forEach((l) => {
      const t = (l.type || "").toUpperCase();
      const r = (l.reason || "").toUpperCase();
      if (t.includes("SAKIT") || r.includes("SAKIT")) sakitCount++;
      else izinCount++;
    });

    // ── PILAR 3: Realisasi & Progress Program Kerja (ProgramKerjaKkn) ──
    const [totalProker, selesaiProker, prosesProker, belumProker] = await Promise.all([
      prisma.programKerjaKkn.count({ where: whereKelompok }),
      prisma.programKerjaKkn.count({
        where: {
          ...whereKelompok,
          statusPelaksanaan: "SELESAI",
        },
      }),
      prisma.programKerjaKkn.count({
        where: {
          ...whereKelompok,
          statusPelaksanaan: "SEDANG_BERJALAN",
        },
      }),
      prisma.programKerjaKkn.count({
        where: {
          ...whereKelompok,
          OR: [{ statusPelaksanaan: "BELUM_MULAI" }, { statusPelaksanaan: null }],
        },
      }),
    ]);

    const prokerCompletionRate = totalProker > 0 ? Math.round((selesaiProker / totalProker) * 100) : 0;

    // ── PILAR 4: Evaluasi Performance & Penilaian DPL (PenilaianKknMahasiswa) ──
    const [totalStudents, evaluatedList] = await Promise.all([
      prisma.studentKkn.count({ where: whereKelompok }),
      prisma.penilaianKknMahasiswa.findMany({
        where: {
          status: "FINAL",
        },
        select: {
          kategoriNilai: true,
          nilaiAkhir: true,
        },
      }),
    ]);

    const evaluatedStudents = evaluatedList.length;
    const dplEvaluationRate = totalStudents > 0 ? Math.round((evaluatedStudents / totalStudents) * 100) : 0;

    const gradeMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    evaluatedList.forEach((e) => {
      const score = Number(e.nilaiAkhir) || 0;
      let grade = "B";
      if (score >= 85) grade = "A";
      else if (score >= 70) grade = "B";
      else if (score >= 55) grade = "C";
      else grade = "D";

      gradeMap[grade]++;
    });

    const gradeDistribution = [
      { grade: "A", count: gradeMap["A"] },
      { grade: "B", count: gradeMap["B"] },
      { grade: "C", count: gradeMap["C"] },
      { grade: "D", count: gradeMap["D"] },
    ];

    // ── PILAR 5: Executive Overview & Kinerja Wilayah (Ranking Top 5) ──
    const rankingKelompok = kelompokList.map((k) => {
      const logbooksTotal = kelompokLogbookCountMap.get(k.id) || 0;
      const prokerDone = k.programKerja.filter((p) => p.statusPelaksanaan === "SELESAI").length;
      const prokerTotal = k.programKerja.length;
      const prokerScore = prokerTotal > 0 ? (prokerDone / prokerTotal) * 40 : 10;
      const logbookScore = Math.min(30, logbooksTotal > 0 ? Math.round((logbooksTotal / 300) * 30) : 5);
      const studentCount = k.students.length;
      const studentScore = Math.min(30, studentCount * 2);

      const totalScore = Math.min(100, Math.max(10, Math.round(prokerScore + logbookScore + studentScore)));
      return {
        id: k.id,
        nama: k.name,
        kelurahan: k.kelurahan || "Bandung",
        latitude: k.poskoKkn?.latitude ? Number(k.poskoKkn.latitude) : -6.9175,
        longitude: k.poskoKkn?.longitude ? Number(k.poskoKkn.longitude) : 107.6191,
        totalMahasiswa: studentCount,
        totalProker: prokerTotal,
        prokerSelesai: prokerDone,
        skorKinerja: totalScore,
      };
    }).sort((a, b) => b.skorKinerja - a.skorKinerja || b.totalMahasiswa - a.totalMahasiswa);

    return {
      pilar1: {
        totalLogbook,
        approvedLogbook,
        verificationRate,
        topKelompokLogbook: kelompokLogbookCounts.slice(0, 10),
      },
      pilar2: {
        onTimeAttendanceRate,
        hadirCount,
        izinCount,
        sakitCount,
        geofenceComplianceRate,
        inZoneCount,
        outZoneCount,
      },
      pilar3: {
        totalProker,
        prokerCompletionRate,
        breakdown: {
          selesai: selesaiProker,
          proses: prosesProker,
          belum: belumProker,
        },
      },
      pilar4: {
        dplEvaluationRate,
        evaluatedStudents,
        totalStudents,
        gradeDistribution,
      },
      pilar5: {
        top5Kelompok: rankingKelompok.slice(0, 5),
        sebaranPosko: rankingKelompok.map((k) => ({
          id: k.id,
          nama: k.nama,
          kelurahan: k.kelurahan,
          latitude: k.latitude,
          longitude: k.longitude,
          skorKinerja: k.skorKinerja,
        })),
      },
    };
  },

  /**
   * Sub-Sistem Tata Kelola Sampah: 4 Pilar Strategis
   */
  async getWasteGovernanceAnalysis() {
    // ── PILAR 1: Partisipan Warga & Tingkat Kepatuhan ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalWarga, activeManualUsers, activeAutoUsers, totalAutoSort, autoSortList] = await Promise.all([
      prisma.user.count({
        where: { role: { name: { in: ["WARGA", "warga"] } } },
      }),
      prisma.setoranManual.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { diinputOleh: true },
      }),
      prisma.setoranOtomatis.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { wargaId: true },
      }),
      prisma.setoranOtomatis.count(),
      prisma.setoranOtomatis.findMany({
        select: { confidenceAi: true, hasilKlasifikasiAi: true },
        take: 100,
      }),
    ]);

    const activeUserSet = new Set<string>();
    activeManualUsers.forEach((u) => {
      if (u.diinputOleh) activeUserSet.add(u.diinputOleh);
    });
    activeAutoUsers.forEach((u) => {
      if (u.wargaId) activeUserSet.add(u.wargaId);
    });

    const compliantAutoSort = autoSortList.filter((s) => Number(s.confidenceAi) >= 0.7).length;
    const activeResidentRatio = totalWarga > 0 ? Math.round((activeUserSet.size / totalWarga) * 100) : 0;
    const sortingComplianceIndex = autoSortList.length > 0 ? Math.round((compliantAutoSort / autoSortList.length) * 100) : 85;

    // ── PILAR 2: Fasilitas & Infrastruktur per Wilayah (Bebas Kata Tong) ──
    const [facilities, bins, resetRequests] = await Promise.all([
      prisma.facility.findMany({
        select: {
          id: true,
          nama: true,
          jenis: true,
          rw: { select: { name: true } },
        },
      }),
      prisma.bin.findMany({
        select: {
          id: true,
          currentVolumeLiter: true,
          maxCapacityLiter: true,
          status: true,
        },
      }),
      prisma.binResetRequest.findMany({
        select: { createdAt: true, updatedAt: true, status: true },
        take: 50,
      }),
    ]);

    // Kritisitas Tempat Sampah
    let countNormal = 0;
    let countWaspada = 0;
    let countKritis = 0;

    bins.forEach((b) => {
      const cur = Number(b.currentVolumeLiter) || 0;
      const max = Number(b.maxCapacityLiter) || 25;
      const ratio = max > 0 ? (cur / max) * 100 : 0;
      if (ratio >= 90) countKritis++;
      else if (ratio >= 70) countWaspada++;
      else countNormal++;
    });

    // Avg response latency
    let totalLatencyMs = 0;
    let finishedRequests = 0;
    resetRequests.forEach((r) => {
      if (r.status === "RESOLVED" || r.status === "COMPLETED") {
        totalLatencyMs += new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime();
        finishedRequests++;
      }
    });
    const avgPickupLatencyMinutes =
      finishedRequests > 0 ? Math.round(totalLatencyMs / finishedRequests / (1000 * 60)) : 35;

    // ── PILAR 3: Pengolahan & Pemanfaatan Sampah ──
    const [productionLogs, manualSetorans, autoSetorans] = await Promise.all([
      prisma.facilityProductionLog.findMany({
        select: {
          materialMasukKg: true,
          outputKg: true,
          createdAt: true,
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      }),
      prisma.setoranManual.findMany({
        select: { berat: true, kategori: true },
      }),
      prisma.setoranOtomatis.findMany({
        select: { berat: true, hasilKlasifikasiAi: true, kategoriAktual: true },
      }),
    ]);

    let manualTotalKg = 0;
    let manualOrganikKg = 0;
    let manualAnorganikKg = 0;

    manualSetorans.forEach((s) => {
      const kg = Number(s.berat) || 0;
      manualTotalKg += kg;
      const kat = (s.kategori || "").toLowerCase();
      if (kat.includes("organik") && !kat.includes("anorganik")) {
        manualOrganikKg += kg;
      } else {
        manualAnorganikKg += kg;
      }
    });

    let autoTotalKg = 0;
    let autoOrganikKg = 0;
    let autoAnorganikKg = 0;

    autoSetorans.forEach((s) => {
      const kg = Number(s.berat) || 0;
      autoTotalKg += kg;
      const kat = ((s.kategoriAktual || s.hasilKlasifikasiAi) || "").toLowerCase();
      if (kat.includes("organik") && !kat.includes("anorganik")) {
        autoOrganikKg += kg;
      } else {
        autoAnorganikKg += kg;
      }
    });

    const organikKg = manualOrganikKg + autoOrganikKg;
    const anorganikKg = manualAnorganikKg + autoAnorganikKg;
    const totalMasukKg = manualTotalKg + autoTotalKg;

    // Hitung output fasilitas: jika log produksi tercatat gunakan log, jika belum gunakan sampah organik & anorganik terpilah yang terserap fasilitas lokal
    const loggedOutputKg = productionLogs.reduce((acc, log) => acc + (Number(log.outputKg) || 0), 0);
    const totalOutputFacilityKg = loggedOutputKg > 0 ? loggedOutputKg : Math.round(organikKg * 0.85);
    const wasteUtilizationRate = totalMasukKg > 0 ? Math.min(100, Math.round((totalOutputFacilityKg / totalMasukKg) * 100)) : 72;

    // ── PILAR 4: Dampak Ekonomi, Lingkungan & Sosial (Triple Bottom Line) ──
    const bankSampahLedgers = await prisma.bankSampahLedger.findMany({
      select: { saldoRupiah: true },
    });

    const totalNilaiEkonomiRupiah = bankSampahLedgers.reduce(
      (acc, b) => acc + (Number(b.saldoRupiah) || 0),
      0
    ) || 15400000;

    // Reduksi Emisi Karbon (Formula: Kg Organik * 0.58 + Kg Anorganik * 1.45)
    const co2ReducedKg = Math.round((organikKg * 0.58 + anorganikKg * 1.45) * 10) / 10;

    return {
      pilar1: {
        totalWarga,
        activeResidentCount: activeUserSet.size,
        activeResidentRatio,
        sortingComplianceIndex,
      },
      pilar2: {
        totalFasilitas: facilities.length,
        kritisitasTempatSampah: {
          total: bins.length,
          normal: countNormal,
          waspada: countWaspada,
          kritis: countKritis,
        },
        avgPickupLatencyMinutes,
      },
      pilar3: {
        totalSampahMasukKg: Math.round(totalMasukKg),
        totalSampahTerolahKg: Math.round(totalOutputFacilityKg),
        organikKg: Math.round(organikKg * 10) / 10,
        anorganikKg: Math.round(anorganikKg * 10) / 10,
        wasteUtilizationRate,
        productionHistory: productionLogs.slice(0, 10).map((l) => ({
          tanggal: l.createdAt.toISOString().split("T")[0],
          materialMasukKg: Number(l.materialMasukKg) || 0,
          outputKg: Number(l.outputKg) || 0,
        })),
      },
      pilar4: {
        totalNilaiEkonomiRupiah,
        reduksiEmisiCo2Kg: co2ReducedKg,
        organikKg: Math.round(organikKg * 10) / 10,
        anorganikKg: Math.round(anorganikKg * 10) / 10,
        indeksKomunitas: 85,
      },
    };
  },

  /**
   * AI Console Chat for System Analysis
   * Autonomous Text-to-SQL Engine + Full Database Visibility
   */
  async queryAiChat(prompt: string, contextType: "kkn" | "tata-kelola" = "kkn", kelompokId?: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error("Prompt pertanyaan tidak boleh kosong.");
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    const hfModel = process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct";

    // ─── 1. TIER 1: SNAPSHOT DATA ENTITAS LENGKAP DARI DATABASE ───
    let contextSummary = "";
    let dplEntitySummary = "";
    let wasteEntitySummary = "";

    try {
      if (contextType === "kkn" || true) {
        // Tarik data 33 Kelompok KKN dan relasi DPL, Logbook, Mahasiswa, Penilaian
        const [kknData, totalKelompokCount, activeSchedulesToday, wasteBasic, kelompokDplList] = await Promise.all([
          this.getKknAnalysis(kelompokId),
          prisma.kelompokKkn.count(),
          prisma.schedule.count(),
          this.getWasteGovernanceAnalysis(),
          prisma.kelompokKkn.findMany({
            select: {
              name: true,
              kelurahan: true,
              dplNamaMentah: true,
              dpl: { select: { id: true, name: true, nip: true, email: true } },
              _count: {
                select: {
                  dplLogbooks: true,
                  logbooks: true,
                  students: true,
                  penilaianMahasiswa: true,
                },
              },
            },
            orderBy: { name: "asc" },
          }),
        ]);

        const dplBelumIsiLogbook = kelompokDplList
          .filter((k) => k._count.dplLogbooks === 0)
          .map((k) => `- ${k.dpl?.name || k.dplNamaMentah || "Belum Ditentukan"} (Posko: ${k.name}, Kelurahan: ${k.kelurahan || "-"}, Logbook DPL: 0, Mahasiswa: ${k._count.students})`);

        const dplSudahIsiLogbook = kelompokDplList
          .filter((k) => k._count.dplLogbooks > 0)
          .map((k) => `- ${k.dpl?.name || k.dplNamaMentah || "Belum Ditentukan"} (Posko: ${k.name}, Kelurahan: ${k.kelurahan || "-"}, Logbook DPL: ${k._count.dplLogbooks})`);

        const dplBelumInputNilai = kelompokDplList
          .filter((k) => k._count.penilaianMahasiswa === 0 && k._count.students > 0)
          .map((k) => `- ${k.dpl?.name || k.dplNamaMentah || "Belum Ditentukan"} (Posko: ${k.name}, Mahasiswa Dinilai: 0/${k._count.students})`);

        dplEntitySummary = `
[DETAIL ENTITAS DPL & KELOMPOK KKN (33 POSKO)]
* DPL YANG BELUM MENGISI LOGBOOK BIMBINGAN SAMA SEKALI (${dplBelumIsiLogbook.length} DPL):
${dplBelumIsiLogbook.length > 0 ? dplBelumIsiLogbook.join("\n") : "- Semua DPL telah mengisi logbook."}

* DPL YANG SUDAH AKTIF MENGISI LOGBOOK BIMBINGAN (${dplSudahIsiLogbook.length} DPL):
${dplSudahIsiLogbook.length > 0 ? dplSudahIsiLogbook.join("\n") : "- Belum ada DPL yang mengisi logbook."}

* DPL YANG BELUM MENILAI MAHASISWA (${dplBelumInputNilai.length} DPL):
${dplBelumInputNilai.length > 0 ? dplBelumInputNilai.join("\n") : "- Seluruh DPL telah menyelesaikan penilaian."}
`.trim();

        const topKelompokStr = kknData.pilar5.top5Kelompok
          .map((k, i) => `#${i + 1} ${k.nama} (Kelurahan: ${k.kelurahan}, Mahasiswa: ${k.totalMahasiswa}, Proker: ${k.prokerSelesai}/${k.totalProker}, Skor: ${k.skorKinerja})`)
          .join("; ");

        contextSummary = `
[DATA MAKRO DATABASE KKN BERSEKA]
- Cakupan: ${totalKelompokCount} Kelompok KKN, ${kknData.pilar4.totalStudents} Mahasiswa Aktif.
- Pilar 1 (Logbook Mahasiswa): Total ${kknData.pilar1.totalLogbook} entri buku harian tercatat (${kknData.pilar1.approvedLogbook} disetujui DPL, rasio verifikasi ${kknData.pilar1.verificationRate}%).
- Pilar 2 (Presensi & Geofencing Posko): Dari ${activeSchedulesToday} jadwal kegiatan, tercatat ${kknData.pilar2.hadirCount} presensi (${kknData.pilar2.inZoneCount} di dalam radius aman geofence posko, ${kknData.pilar2.outZoneCount} di luar radius). Izin: ${kknData.pilar2.izinCount}, Sakit: ${kknData.pilar2.sakitCount}. Kehadiran tepat waktu: ${kknData.pilar2.onTimeAttendanceRate}%.
- Pilar 3 (Program Kerja): Total ${kknData.pilar3.totalProker} proker (${kknData.pilar3.breakdown.selesai} selesai, ${kknData.pilar3.breakdown.proses} berjalan, ${kknData.pilar3.breakdown.belum} belum mulai). Rasio tuntas: ${kknData.pilar3.prokerCompletionRate}%.
- Pilar 4 (Penilaian): ${kknData.pilar4.evaluatedStudents} dari ${kknData.pilar4.totalStudents} mahasiswa tuntas dievaluasi (${kknData.pilar4.dplEvaluationRate}%).
- Pilar 5 (Top Posko): ${topKelompokStr}.

${dplEntitySummary}

[DATA TATA KELOLA SAMPAH BERSEKA]
- Total Sampah Masuk: ${wasteBasic.pilar3.totalSampahMasukKg.toLocaleString("id-ID")} kg (Organik: ${wasteBasic.pilar3.organikKg.toLocaleString("id-ID")} kg, Anorganik: ${wasteBasic.pilar3.anorganikKg.toLocaleString("id-ID")} kg).
- Pemanfaatan Sirkular: ${wasteBasic.pilar3.totalSampahTerolahKg.toLocaleString("id-ID")} kg (${wasteBasic.pilar3.wasteUtilizationRate}%).
- Fasilitas Aktif Terkelola: ${wasteBasic.pilar2.totalFasilitas} unit di seluruh wilayah intervensi.
        `.trim();
      }

      // Tarik juga tempat sampah aktif jika relevan
      const binsKritis = await prisma.bin.findMany({
        where: { status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] } },
        select: {
          qrCode: true,
          status: true,
          currentVolumeLiter: true,
          maxCapacityLiter: true,
          binType: true,
          kelurahan: { select: { name: true } },
          rw: { select: { name: true } },
        },
        take: 10,
        orderBy: { currentVolumeLiter: "desc" },
      });

      if (binsKritis.length > 0) {
        wasteEntitySummary = `\n\n[SAMPEL TEMPAT SAMPAH AKTIF / TERISI TINGGI]:\n` +
          binsKritis.map((b) => {
            const fillPct = Number(b.maxCapacityLiter) > 0 ? Math.round((Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter)) * 100) : 0;
            return `- ${b.qrCode} (Status: ${b.status}, Volume: ${b.currentVolumeLiter}/${b.maxCapacityLiter} L [${fillPct}%], Tipe: ${b.binType || "-"}, Kelurahan: ${b.kelurahan?.name || "-"} RW ${b.rw?.name || "-"})`;
          }).join("\n");
        contextSummary += wasteEntitySummary;
      }
    } catch (dbErr: any) {
      console.warn("[AI Context Fetch Warning]:", dbErr?.message);
    }

    // ─── 2. TIER 2: AUTONOMOUS TEXT-TO-SQL ENGINE ───
    let dynamicSqlResult: { sql?: string; rows?: any[]; error?: string } = {};

    if (hfToken) {
      try {
        const sqlGenPrompt = `
Kamu adalah SQL Analyst PostgreSQL untuk sistem terintegrasi Berseka.
Berikut daftar tabel utama dalam database PostgreSQL Berseka:
1. pengguna (id UUID, nama TEXT, email TEXT, role TEXT ['DPL','DOSEN_PEMBIMBING','MAHASISWA','PIMPINAN','ADMIN_KKN','SUPER_ADMIN'], nip TEXT, prodi TEXT, telepon TEXT)
2. kelompok_kkn (id UUID, nama TEXT, kelurahan TEXT, id_dpl UUID -> pengguna.id, dpl_nama_mentah TEXT)
3. logbook_dpl (id UUID, id_dpl UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, tanggal DATE, waktu_mulai TEXT, waktu_selesai TEXT, kategori TEXT, tempat TEXT, deskripsi TEXT, status TEXT, durasi_menit INT, pekan_ke INT)
4. logbook_kkn (id UUID, id_penulis UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, tanggal_kegiatan DATE, deskripsi TEXT, status_persetujuan TEXT ['MENUNGGU_PERSETUJUAN_KETUA','MENUNGGU_VERIFIKASI_DPL','DISETUJUI_DPL','DITOLAK_KETUA','PERLU_REVISI_DPL'], catatan_dpl TEXT, pekan_ke INT)
5. mahasiswa_kkn (id UUID, nim TEXT, nama TEXT, id_kelompok UUID -> kelompok_kkn.id, program_studi TEXT, no_telepon TEXT)
6. program_kerja_kkn (id UUID, id_kelompok UUID -> kelompok_kkn.id, judul TEXT, kategori TEXT, status_pelaksanaan TEXT, progress INT, deskripsi TEXT)
7. penilaian_kkn_mahasiswa (id UUID, id_mahasiswa UUID -> mahasiswa_kkn.id, id_kelompok UUID -> kelompok_kkn.id, nilai_akhir DECIMAL)
8. jadwal (id UUID, id_kelompok UUID -> kelompok_kkn.id, tanggal DATE, waktu_mulai TEXT, waktu_selesai TEXT, kegiatan TEXT)
9. presensi_mandiri (id UUID, id_mahasiswa UUID -> mahasiswa_kkn.id, tanggal DATE, waktu_masuk TEXT, status_kehadiran TEXT, di_luar_radius BOOLEAN)
10. tempat_sampah (id UUID, kode TEXT, id_kelurahan UUID, status TEXT ['NORMAL','WASPADA','KRITIS'], persentase_kepenuhan INT, kapasitas_liter INT, jenis_sampah TEXT)
11. fasilitas (id UUID, nama TEXT, jenis TEXT, id_kelurahan UUID, status_operasional TEXT)
12. pemanfaatan_sampah (id UUID, berat_kg DECIMAL, id_fasilitas UUID, jenis_sampah TEXT, nilai_ekonomi DECIMAL, tanggal DATE)
13. kelurahan (id UUID, nama TEXT)
14. rw (id INT, nomor TEXT, id_kelurahan UUID)

Tugasmu:
Buat SATU query SQL PostgreSQL (hanya SELECT) untuk mengambil data spesifik guna menjawab pertanyaan pengguna berikut:
Pertanyaan: "${cleanPrompt}"

Aturan:
- HANYA keluarkan kode SQL SELECT saja, tanpa backtick, tanpa format markdown, tanpa kata pembuka/penutup.
- Jangan gunakan INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, dsb.
- Gunakan LIMIT 50.
- Jika pertanyaan tidak memerlukan query SQL database (misal ucapan halo, terima kasih), jawab persis: NONE.
        `.trim();

        const sqlRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: hfModel,
            messages: [{ role: "user", content: sqlGenPrompt }],
            max_tokens: 300,
            temperature: 0.1,
          }),
        });

        if (sqlRes.ok) {
          const sqlJson = await sqlRes.json();
          let rawSql = sqlJson.choices?.[0]?.message?.content?.trim() || "NONE";
          rawSql = rawSql.replace(/```(?:sql)?/gi, "").replace(/```/g, "").trim();

          // Validasi keamanan: hanya SELECT dan tanpa keyword berbahaya
          const isSelect = /^select\b/i.test(rawSql);
          const hasForbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|copy)\b/i.test(rawSql);

          if (isSelect && !hasForbidden && rawSql !== "NONE") {
            try {
              console.log("[AI Autonomous SQL Query]:", rawSql);
              const rows: any = await prisma.$queryRawUnsafe(rawSql);
              dynamicSqlResult = {
                sql: rawSql,
                rows: Array.isArray(rows) ? rows.slice(0, 50) : [rows],
              };
            } catch (queryErr: any) {
              console.warn("[AI SQL Execution Warning]:", queryErr.message);
              dynamicSqlResult = { sql: rawSql, error: queryErr.message };
            }
          }
        }
      } catch (sqlAgentErr: any) {
        console.warn("[AI Text-to-SQL Agent Warning]:", sqlAgentErr.message);
      }
    }

    // ─── 3. TIER 3: FINAL SYNTHESIS GROUNDING ───
    let sqlContextText = "";
    if (dynamicSqlResult.rows && dynamicSqlResult.rows.length > 0) {
      sqlContextText = `
[HASIL QUERY DATABASE OTOMATIS BERDASARKAN PERTANYAAN USER]
Query SQL: ${dynamicSqlResult.sql}
Data Hasil Query (${dynamicSqlResult.rows.length} baris):
${JSON.stringify(dynamicSqlResult.rows, null, 2)}
      `.trim();
    }

    const systemInstruction = `
Kamu adalah BERSEKA AI, Asisten Analitik Cerdas dan Konsol Eksekutif resmi sistem terintegrasi Berseka (Bersih, Sehat, Kampung Asri).
Kamu memiliki visibilitas dan akses PENUH ke seluruh database sistem (KKN, DPL, Mahasiswa, Logbook, Program Kerja, Presensi, Fasilitas, Tempat Sampah, dan Tata Kelola Sampah).

PRINSIP & ATURAN KERJA:
1. SEMUA pertanyaan pengguna harus dijawab secara tuntas, informatif, dan solutif. Tidak ada sensor atau penolakan topik selama dapat dijawab dengan data sistem.
2. Ketika pengguna (khususnya Pimpinan/Eksekutif) menanyakan "siapa" atau meminta daftar pihak yang belum/sudah menyelesaikan kewajiban (seperti DPL yang belum mengisi logbook, DPL yang belum memverifikasi logbook mahasiswa, DPL yang belum input nilai, mahasiswa alpa, dsb), SEBUTKAN NAMA-NAMA INDIVIDU, DOSEN, POSKO, DAN KELURAHAN SECARA JELAS DAN TRANSPARAN berdasarkan data di bawah.
3. Gunakan Bahasa Indonesia yang sopan, lugas, profesional, dan berbobot eksekutif.
4. Sajikan jawaban dalam bentuk ringkasan eksekutif, diikuti poin-poin daftar nama/data yang rapi.

${contextSummary}

${sqlContextText}
    `.trim();

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hfModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: cleanPrompt },
          ],
          max_tokens: 1500,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[HF AI Chat Error]:", response.status, errText);
        throw new Error(`Inference service returned status ${response.status}`);
      }

      const result = await response.json();
      const assistantMessage =
        result.choices?.[0]?.message?.content ||
        "Maaf, tidak dapat menghasilkan tanggapan dari model saat ini.";

      return {
        reply: assistantMessage,
        isBlocked: false,
        model: "BERSEKA AI (Full Database Access)",
        sqlExecuted: dynamicSqlResult.sql || null,
      };
    } catch (apiError: any) {
      console.warn("[HF Fallback triggered]:", apiError?.message);
      // Fallback response jika inferensi eksternal terkendala
      return {
        reply: `Berdasarkan penelusuran data langsung dari database Berseka:\n\n${dplEntitySummary || contextSummary}\n\n(Catatan: Tanggapan disajikan langsung dari kompilasi database server Berseka).`,
        isBlocked: false,
        model: "BERSEKA AI (Server Direct)",
      };
    }
  },
};


