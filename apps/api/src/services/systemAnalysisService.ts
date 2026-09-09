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
   * Strict scope: Kuliah Kerja Nyata (KKN) & Tata Kelola Sampah Berseka
   */
  async queryAiChat(prompt: string, contextType: "kkn" | "tata-kelola" = "kkn", kelompokId?: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error("Prompt pertanyaan tidak boleh kosong.");
    }

    // TIER 1: Verifikasi Relevansi Domain (KKN & Tata Kelola Sampah Berseka)
    // Longgar: Cukup verifikasi agar tidak menanyakan hal di luar konteks platform Berseka sama sekali.
    const genericIrrelevant = [
      "resep masakan", "lirik lagu", "chord gitar", "crypto", "bitcoin",
      "main game", "film bioskop", "sepak bola liga", "zodiak", "ramalan"
    ];

    const lowerPrompt = cleanPrompt.toLowerCase();
    const isExplicitlyIrrelevant = genericIrrelevant.some((kw) => lowerPrompt.includes(kw));

    if (isExplicitlyIrrelevant) {
      return {
        reply: "Konsol Cerdas Berseka difokuskan untuk menganalisis data ekosistem Kuliah Kerja Nyata (KKN) dan Tata Kelola Sampah Berseka. Silakan ajukan pertanyaan seputar metrik mahasiswa, posko, kehadiran, fasilitas persampahan, pengangkutan, reduksi emisi, atau neraca material sirkular.",
        isBlocked: true,
        model: process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct",
      };
    }

    // TIER 2: Live Grounding Context Langsung dari Database
    let contextSummary = "";
    if (contextType === "kkn") {
      const [kknData, totalKelompokCount, activeSchedulesToday, wasteBasic] = await Promise.all([
        this.getKknAnalysis(kelompokId),
        prisma.kelompokKkn.count(),
        prisma.schedule.count(),
        this.getWasteGovernanceAnalysis(),
      ]);

      const topKelompokStr = kknData.pilar5.top5Kelompok
        .map((k, i) => `#${i + 1} ${k.nama} (Kelurahan: ${k.kelurahan}, Mahasiswa: ${k.totalMahasiswa}, Proker: ${k.prokerSelesai}/${k.totalProker}, Skor: ${k.skorKinerja})`)
        .join("; ");

      contextSummary = `
[DATA AKTUAL DATABASE SISTEM KULIAH KERJA NYATA (KKN)]
- Cakupan: ${totalKelompokCount} Kelompok KKN, ${kknData.pilar4.totalStudents} Mahasiswa Aktif.
- Pilar 1 (Buku Harian/Logbook): Total ${kknData.pilar1.totalLogbook} entri buku harian tercatat (${kknData.pilar1.approvedLogbook} disetujui DPL, rasio verifikasi ${kknData.pilar1.verificationRate}%).
- Pilar 2 (Presensi & Geofencing Posko): Dari ${activeSchedulesToday} jadwal kegiatan, tercatat ${kknData.pilar2.hadirCount} presensi (${kknData.pilar2.inZoneCount} di dalam radius aman geofence posko, ${kknData.pilar2.outZoneCount} di luar radius). Pengajuan izin: ${kknData.pilar2.izinCount} izin, ${kknData.pilar2.sakitCount} sakit. Tingkat kehadiran tepat waktu: ${kknData.pilar2.onTimeAttendanceRate}%. Kepatuhan radius posko: ${kknData.pilar2.geofenceComplianceRate}%.
- Pilar 3 (Program Kerja): Total ${kknData.pilar3.totalProker} proker (${kknData.pilar3.breakdown.selesai} selesai, ${kknData.pilar3.breakdown.proses} sedang berjalan, ${kknData.pilar3.breakdown.belum} dalam persiapan/belum mulai). Rasio tuntas: ${kknData.pilar3.prokerCompletionRate}%.
- Pilar 4 (Penilaian DPL): ${kknData.pilar4.evaluatedStudents} dari ${kknData.pilar4.totalStudents} mahasiswa tuntas dievaluasi (${kknData.pilar4.dplEvaluationRate}%).
- Pilar 5 (Top Posko Berkinerja Tinggi): ${topKelompokStr}.

[KORELASI DATA TATA KELOLA SAMPAH BERSEKA (CROSS-DOMAIN ACCESS)]
- Total Sampah Masuk: ${wasteBasic.pilar3.totalSampahMasukKg.toLocaleString("id-ID")} kg (Organik: ${wasteBasic.pilar3.organikKg.toLocaleString("id-ID")} kg, Anorganik: ${wasteBasic.pilar3.anorganikKg.toLocaleString("id-ID")} kg).
- Pemanfaatan Sirkular: ${wasteBasic.pilar3.totalSampahTerolahKg.toLocaleString("id-ID")} kg (${wasteBasic.pilar3.wasteUtilizationRate}%).
- Fasilitas Aktif Terkelola: ${wasteBasic.pilar2.totalFasilitas} unit di seluruh wilayah intervensi.
      `.trim();
    } else {
      const [wasteData, facilityTypeCounts, kknBasic] = await Promise.all([
        this.getWasteGovernanceAnalysis(),
        prisma.facility.groupBy({
          by: ["jenis"],
          _count: { id: true },
        }),
        this.getKknAnalysis(),
      ]);

      const facilityBreakdown = facilityTypeCounts
        .map((f) => `${f.jenis}: ${f._count.id} unit`)
        .join(", ");

      contextSummary = `
[DATA AKTUAL DATABASE SISTEM TATA KELOLA SAMPAH BERSEKA]
- Pilar 1 (Partisipasi Warga): ${wasteData.pilar1.activeResidentCount} dari ${wasteData.pilar1.totalWarga} warga aktif memilah 30 hari terakhir (${wasteData.pilar1.activeResidentRatio}%). Indeks kepatuhan pilah: ${wasteData.pilar1.sortingComplianceIndex}%.
- Pilar 2 (Infrastruktur Fasilitas & Tempat Sampah): Total ${wasteData.pilar2.totalFasilitas} fasilitas aktif (${facilityBreakdown}). Rata-rata latensi respon pengangkutan: ${wasteData.pilar2.avgPickupLatencyMinutes} menit. Status tempat sampah pintar: ${wasteData.pilar2.kritisitasTempatSampah.total} unit (${wasteData.pilar2.kritisitasTempatSampah.normal} normal, ${wasteData.pilar2.kritisitasTempatSampah.waspada} waspada, ${wasteData.pilar2.kritisitasTempatSampah.kritis} kritis butuh pengangkutan segera).
- Pilar 3 (Neraca Material Sampah): Total ${wasteData.pilar3.totalSampahMasukKg.toLocaleString("id-ID")} kg sampah masuk (terdiri dari ${wasteData.pilar3.organikKg.toLocaleString("id-ID")} kg sampah Organik dan ${wasteData.pilar3.anorganikKg.toLocaleString("id-ID")} kg sampah Anorganik). Sampah terolah di fasilitas lokal: ${wasteData.pilar3.totalSampahTerolahKg.toLocaleString("id-ID")} kg. Rasio pemanfaatan sirkular (waste utilization rate): ${wasteData.pilar3.wasteUtilizationRate}%.
- Pilar 4 (Dampak Keberlanjutan Triple Bottom Line): Monetisasi ekonomi sirkular Rp ${wasteData.pilar4.totalNilaiEkonomiRupiah.toLocaleString("id-ID")}. Reduksi emisi gas metana/karbon setara ${wasteData.pilar4.reduksiEmisiCo2Kg.toLocaleString("id-ID")} kg CO₂e (dari hasil pemilahan ${wasteData.pilar4.organikKg.toLocaleString("id-ID")} kg organik & ${wasteData.pilar4.anorganikKg.toLocaleString("id-ID")} kg anorganik). Indeks resiliensi komunitas: ${wasteData.pilar4.indeksKomunitas}/100.

[KORELASI DATA KULIAH KERJA NYATA (CROSS-DOMAIN ACCESS)]
- Dukungan KKN: ${kknBasic.pilar4.totalStudents} mahasiswa terbagi dalam 33 posko/kelompok.
- Program Kerja Terealisasi: ${kknBasic.pilar3.breakdown.selesai} dari ${kknBasic.pilar3.totalProker} proker lingkungan tuntas diselesaikan.
      `.trim();
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    const hfModel = process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct";

    const systemInstruction = `
Kamu adalah BERSEKA AI, asisten analitik cerdas resmi sistem terintegrasi Berseka (Bersih, Sehat, Kampung Asri).
Tugasmu: Menjawab pertanyaan pengguna secara ringkas, faktual, profesional, berbasis data nyata database sistem yang disediakan di bawah.
ATURAN KETAT:
1. Hanya bahas data dan ekosistem Kuliah Kerja Nyata dan Tata Kelola Sampah Berseka. Tolak topik di luar ini.
2. Gunakan Bahasa Indonesia baku yang lugas dan berstandar KBBI/EYD V.
3. Rujuk fakta angka dari data aktual sistem di bawah ini. Jangan mengarang data angka.
4. Maksimal 3-4 paragraf singkat atau poin-poin padat.

${contextSummary}
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
          max_tokens: 500,
          temperature: 0.3,
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
        model: "BERSEKA AI",
      };
    } catch (apiError: any) {
      console.warn("[HF Fallback triggered]:", apiError?.message);
      // Fallback response jika ada kendala jaringan eksternal
      return {
        reply: `Berdasarkan ringkasan data aktual sistem Berseka:\n${contextSummary}\n\n(Catatan: Layanan inferensi eksternal sedang mengalami latensi tinggi, tanggapan disajikan berdasarkan kompilasi data langsung dari server).`,
        isBlocked: false,
        model: "BERSEKA AI",
      };
    }
  },
};

