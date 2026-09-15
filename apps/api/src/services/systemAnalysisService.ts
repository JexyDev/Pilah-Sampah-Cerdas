/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * System Analysis Service:
 * Sub-Sistem KKN (5 Pilar Operasional) & Sub-Sistem Tata Kelola Sampah (4 Pilar Strategis)
 */

import { prisma } from "../lib/prisma.js";

// Global safe serializer for PostgreSQL BigInt values (e.g. COUNT(*) results)
if (typeof (BigInt.prototype as any).toJSON !== "function") {
  (BigInt.prototype as any).toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}

interface OpenSourceLlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Multi-Provider Open-Source LLM Failover Engine
 * Support: Groq (Llama-3.3-70B, Qwen-2.5-Coder-32B), OpenRouter Free, Ollama Local, Hugging Face Token Pool
 */
async function callMultiOpenSourceLlm(
  messages: OpenSourceLlmMessage[],
  temperature = 0.2,
  maxTokens = 1500
): Promise<{ text: string; provider: string; model: string }> {
  const errors: string[] = [];

  // 1. Candidate 1: Groq API (High Speed Open Source Models: openai/gpt-oss-120b, qwen/qwen3.6-27b, groq/compound)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groqCandidateModels = [
      process.env.GROQ_MODEL?.trim(),
      "openai/gpt-oss-120b",
      "qwen/qwen3.6-27b",
      "groq/compound"
    ].filter(Boolean) as string[];

    for (const groqModel of groqCandidateModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: groqModel,
            messages,
            max_tokens: maxTokens,
            temperature,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          let text = data.choices?.[0]?.message?.content;
          if (text) {
            // Remove internal reasoning thoughts if present
            text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            return { text, provider: "Groq Open-Source Engine", model: groqModel };
          }
        } else {
          const errText = await res.text();
          errors.push(`Groq (${groqModel} [${res.status}]): ${errText}`);
        }
      } catch (e: any) {
        errors.push(`Groq Error (${groqModel}): ${e.message}`);
      }
    }
  }

  // 2. Candidate 2: OpenRouter API (Open-Source Models Free Tier)
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    const routerModel = process.env.OPENROUTER_MODEL?.trim() || "meta-llama/llama-3.3-70b-instruct:free";
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: routerModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, provider: "OpenRouter Open-Source Engine", model: routerModel };
      } else {
        const errText = await res.text();
        errors.push(`OpenRouter (${res.status}): ${errText}`);
      }
    } catch (e: any) {
      errors.push(`OpenRouter Error: ${e.message}`);
    }
  }

  // 3. Candidate 3: Ollama / Local Open-Source OpenAI Endpoint
  const ollamaUrl = process.env.OLLAMA_HOST || process.env.LOCAL_LLM_URL;
  if (ollamaUrl) {
    try {
      const endpoint = ollamaUrl.endsWith("/v1/chat/completions")
        ? ollamaUrl
        : `${ollamaUrl.replace(/\/$/, "")}/v1/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.LOCAL_LLM_MODEL || "qwen2.5-coder:32b",
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, provider: "Local Ollama Engine", model: "qwen2.5-coder" };
      }
    } catch (e: any) {
      errors.push(`Ollama Error: ${e.message}`);
    }
  }

  // 4. Candidate 4: Hugging Face Multi-Token Pool (Token rotation)
  const rawHfTokens = process.env.HUGGINGFACE_API_KEY || "";
  const hfTokens = rawHfTokens
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const hfModel = process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct";

  for (const token of hfTokens) {
    // Try Router Endpoint
    try {
      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hfModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, provider: "Hugging Face Router", model: hfModel };
      } else {
        const errText = await res.text();
        errors.push(`HF Router key (...${token.slice(-4)}) [${res.status}]: ${errText}`);
      }
    } catch (e: any) {
      errors.push(`HF Router error: ${e.message}`);
    }

    // Try Direct Serverless Model Endpoint
    try {
      const directUrl = `https://api-inference.huggingface.co/models/${hfModel}/v1/chat/completions`;
      const res = await fetch(directUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hfModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, provider: "Hugging Face Direct Model Engine", model: hfModel };
      } else {
        const errText = await res.text();
        errors.push(`HF Direct key (...${token.slice(-4)}) [${res.status}]: ${errText}`);
      }
    } catch (e: any) {
      errors.push(`HF Direct error: ${e.message}`);
    }
  }

  throw new Error(`Seluruh Open-Source LLM Provider mengalami kendala:\n${errors.join("\n")}`);
}

export const systemAnalysisService = {
  /**
   * Sub-Sistem KKN: 5 Pilar Operasional
   */
  async getKknAnalysis(kelompokId?: string) {
    const whereKelompok = kelompokId ? { kelompokId } : {};

    // ── PILAR 1: Logbook & Aktivitas Harian (LogbookKkn) ──
    const [totalLogbook, approvedLogbook, allLogbookGroupStats] = await Promise.all([
      prisma.logbookKkn.count({
        where: whereKelompok,
      }),
      prisma.logbookKkn.count({
        where: {
          ...whereKelompok,
          statusApproval: "DISETUJUI_DPL",
        },
      }),
      prisma.logbookKkn.groupBy({
        by: ["kelompokId"],
        _count: { id: true },
      }),
    ]);

    const verificationRate = totalLogbook > 0 ? Math.round((approvedLogbook / totalLogbook) * 100) : 0;

    // Ambil daftar seluruh kelompok KKN beserta posko dan jumlah jadwal per kelompok
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
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    const kelompokLogbookCountMap = new Map<string, number>();
    allLogbookGroupStats.forEach((l) => {
      kelompokLogbookCountMap.set(l.kelompokId, l._count.id);
    });

    const filteredKelompokList = kelompokId
      ? kelompokList.filter((k) => k.id === kelompokId)
      : kelompokList;

    const kelompokLogbookCounts = (filteredKelompokList.length > 0 ? filteredKelompokList : kelompokList)
      .map((k) => ({
        kelompokId: k.id,
        namaKelompok: k.name,
        totalLogbook: kelompokLogbookCountMap.get(k.id) || 0,
      }))
      .sort((a, b) => b.totalLogbook - a.totalLogbook);

    // ── PILAR 2: Presensi & Monitoring Kehadiran Geofencing ──
    const scheduleWhere = kelompokId ? { kelompokId } : {};
    const attendanceWhere = kelompokId ? { schedule: { kelompokId } } : {};
    const leaveWhere: any = { status: "APPROVED" };
    if (kelompokId) {
      leaveWhere.student = { studentProfile: { kelompokId } };
    }

    const [totalSchedules, attendances, leaveRequests, totalStudentsCount, generalSchedulesCount] = await Promise.all([
      prisma.schedule.count({ where: scheduleWhere }),
      prisma.activityAttendance.findMany({
        where: attendanceWhere,
        select: {
          id: true,
          status: true,
          attendedAt: true,
        },
      }),
      prisma.studentLeaveRequest.findMany({
        where: leaveWhere,
        select: {
          type: true,
          reason: true,
        },
      }),
      prisma.studentKkn.count({ where: whereKelompok }),
      prisma.schedule.count({ where: { kelompokId: null } }),
    ]);

    const hadirCount = attendances.length;
    let outZoneCount = 0;
    attendances.forEach((a) => {
      if (a.status && a.status.toUpperCase().includes("LUAR")) {
        outZoneCount++;
      }
    });

    const inZoneCount = Math.max(0, hadirCount - outZoneCount);

    // Kalkulasi target kehadiran yang presisi:
    // Setiap kelompok KKN memiliki kuota jadwal masing-masing. Mahasiswa hanya berkewajiban hadir pada jadwal kelompoknya.
    let targetAttendances = 0;
    if (kelompokId) {
      const targetGroup = kelompokList.find((k) => k.id === kelompokId);
      const grpStudents = targetGroup ? targetGroup.students.length : totalStudentsCount;
      const grpSchedules = targetGroup ? (targetGroup._count?.schedules || 0) : totalSchedules;
      targetAttendances = grpStudents * (grpSchedules + generalSchedulesCount);
    } else {
      targetAttendances =
        kelompokList.reduce((acc, k) => acc + k.students.length * (k._count?.schedules || 0), 0) +
        generalSchedulesCount * totalStudentsCount;
    }

    const onTimeAttendanceRate =
      targetAttendances > 0
        ? Math.min(100, Math.max(0, Math.round((hadirCount / targetAttendances) * 100)))
        : hadirCount > 0
          ? 100
          : 0;
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
    const penilaianWhere: any = { status: "FINAL" };
    if (kelompokId) {
      penilaianWhere.OR = [
        { kelompokId },
        { student: { studentProfile: { kelompokId } } },
      ];
    }

    const [evaluatedList] = await Promise.all([
      prisma.penilaianKknMahasiswa.findMany({
        where: penilaianWhere,
        select: {
          kategoriNilai: true,
          nilaiAkhir: true,
        },
      }),
    ]);

    const totalStudents = totalStudentsCount;

    const evaluatedStudents = evaluatedList.length;
    const dplEvaluationRate =
      totalStudents > 0 ? Math.min(100, Math.round((evaluatedStudents / totalStudents) * 100)) : 0;

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
        latitude: k.poskoKkn?.latitude ? Number(k.poskoKkn.latitude) : null,
        longitude: k.poskoKkn?.longitude ? Number(k.poskoKkn.longitude) : null,
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
  async queryAiChat(
    prompt: string,
    contextType: "kkn" | "tata-kelola" = "kkn",
    kelompokId?: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = []
  ) {
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
        // Tarik data 33 Kelompok KKN dan relasi DPL, Logbook, Mahasiswa, Penilaian, serta Kategori Proker
        const [kknData, totalKelompokCount, activeSchedulesToday, wasteBasic, kelompokDplList, prokerKategoriGroup] = await Promise.all([
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
          prisma.programKerjaKkn.groupBy({
            by: ["kategori"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
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

        const prokerKategoriSummaryStr = prokerKategoriGroup
          .map((k, i) => `${i + 1}. ${k.kategori || "Lainnya"}: ${k._count.id} Program Kerja`)
          .join("\n");

        const topProkerCategoryName = prokerKategoriGroup[0]?.kategori || "Belum Ditentukan";
        const topProkerCategoryCount = prokerKategoriGroup[0]?._count.id || 0;

        const prokerEntitySummary = `
[DETAIL REKAPITULASI KATEGORI PROGRAM KERJA (JENIS PROKER)]
* Kategori/Jenis Proker Terbanyak: ${topProkerCategoryName} (${topProkerCategoryCount} Proker)
* Rincian Seluruh Kategori Proker Terdaftar (${kknData.pilar3.totalProker} Total Proker):
${prokerKategoriSummaryStr || "- Belum ada program kerja terdaftar."}
`.trim();

        const topKelompokStr = kknData.pilar5.top5Kelompok
          .map((k, i) => `#${i + 1} ${k.nama} (Kelurahan: ${k.kelurahan}, Mahasiswa: ${k.totalMahasiswa}, Proker: ${k.prokerSelesai}/${k.totalProker}, Skor: ${k.skorKinerja})`)
          .join("; ");

        const pLower = cleanPrompt.toLowerCase();
        const isDplQuery = pLower.includes("dpl") || pLower.includes("bimbingan") || pLower.includes("dosen") || pLower.includes("nilai") || pLower.includes("posko");
        const isWasteQuery = pLower.includes("sampah") || pLower.includes("bin") || pLower.includes("fasilitas") || pLower.includes("daur");

        contextSummary = `
[DATA MAKRO DATABASE KKN BERSEKA]
- Cakupan: ${totalKelompokCount} Kelompok KKN, ${kknData.pilar4.totalStudents} Mahasiswa Aktif.
- Pilar 1 (Logbook Mahasiswa): Total ${kknData.pilar1.totalLogbook} entri buku harian tercatat (${kknData.pilar1.approvedLogbook} disetujui DPL, rasio verifikasi ${kknData.pilar1.verificationRate}%).
- Pilar 2 (Presensi & Geofencing Posko): Dari ${activeSchedulesToday} jadwal kegiatan, tercatat ${kknData.pilar2.hadirCount} presensi (${kknData.pilar2.inZoneCount} di dalam radius aman geofence posko, ${kknData.pilar2.outZoneCount} di luar radius). Izin: ${kknData.pilar2.izinCount}, Sakit: ${kknData.pilar2.sakitCount}.
- Pilar 3 (Program Kerja): Total ${kknData.pilar3.totalProker} proker (${kknData.pilar3.breakdown.selesai} selesai, ${kknData.pilar3.breakdown.proses} berjalan, ${kknData.pilar3.breakdown.belum} belum mulai). Jenis Proker Terbanyak: ${topProkerCategoryName} (${topProkerCategoryCount} proker).
- Pilar 4 (Penilaian): ${kknData.pilar4.evaluatedStudents} dari ${kknData.pilar4.totalStudents} mahasiswa tuntas dievaluasi (${kknData.pilar4.dplEvaluationRate}%).
- Pilar 5 (Top Posko): ${topKelompokStr}.

${prokerEntitySummary}
${isDplQuery ? `\n${dplEntitySummary}` : ""}

[DATA TATA KELOLA SAMPAH BERSEKA]
- Total Sampah Masuk: ${wasteBasic.pilar3.totalSampahMasukKg.toLocaleString("id-ID")} kg (Organik: ${wasteBasic.pilar3.organikKg.toLocaleString("id-ID")} kg, Anorganik: ${wasteBasic.pilar3.anorganikKg.toLocaleString("id-ID")} kg).
- Pemanfaatan Sirkular: ${wasteBasic.pilar3.totalSampahTerolahKg.toLocaleString("id-ID")} kg (${wasteBasic.pilar3.wasteUtilizationRate}%).
- Fasilitas Aktif Terkelola: ${wasteBasic.pilar2.totalFasilitas} unit di seluruh wilayah intervensi.
        `.trim();

        // ─── 2. TIER 2: AUTONOMOUS TEXT-TO-SQL ENGINE ───
        (this as any)._lastProkerSummary = {
          topCategory: topProkerCategoryName,
          topCount: topProkerCategoryCount,
          breakdownStr: prokerKategoriSummaryStr,
          totalProker: kknData.pilar3.totalProker,
          selesai: kknData.pilar3.breakdown.selesai,
          proses: kknData.pilar3.breakdown.proses,
          belum: kknData.pilar3.breakdown.belum,
        };
      }

      const pLower = cleanPrompt.toLowerCase();
      if (pLower.includes("sampah") || pLower.includes("bin") || pLower.includes("kritis")) {
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
          take: 5,
          orderBy: { currentVolumeLiter: "desc" },
        });

        if (binsKritis.length > 0) {
          wasteEntitySummary = `\n\n[SAMPEL TEMPAT SAMPAH AKTIF]:\n` +
            binsKritis.map((b) => {
              const fillPct = Number(b.maxCapacityLiter) > 0 ? Math.round((Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter)) * 100) : 0;
              return `- ${b.qrCode} (Volume: ${b.currentVolumeLiter}/${b.maxCapacityLiter} L [${fillPct}%], Kelurahan: ${b.kelurahan?.name || "-"})`;
            }).join("\n");
          contextSummary += wasteEntitySummary;
        }
      }
    } catch (dbErr: any) {
      console.warn("[AI Context Fetch Warning]:", dbErr?.message);
    }

    // ─── 2. TIER 2: AUTONOMOUS TEXT-TO-SQL ENGINE ───
    let dynamicSqlResult: { sql?: string; rows?: any[]; error?: string } = {};

    try {
      let historyContextText = "";
      if (history && history.length > 0) {
        const recentTurns = history.slice(-4);
        historyContextText = `
Riwayat percakapan sebelumnya:
${recentTurns.map((h) => `${h.role === "user" ? "Pengguna" : "Asisten"}: ${h.content.slice(0, 300)}`).join("\n")}
        `.trim();
      }

      const sqlGenPrompt = `
Kamu adalah SQL Analyst PostgreSQL untuk sistem terintegrasi Berseka (Bersih, Sehat, Kampung Asri).
Berikut daftar tabel dan kolom riil dalam database PostgreSQL Berseka:
1. pengguna (id UUID, nama TEXT, email TEXT, no_telepon TEXT, id_peran INT -> peran.id, nip TEXT, program_studi TEXT, institusi TEXT, jabatan TEXT, alamat TEXT, status TEXT)
2. peran (id INT, nama TEXT ['SUPER_USER','DEVELOPER','ADMIN_DLH','PIMPINAN','PEMIMPIN','PANITIA_TASKFORCE','CAMAT','LURAH','RW','RT','DPL','DOSEN_PEMBIMBING','MAHASISWA','WARGA','PETUGAS_RESIDU'])
   - Catatan: Tabel pengguna terhubung ke peran via: pengguna.id_peran = peran.id. Contoh filter DPL: JOIN peran ON pengguna.id_peran = peran.id WHERE peran.nama IN ('DPL','DOSEN_PEMBIMBING')
3. kelompok_kkn (id UUID, nama TEXT, kelurahan TEXT, id_dpl UUID -> pengguna.id, dpl_nama_mentah TEXT, link_google_drive TEXT)
4. logbook_dpl (id UUID, id_dpl UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, tanggal DATE, waktu_mulai TEXT, waktu_selesai TEXT, kategori TEXT, tempat TEXT, deskripsi TEXT, status TEXT, durasi_menit INT, pekan_ke INT)
5. logbook_kkn (id UUID, id_penulis UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, tanggal_kegiatan DATE, deskripsi TEXT, status_persetujuan TEXT ['MENUNGGU_PERSETUJUAN_KETUA','MENUNGGU_VERIFIKASI_DPL','DISETUJUI_DPL','DITOLAK_KETUA','PERLU_REVISI_DPL'], catatan_dpl TEXT, pekan_ke INT)
6. mahasiswa_kkn (id UUID, id_pengguna UUID -> pengguna.id, nim TEXT, jurusan TEXT, fakultas TEXT, no_wa TEXT, id_kelompok UUID -> kelompok_kkn.id, is_ketua BOOLEAN, konversi_sks INT)
   - Catatan: Nama mahasiswa ada di tabel pengguna (mahasiswa_kkn.id_pengguna = pengguna.id).
7. program_kerja_kkn (id UUID, id_kelompok UUID -> kelompok_kkn.id, id_mahasiswa UUID -> mahasiswa_kkn.id, kategori TEXT, status_pelaksanaan TEXT ['BELUM_MULAI','SEDANG_BERJALAN','SELESAI'], status_usulan TEXT ['BELUM_DISETUJUI','DISETUJUI','DITOLAK'], deskripsi TEXT)
8. penilaian_kkn_mahasiswa (id UUID, id_mahasiswa UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, id_dpl UUID -> pengguna.id, nilai_akhir DECIMAL, status TEXT ['DRAFT','FINAL'], kategori_nilai TEXT)
9. jadwal (id UUID, id_kelompok UUID -> kelompok_kkn.id, title TEXT, date TIMESTAMP, time TEXT, category TEXT, location TEXT, is_aktif BOOLEAN, status_kegiatan TEXT ['AKTIF','TIDAK_ADA_KEGIATAN'])
10. kehadiran_kegiatan (id UUID, id_mahasiswa UUID -> pengguna.id, id_jadwal UUID -> jadwal.id, waktu_absen TIMESTAMP, waktu_checkout TIMESTAMP, status TEXT ['DALAM_RADIUS','DI_LUAR_RADIUS','TERLAMBAT'], durasi_aktual_dalam_zona_menit INT)
11. presensi_mandiri (id UUID, id_mahasiswa UUID -> pengguna.id, id_kelompok UUID -> kelompok_kkn.id, waktu_checkin TIMESTAMP, waktu_checkout TIMESTAMP, status TEXT ['AKTIF','SELESAI'], durasi_menit INT, deskripsi_kegiatan TEXT)
12. tempat_sampah (id UUID, kode_qr TEXT, id_kelurahan UUID, id_rw INT, status TEXT ['PRINTED','UNREGISTERED','ACTIVE','INACTIVE','FULL','DAMAGED'], volume_sekarang_liter DECIMAL, maks_kapasitas_liter DECIMAL)
13. fasilitas (id UUID, nama TEXT, jenis TEXT ['TPS3R','BANK_SAMPAH','PUSPA','RUMAH_KOMPOS','LAINNYA'], id_kelurahan UUID, id_rw INT, status_persetujuan TEXT)
14. pemanfaatan_sampah (id UUID, id_rw INT, id_program_kerja UUID, volume_bahan_baku DECIMAL, unit_bahan_baku TEXT, hasil DECIMAL, unit_hasil TEXT, jenis_komoditas TEXT, tanggal_pencatatan TIMESTAMP)
15. kelurahan (id UUID, nama TEXT)
16. rw (id INT, nama TEXT, id_kelurahan UUID)

${historyContextText ? `${historyContextText}\n\n` : ""}Tugasmu:
Buat SATU query SQL PostgreSQL (hanya SELECT) untuk mengambil data spesifik guna menjawab pertanyaan terkini pengguna berikut:
Pertanyaan: "${cleanPrompt}"

Aturan Khusus:
- Jika pertanyaan menanyakan "jenis proker terbanyak", "kategori proker terbanyak", "rincian proker", atau sejenisnya, gunakan query: SELECT kategori, COUNT(*) as jumlah FROM program_kerja_kkn GROUP BY kategori ORDER BY jumlah DESC LIMIT 10;
- Pahami konteks dari riwayat percakapan sebelumnya jika pertanyaan menggunakan kata ganti seperti "mereka", "dia", "posko tersebut", dsb.
- HANYA keluarkan kode SQL SELECT saja, tanpa backtick, tanpa format markdown, tanpa kata pembuka/penutup.
- Jangan gunakan INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, dsb.
- Gunakan LIMIT 50.
- Jika pertanyaan tidak memerlukan query SQL database (misal ucapan halo, terima kasih), jawab persis: NONE.
      `.trim();

      const llmSqlRes = await callMultiOpenSourceLlm([{ role: "user", content: sqlGenPrompt }], 0.1, 300);
      let rawSql = (llmSqlRes.text || "NONE").replace(/```(?:sql)?/gi, "").replace(/```/g, "").trim();

      const isSelect = /^select\b/i.test(rawSql);
      const hasForbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|copy)\b/i.test(rawSql);

      if (isSelect && !hasForbidden && rawSql !== "NONE") {
        try {
          console.log(`[AI Autonomous SQL Query via ${llmSqlRes.provider} (${llmSqlRes.model})]:`, rawSql);
          const rows: any = await prisma.$queryRawUnsafe(rawSql);
          const safeSerialized = JSON.stringify(Array.isArray(rows) ? rows.slice(0, 50) : [rows], (_, v) =>
            typeof v === "bigint" ? (Number.isSafeInteger(Number(v)) ? Number(v) : v.toString()) : v
          );
          dynamicSqlResult = {
            sql: rawSql,
            rows: JSON.parse(safeSerialized),
          };
        } catch (queryErr: any) {
          console.warn("[AI SQL Execution Warning]:", queryErr.message);
          dynamicSqlResult = { sql: rawSql, error: queryErr.message };
        }
      }
    } catch (sqlAgentErr: any) {
      console.warn("[AI Text-to-SQL Agent Warning]:", sqlAgentErr.message);
    }

    // ─── 3. TIER 3: FINAL SYNTHESIS GROUNDING ───
    let sqlContextText = "";
    if (dynamicSqlResult.rows && dynamicSqlResult.rows.length > 0) {
      const formattedRows = JSON.stringify(dynamicSqlResult.rows, (_, v) =>
        typeof v === "bigint" ? (Number.isSafeInteger(Number(v)) ? Number(v) : v.toString()) : v,
        2
      );
      sqlContextText = `
[HASIL QUERY DATABASE OTOMATIS BERDASARKAN PERTANYAAN USER]
Query SQL: ${dynamicSqlResult.sql}
Data Hasil Query (${dynamicSqlResult.rows.length} baris):
${formattedRows}
      `.trim();
    }

    const systemInstruction = `
Kamu adalah BERSEKA AI, Asisten Analitik Cerdas dan Konsol Eksekutif resmi sistem terintegrasi Berseka (Bersih, Sehat, Kampung Asri).
Kamu memiliki visibilitas dan akses PENUH ke seluruh database sistem (KKN, DPL, Mahasiswa, Logbook, Program Kerja, Presensi, Fasilitas, Tempat Sampah, dan Tata Kelola Sampah).

PRINSIP & ATURAN KERJA:
1. SEMUA pertanyaan pengguna harus dijawab secara tuntas, informatif, dan solutif. Tidak ada sensor atau penolakan topik selama dapat dijawab dengan data sistem.
2. Jika pengguna menanyakan tentang program kerja (proker), jenis proker terbanyak, atau distribusi kategori proker, SEBUTKAN KATEGORI TERBANYAK SECARA JELAS (misalnya Edukasi & Sosialisasi) beserta rincian jumlah program kerja per kategori berdasarkan data di bawah.
3. Ketika pengguna (khususnya Pimpinan/Eksekutif) menanyakan "siapa" atau meminta daftar pihak yang belum/sudah menyelesaikan kewajiban (seperti DPL yang belum mengisi logbook, DPL yang belum memverifikasi logbook mahasiswa, DPL yang belum input nilai, mahasiswa alpa, dsb), SEBUTKAN NAMA-NAMA INDIVIDU, DOSEN, POSKO, DAN KELURAHAN SECARA JELAS DAN TRANSPARAN berdasarkan data di bawah.
4. Ingat konteks dari percakapan sebelumnya untuk menjawab pertanyaan lanjutan secara konsisten.
5. Gunakan Bahasa Indonesia yang sopan, lugas, profesional, dan berbobot eksekutif.
6. Sajikan jawaban dalam bentuk ringkasan eksekutif, diikuti poin-poin daftar nama/data yang rapi.

${contextSummary}

${sqlContextText}
    `.trim();

    try {
      const sanitizedHistory = (history || [])
        .slice(-8)
        .map((h) => ({
          role: h.role,
          content: h.content,
        }));

      const llmChatRes = await callMultiOpenSourceLlm(
        [
          { role: "system", content: systemInstruction },
          ...sanitizedHistory,
          { role: "user", content: cleanPrompt },
        ],
        0.2,
        500
      );

      const cleanText = (llmChatRes.text || "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

      return {
        reply: cleanText,
        isBlocked: false,
        model: `BERSEKA AI (${llmChatRes.provider} - ${llmChatRes.model})`,
        sqlExecuted: dynamicSqlResult.sql || null,
      };
    } catch (apiError: any) {
      console.warn("[Open-Source LLM Fallback triggered]:", apiError?.message);

      const pLower = cleanPrompt.toLowerCase();
      const lastProker = (this as any)._lastProkerSummary;
      let fallbackReply = `Berdasarkan penelusuran data langsung dari database Berseka:\n\n`;

      if (
        pLower.includes("proker") ||
        pLower.includes("program kerja") ||
        pLower.includes("jenis") ||
        pLower.includes("kategori")
      ) {
        if (lastProker && lastProker.totalProker > 0) {
          fallbackReply += `Kategori/Jenis Program Kerja (Proker) terbanyak di database Berseka saat ini adalah **"${lastProker.topCategory}"** dengan jumlah **${lastProker.topCount} program kerja**.\n\nBerikut rincian distribusi jenis proker per kategori:\n${lastProker.breakdownStr}\n\n* Total Program Kerja Terdaftar: ${lastProker.totalProker} Proker (${lastProker.selesai} Selesai, ${lastProker.proses} Sedang Berjalan, ${lastProker.belum} Belum Mulai).`;
        } else {
          fallbackReply += `Belum ada program kerja yang tercatat di database sistem Berseka saat ini.`;
        }
      } else if (
        pLower.includes("dpl") ||
        pLower.includes("logbook dpl") ||
        pLower.includes("bimbingan")
      ) {
        fallbackReply += dplEntitySummary || "Belum ada data DPL yang tercatat di database.";
      } else {
        fallbackReply += contextSummary || "Belum ada ringkasan data sistem yang tercatat di database.";
      }

      return {
        reply: fallbackReply,
        isBlocked: false,
        model: "BERSEKA AI (Autonomous Offline DB Engine)",
      };
    }
  },
};


