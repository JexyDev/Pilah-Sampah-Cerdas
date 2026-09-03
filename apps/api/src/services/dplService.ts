import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import { normalizeProkerKategori } from "./kknService.js";

export function parseProkerDeskripsi(rawDeskripsi?: string | null): {
  judul: string;
  deskripsi: string;
} {
  if (!rawDeskripsi || !rawDeskripsi.trim()) {
    return { judul: "-", deskripsi: "-" };
  }
  const text = rawDeskripsi.trim();
  const boldMatch = text.match(/^\*\*(.*?)\*\*(?:\r?\n+([\s\S]*))?$/);
  if (boldMatch) {
    const extractedJudul = boldMatch[1].trim();
    const extractedDesc = (boldMatch[2] || "").trim();
    return {
      judul: extractedJudul || text,
      deskripsi: extractedDesc || extractedJudul || text,
    };
  }
  const lines = text.split(/\r?\n+/);
  if (lines.length > 1) {
    return {
      judul: lines[0].trim() || text,
      deskripsi: lines.slice(1).join("\n").trim() || text,
    };
  }
  return {
    judul: text,
    deskripsi: text,
  };
}

async function getEligiblePastSchedulesCount(groupId?: string): Promise<number> {
  try {
    const configs = await configService.getRuleEngineConfigs();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // If today is prior to KKN start date, no schedules are expected yet!
    if (configs.kknStartDate) {
      const kknStart = new Date(configs.kknStartDate);
      if (now < kknStart) {
        return 0;
      }
    }

    const whereSchedule: any = {
      date: {
        lte: todayEnd,
      },
    };
    if (configs.kknStartDate) {
      whereSchedule.date.gte = new Date(configs.kknStartDate);
    }
    if (groupId) {
      whereSchedule.OR = [{ kelompokId: groupId }, { kelompokId: null }];
    }

    const pastSchedules = await prisma.schedule.findMany({
      where: whereSchedule,
      select: { date: true },
    });

    let eligibleCount = 0;
    for (const s of pastSchedules) {
      const check = await configService.isDateKknHoliday(s.date);
      if (!check.isHoliday) {
        eligibleCount++;
      }
    }

    return eligibleCount;
  } catch (err) {
    console.warn("[dplService] Error calculating eligible schedules:", err);
    return 0;
  }
}

/**
 * Helper: Hitung persentase/skor kehadiran akurat (0 - 100) per mahasiswa
 * Berdasarkan integrasi data riil ActivityAttendance (durasi menit aktual, status pemenuhan, dan jadwal)
 */
async function calculateStudentAttendanceRate(
  studentUserId: string,
  totalSchedules: number,
  ruleConfigs: any,
  configTargets: any
): Promise<number> {
  try {
    const attendances = await prisma.activityAttendance.findMany({
      where: {
        studentId: studentUserId,
        status: { notIn: ["TIDAK_ADA_KEGIATAN", "SKIP_KEGIATAN"] },
      },
      select: {
        id: true,
        status: true,
        actualInZoneMinutes: true,
        attendedAt: true,
        checkOutAt: true,
        jedaLogs: true,
      },
    });

    if (!attendances || attendances.length === 0) {
      return 0;
    }

    const targetDailyMinutes =
      (ruleConfigs?.attendanceMinDurationHours || configTargets?.targetHarianJam || 4) * 60;

    let sumSessionScores = 0;

    for (const att of attendances) {
      const stUpper = String(att.status || "").toUpperCase();
      let mins = Math.min(480, Math.max(0, att.actualInZoneMinutes ?? 0));
      if (stUpper === "BERLANGSUNG" && !att.checkOutAt && att.attendedAt) {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - new Date(att.attendedAt).getTime()) / 60000)
        );
        mins = Math.min(480, Math.max(mins, elapsed));
      } else if (mins === 0 && att.attendedAt && att.checkOutAt) {
        const diff = Math.floor(
          (new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime()) / 60000
        );
        mins = Math.min(480, Math.max(0, diff));
      }

      let sessionScore = 0;
      if (stUpper === "HADIR_MEMENUHI" || (stUpper === "HADIR" && mins >= targetDailyMinutes)) {
        sessionScore = 100;
      } else if (mins > 0) {
        sessionScore = Math.min(100, Math.round((mins / targetDailyMinutes) * 100));
      } else if (stUpper.includes("IZIN") || stUpper.includes("SAKIT")) {
        sessionScore = 100;
      } else {
        sessionScore = 0;
      }
      sumSessionScores += sessionScore;
    }

    // Hitung rata-rata pemenuhan kehadiran dari sesi-sesi yang dihadiri mahasiswa
    return Math.min(100, Math.max(0, Math.round(sumSessionScores / attendances.length)));
  } catch (err) {
    console.warn("[dplService] Error calculating student attendance rate:", err);
    return 0;
  }
}

export function getRoleString(role: any): string {
  if (!role) return "";
  if (typeof role === "object") return String(role.name || "").toUpperCase();
  return String(role).toUpperCase();
}

export function isDplSuperUser(role: any): boolean {
  const r = getRoleString(role);
  return [
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DLH",
    "DLH_ADMIN",
    "ADMIN",
    "SUPER_ADMIN",
    "ADMIN_LPPM",
    "LPPM",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "PANITIA",
  ].some((s) => r.includes(s));
}

export const REAL_32_DPL_STANDARDIZED = [
  {
    no: 1,
    name: "Muhammad Aksan Ipaenin, S.T. M.Sc",
    phone: "+6285294754801",
    rawPhone: "085294754801",
    nip: "4127.99.90.268",
    prodi: "S1 Teknik Sipil",
    kelompok: "Kelompok 1 Lebak Gede",
    kelurahan: "Lebak Gede",
  },
  {
    no: 2,
    name: "Assoc.Prof. Dr. Wartika S.Kom.,MT",
    phone: "+62895337560201",
    rawPhone: "0895337560201",
    nip: "4127.70.26.002",
    prodi: "S1 Sistem Informasi",
    kelompok: "Kelompok 2 Lebak Gede",
    kelurahan: "Lebak Gede",
  },
  {
    no: 3,
    name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom",
    phone: "+6285320322236",
    rawPhone: "085320322236",
    nip: "4127.70.26.111",
    prodi: "D3 Manajemen Informatika",
    kelompok: "Kelompok 3 Lebak Gede",
    kelurahan: "Lebak Gede",
  },
  {
    no: 4,
    name: "Alif Finandhita, S.Kom., M.T.",
    phone: "+6282115865070",
    rawPhone: "082115865070",
    nip: "4127.70.06.025",
    prodi: "S1 Teknik Informatika",
    kelompok: "Kelompok 4 Lebak Gede",
    kelurahan: "Lebak Gede",
  },
  {
    no: 5,
    name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D",
    phone: "+6281318920636",
    rawPhone: "081318920636",
    nip: "4127.70.06.024",
    prodi: "S1 Teknik Informatika",
    kelompok: "Kelompok 1 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 6,
    name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.",
    phone: "+6288210288162",
    rawPhone: "088210288162",
    nip: "4127.88.80.717",
    prodi: "S1 Teknik Arsitektur",
    kelompok: "Kelompok 2 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 7,
    name: "Dr. Olih Solihin, S.Sos., M.I.Kom.",
    phone: "+6289656618667",
    rawPhone: "089656618667",
    nip: "4127.35.30.016",
    prodi: "S1 Ilmu Komunikasi",
    kelompok: "Kelompok 3 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 8,
    name: "Hery Dwi Yulianto, S.T., M.Kom.",
    phone: "+628382821127",
    rawPhone: "08382821127",
    nip: "4127.70.67.004",
    prodi: "D3 Komputerisasi Akuntansi",
    kelompok: "Kelompok 4 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 9,
    name: "John Adler, S.Si., M.Si.",
    phone: "+6282130536915",
    rawPhone: "082130536915",
    nip: "4127.70.05.007",
    prodi: "D3 Teknik Komputer",
    kelompok: "Kelompok 5 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 10,
    name: "Dr. Henike Primawati, S.IP., M.I.Pol.",
    phone: "+628118748686",
    rawPhone: "08118748686",
    nip: "4127.35.32.011",
    prodi: "S1 Hubungan Internasional",
    kelompok: "Kelompok 6 Sekeloa",
    kelurahan: "Sekeloa",
  },
  {
    no: 11,
    name: "Fenny Febrianti, S.S., M.Hum",
    phone: "+6282121822503",
    rawPhone: "082121822503",
    nip: "4127.20.04.004",
    prodi: "S1 Sastra Jepang",
    kelompok: "Kelompok 1 Lebak Siliwangi",
    kelurahan: "Lebak Siliwangi",
  },
  {
    no: 12,
    name: "Dr. Tatik Fidowaty, S.IP., M.Si",
    phone: "+62817616930",
    rawPhone: "0817616930",
    nip: "4127.35.31.009",
    prodi: "S1 Ilmu Pemerintahan",
    kelompok: "Kelompok 2 Lebak Siliwangi",
    kelurahan: "Lebak Siliwangi",
  },
  {
    no: 13,
    name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.",
    phone: "+6281322752828",
    rawPhone: "081322752828",
    nip: "4127.20.03.020",
    prodi: "S1 Sastra Inggris",
    kelompok: "Kelompok 3 Lebak Siliwangi",
    kelurahan: "Lebak Siliwangi",
  },
  {
    no: 14,
    name: "Dr. Agus Mulyana, S.Kom, M.T.",
    phone: "+6282116871007",
    rawPhone: "82116871007",
    nip: "4127.70.05.017",
    prodi: "D3 Teknik Komputer",
    kelompok: "Kelompok 1 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 15,
    name: "Amilia Widya, S.Pd., M.T.",
    phone: "+6281344706038",
    rawPhone: "081344706038",
    nip: "4127.70.17.015",
    prodi: "S1 Teknik Perencanaan Wilayah dan Kota",
    kelompok: "Kelompok 2 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 16,
    name: "Wahyudi, S.H., M.H.",
    phone: "+6281321920848",
    rawPhone: "081321920848",
    nip: "4127.33.00.019",
    prodi: "S1 Ilmu Hukum",
    kelompok: "Kelompok 3 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 17,
    name: "Richi Dwi Agustia, S.Kom., M.Kom.",
    phone: "+6285780084003",
    rawPhone: "085780084003",
    nip: "4127.70.06.132",
    prodi: "S1 Teknik Informatika",
    kelompok: "Kelompok 4 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 18,
    name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.",
    phone: "+6281321911449",
    rawPhone: "081321911449",
    nip: "4127.35.30.007",
    prodi: "S1 Ilmu Komunikasi",
    kelompok: "Kelompok 5 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 19,
    name: "Cherry Dharmawan, S.Sn., M.Sn.",
    phone: "+6282118047608",
    rawPhone: "082118047608",
    nip: "4127.32.04.002",
    prodi: "S1 Desain Interior",
    kelompok: "Kelompok 6 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 20,
    name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA",
    phone: "+628122421004",
    rawPhone: "08122421004",
    nip: "4127.34.03.003",
    prodi: "S1 Akuntansi",
    kelompok: "Kelompok 7 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 21,
    name: "Dr.H.Tatang Supriyadi,S.E.,M.M",
    phone: "+6281222927778",
    rawPhone: "081222927778",
    nip: "4127.34.02.075",
    prodi: "D3 Manajemen Pemasaran",
    kelompok: "Kelompok 8 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 22,
    name: "Dr. Wendi Zarman, M.Si",
    phone: "+628157131405",
    rawPhone: "08157131405",
    nip: "4127.70.05.010",
    prodi: "S1 Sistem Komputer",
    kelompok: "Kelompok 9 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 23,
    name: "Arif Try Cahyadi, S.Ds., M.Ds.",
    phone: "+6282298522354",
    rawPhone: "082298522354",
    nip: "4127.32.06.087",
    prodi: "S1 Desain Komunikasi Visual",
    kelompok: "Kelompok 10 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 24,
    name: "Ayub Subandi, S.Si., M.T., Ph.D.",
    phone: "+6289612270264",
    rawPhone: "089612270264",
    nip: "4127.70.05.030",
    prodi: "S1 Teknik Elektro",
    kelompok: "Kelompok 11 Sadang Serang",
    kelurahan: "Sadang Serang",
  },
  {
    no: 25,
    name: "Iyan Andriana, S.T., M.T.",
    phone: "+628112334224",
    rawPhone: "08112334224",
    nip: "4127.70.03.009",
    prodi: "S1 Teknik Industri",
    kelompok: "Kelompok 1 Cipaganti",
    kelurahan: "Cipaganti",
  },
  {
    no: 26,
    name: "Hanhan Maulana, M.Kom., Ph.D.",
    phone: "+6285222267759",
    rawPhone: "085222267759",
    nip: "4127.70.06.134",
    prodi: "S1 Teknik Informatika",
    kelompok: "Kelompok 2 Cipaganti",
    kelurahan: "Cipaganti",
  },
  {
    no: 27,
    name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.",
    phone: "+6289670059709",
    rawPhone: "089670059709",
    nip: "4127.32.06.011",
    prodi: "D3 Desain Grafis",
    kelompok: "Kelompok 3 Cipaganti",
    kelurahan: "Cipaganti",
  },
  {
    no: 28,
    name: "Rangga Sidik, S.Kom., M.Kom., M.Eng",
    phone: "+6285624088878",
    rawPhone: "085624088878",
    nip: "4127.70.26.113",
    prodi: "S1 Sistem Informasi",
    kelompok: "Kelompok 4 Cipaganti",
    kelurahan: "Cipaganti",
  },
  {
    no: 29,
    name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd",
    phone: "+6281213143636",
    rawPhone: "081213143636",
    nip: "4127.34.02.015",
    prodi: "S1 Manajemen",
    kelompok: "Kelompok 1 Dago",
    kelurahan: "Dago",
  },
  {
    no: 30,
    name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i",
    phone: "+6285759996154",
    rawPhone: "085759996154",
    nip: "4127.70.03.007",
    prodi: "S1 Manajemen",
    kelompok: "Kelompok 2 Dago",
    kelurahan: "Dago",
  },
  {
    no: 31,
    name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP",
    phone: "+6281223216029",
    rawPhone: "81223216029",
    nip: "4127.34.02.006",
    prodi: "S1 Manajemen",
    kelompok: "Kelompok 3 Dago",
    kelurahan: "Dago",
  },
  {
    no: 32,
    name: "Dr. Linna Ismawati, S.E., M.Si.",
    phone: "+6281221471617",
    rawPhone: "81221471617",
    nip: "4127.34.02.008",
    prodi: "S1 Manajemen",
    kelompok: "Kelompok 4 Dago",
    kelurahan: "Dago",
  },
];

export async function ensureDplKelompokRelation(dplUserId: string) {
  try {
    if (!dplUserId) return;

    // 1. Cek apakah DPL sudah memiliki relasi kelompok strict by dplId di database
    const linkedGroupCount = await prisma.kelompokKkn.count({
      where: { dplId: dplUserId },
    });
    if (linkedGroupCount > 0) return;

    // 2. Ambil data profil DPL
    const dplUser = await prisma.user.findUnique({
      where: { id: dplUserId },
      select: { id: true, name: true, phone: true, email: true, nip: true },
    });
    if (!dplUser) return;

    const cleanPhone = (dplUser.phone || "").replace(/[^0-9]/g, "");
    const cleanNip = (dplUser.nip || "").trim();
    const cleanName = (dplUser.name || "").toLowerCase().replace(/[^a-z]/g, "");

    // 3. Cocokkan dengan 32 Standar DPL Resmi
    const matchedStandard = REAL_32_DPL_STANDARDIZED.find((item) => {
      const itemCleanPhone = item.phone.replace(/[^0-9]/g, "");
      const itemCleanRawPhone = item.rawPhone.replace(/[^0-9]/g, "");
      const itemCleanNip = item.nip.trim();
      const itemCleanName = item.name.toLowerCase().replace(/[^a-z]/g, "");

      if (cleanNip && itemCleanNip && cleanNip === itemCleanNip) return true;
      if (
        cleanPhone &&
        (cleanPhone.endsWith(itemCleanPhone.slice(-8)) ||
          cleanPhone.endsWith(itemCleanRawPhone.slice(-8)))
      )
        return true;
      if (
        cleanName &&
        itemCleanName &&
        (cleanName.includes(itemCleanName) || itemCleanName.includes(cleanName))
      )
        return true;
      return false;
    });

    if (matchedStandard) {
      const existingGroup = await prisma.kelompokKkn.findFirst({
        where: {
          name: { equals: matchedStandard.kelompok, mode: "insensitive" },
        },
      });

      if (existingGroup) {
        await prisma.kelompokKkn.update({
          where: { id: existingGroup.id },
          data: {
            dplId: dplUserId,
            dplNamaMentah: dplUser.name,
            kelurahan: existingGroup.kelurahan || matchedStandard.kelurahan,
          },
        });
        console.log(
          `[ensureDplKelompokRelation] Relasi strict by ID terbentuk: ${existingGroup.name} -> DPL ${dplUser.name} (${dplUserId})`
        );
        return;
      } else {
        await prisma.kelompokKkn.create({
          data: {
            name: matchedStandard.kelompok,
            dplId: dplUserId,
            dplNamaMentah: dplUser.name,
            kelurahan: matchedStandard.kelurahan,
          },
        });
        console.log(
          `[ensureDplKelompokRelation] Kelompok baru dibuat & direlasikan strict: ${matchedStandard.kelompok} -> DPL ${dplUser.name} (${dplUserId})`
        );
        return;
      }
    }

    // 4. Jika belum cocok standar, coba cocokkan kelompok yang memiliki dplNamaMentah sama tapi belum terikat dplId
    if (dplUser.name && dplUser.name.trim()) {
      const rawNameGroup = await prisma.kelompokKkn.findFirst({
        where: {
          dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" },
          dplId: null,
        },
      });
      if (rawNameGroup) {
        await prisma.kelompokKkn.update({
          where: { id: rawNameGroup.id },
          data: { dplId: dplUserId, dplNamaMentah: dplUser.name },
        });
        console.log(
          `[ensureDplKelompokRelation] Relasi strict via dplNamaMentah terbentuk: ${rawNameGroup.name} -> DPL ${dplUser.name} (${dplUserId})`
        );
        return;
      }
    }
  } catch (err) {
    console.warn("[ensureDplKelompokRelation] Error linking DPL to Kelompok:", err);
  }
}

export async function getKelompokWhere(dplUserId: string, role?: any) {
  const normalizedRole = getRoleString(role);
  const isAdmin = [
    "DEVELOPER",
    "ADMIN_DLH",
    "DLH",
    "DLH_ADMIN",
    "SUPER_USER",
    "ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ].some((r) => normalizedRole.includes(r));

  if (isAdmin) {
    return {};
  }

  if (normalizedRole.includes("MAHASISWA_KKN") || normalizedRole.includes("MAHASISWA")) {
    return {
      students: { some: { userId: dplUserId } },
    };
  }

  // Pastikan relasi database strict by dplId tersinkronisasi
  await ensureDplKelompokRelation(dplUserId);

  // Relasi strict by ID: kelompok milik DPL ini
  return {
    OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }],
  };
}

export const dplService = {
  /**
   * 1. Ringkasan Kelompok Dampingan (Murni scoped ke kelompok DPL sendiri)
   */
  getGroupSummary: async (dplUserId: string, role?: string) => {
    const kelurahanRecords = await prisma.kelurahan.findMany({
      include: {
        kecamatan: {
          include: {
            kabupaten: {
              include: {
                provinsi: true,
              },
            },
          },
        },
        rws: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
    });

    const kelurahanMap = new Map<string, (typeof kelurahanRecords)[0]>();
    kelurahanRecords.forEach((k) => {
      const cleanName = k.name.toLowerCase().trim();
      kelurahanMap.set(cleanName, k);
      kelurahanMap.set(cleanName.replace(/^kelurahan\s+/i, ""), k);
      kelurahanMap.set(cleanName.replace(/^desa\s+/i, ""), k);
      kelurahanMap.set(cleanName.replace(/\s+/g, ""), k);
    });

    let groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      include: {
        dpl: {
          select: {
            id: true,
            name: true,
            nip: true,
            institusi: true,
            programStudi: true,
            phone: true,
            provinsi: true,
            kabupaten: true,
          },
        },
        poskoKkn: {
          select: {
            id: true,
            nama: true,
            alamat: true,
            latitude: true,
            longitude: true,
          },
        },
        facilities: true,
        students: {
          include: {
            assignedRw: {
              select: {
                id: true,
                name: true,
                kelurahan: {
                  include: {
                    kecamatan: { include: { kabupaten: { include: { provinsi: true } } } },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                fotoProfil: true,
                address: true,
                rwId: true,
                rtId: true,
                rw: {
                  select: {
                    id: true,
                    name: true,
                    kelurahan: {
                      include: {
                        kecamatan: { include: { kabupaten: { include: { provinsi: true } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (groups.length === 0) {
      return [];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const configTargets = await dplService.getConfigTargets();

    const groupSummaries = await Promise.all(
      groups.map(async (grp) => {
        const studentUserIds = grp.students.map((s) => s.userId);
        const studentCount = grp.students.length;
        const ketuaStudent = grp.students.find((s) => s.isKetua);

        // Resolusi Kelurahan yang sangat presisi
        let rawKel = (grp.kelurahan || "").trim();
        if (!rawKel && grp.students.length > 0) {
          const stWithRw = grp.students.find(
            (s) => s.assignedRw?.kelurahan?.name || s.user?.rw?.kelurahan?.name
          );
          if (stWithRw) {
            rawKel =
              stWithRw.assignedRw?.kelurahan?.name || stWithRw.user?.rw?.kelurahan?.name || "";
          }
        }
        if (!rawKel && grp.name) {
          const lowerName = grp.name.toLowerCase();
          for (const k of kelurahanRecords) {
            if (lowerName.includes(k.name.toLowerCase())) {
              rawKel = k.name;
              break;
            }
          }
        }
        if (!rawKel) rawKel = "Sadang Serang";

        const cleanLookup = rawKel.toLowerCase().trim();
        const matchedKelurahan =
          kelurahanMap.get(cleanLookup) ||
          kelurahanMap.get(cleanLookup.replace(/^kelurahan\s+/i, "")) ||
          kelurahanMap.get(cleanLookup.replace(/^desa\s+/i, "")) ||
          kelurahanMap.get(cleanLookup.replace(/\s+/g, "")) ||
          kelurahanRecords[0] ||
          null;

        const resolvedKelurahanName = matchedKelurahan ? matchedKelurahan.name : rawKel;
        const kecamatanName = matchedKelurahan?.kecamatan?.name || "Coblong";
        const kabupatenName = matchedKelurahan?.kecamatan?.kabupaten?.name || "Kota Bandung";
        const provinsiName = matchedKelurahan?.kecamatan?.kabupaten?.provinsi?.name || "Jawa Barat";

        // Helper pemetaan master penempatan RW resmi KKN Coblong
        const getMasterRwForGroup = (groupName: string, kelName: string): string[] => {
          const lowerGroup = (groupName || "").toLowerCase();
          const lowerKel = (kelName || "").toLowerCase();
          const matchNum = lowerGroup.match(/\d+/);
          const num = matchNum ? parseInt(matchNum[0], 10) : 1;

          if (lowerKel.includes("sadang serang")) {
            const map: Record<number, string[]> = {
              1: ["01", "02"],
              2: ["03", "04"],
              3: ["05", "06"],
              4: ["07", "08"],
              5: ["09", "10"],
              6: ["11", "12"],
              7: ["13", "14"],
              8: ["15", "16"],
              9: ["17", "18"],
              10: ["19", "20"],
              11: ["21"],
            };
            return map[num] || ["01", "02"];
          }
          if (lowerKel.includes("sekeloa")) {
            const map: Record<number, string[]> = {
              1: ["01", "02", "03"],
              2: ["04", "05", "06"],
              3: ["07", "08", "09"],
              4: ["10", "11", "12"],
              5: ["13", "14"],
              6: ["15", "16"],
            };
            return map[num] || ["01", "02", "03"];
          }
          if (lowerKel.includes("lebak gede") || lowerKel.includes("lebakgede")) {
            const map: Record<number, string[]> = {
              1: ["01", "02", "03"],
              2: ["04", "05", "06"],
              3: ["07", "08", "09"],
              4: ["10", "11", "12", "13"],
            };
            return map[num] || ["01", "02", "03"];
          }
          if (lowerKel.includes("lebak siliwangi")) {
            const map: Record<number, string[]> = {
              1: ["01", "02"],
              2: ["03", "04"],
              3: ["05", "06"],
            };
            return map[num] || ["01", "02"];
          }
          if (lowerKel.includes("cipaganti")) {
            const map: Record<number, string[]> = {
              1: ["01", "02"],
              2: ["03", "04"],
              3: ["05", "06"],
              4: ["07"],
            };
            return map[num] || ["01", "02"];
          }
          if (lowerKel.includes("dago")) {
            const map: Record<number, string[]> = {
              1: ["01", "02", "03"],
              2: ["04", "05", "06"],
              3: ["07", "08", "09"],
              4: ["10", "11", "12", "13"],
            };
            return map[num] || ["01", "02", "03"];
          }
          return ["01", "02"];
        };

        // Resolusi Cakupan RW yang sangat presisi
        let resolvedCakupanRw: string[] = [];
        if (grp.cakupanRw) {
          if (Array.isArray(grp.cakupanRw)) {
            resolvedCakupanRw = grp.cakupanRw
              .map((r: any) =>
                String(r)
                  .trim()
                  .replace(/^RW\s*/i, "")
              )
              .filter(Boolean);
          } else if (typeof grp.cakupanRw === "string") {
            resolvedCakupanRw = grp.cakupanRw
              .split(/[,&/]/)
              .map((r) => r.trim().replace(/^RW\s*/i, ""))
              .filter(Boolean);
          }
        }
        if (resolvedCakupanRw.length === 0 && grp.students.length > 0) {
          const rwSet = new Set<string>();
          grp.students.forEach((s) => {
            const rwName = s.assignedRw?.name || s.user?.rw?.name;
            if (rwName) {
              rwSet.add(
                String(rwName)
                  .replace(/^RW\s*/i, "")
                  .trim()
              );
            }
          });
          if (rwSet.size > 0) {
            resolvedCakupanRw = Array.from(rwSet);
          }
        }
        if (resolvedCakupanRw.length === 0) {
          resolvedCakupanRw = getMasterRwForGroup(grp.name, resolvedKelurahanName);
        }

        // Format RW yang konsisten (contoh: "01", "02")
        resolvedCakupanRw = resolvedCakupanRw
          .map((r) => (/^\d+$/.test(r) ? r.padStart(2, "0") : r))
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });

        // Simpan hasil resolusi ke database jika sebelumnya kosong
        if (
          !grp.cakupanRw ||
          (Array.isArray(grp.cakupanRw) && grp.cakupanRw.length === 0) ||
          !grp.kelurahan
        ) {
          try {
            await prisma.kelompokKkn.update({
              where: { id: grp.id },
              data: {
                cakupanRw: resolvedCakupanRw,
                kelurahan: resolvedKelurahanName,
              },
            });
          } catch {
            // Ignore background update error
          }
        }

        // Query kondisi Tempat Sampah terkait kelompok KKN (strictly berdasarkan pendaftar mahasiswa dampingan DPL)
        const binWhere: any =
          studentUserIds.length > 0
            ? {
                status: "ACTIVE_BOUND",
                registeredByStudentId: { in: studentUserIds },
              }
            : { id: "impossible-id" };

        const [activatedBinsCount, organikBinsCount, anorganikBinsCount, wasteSum] =
          await Promise.all([
            prisma.bin.count({
              where: binWhere,
            }),
            prisma.bin.count({
              where: {
                ...binWhere,
                category: {
                  name: {
                    in: ["Organik", "organik", "ORGANIK", "ORGANIC", "organic"],
                  },
                },
              },
            }),
            prisma.bin.count({
              where: {
                ...binWhere,
                category: {
                  name: {
                    in: [
                      "Anorganik",
                      "anorganik",
                      "ANORGANIK",
                      "ANORGANIC",
                      "anorganic",
                      "NON_ORGANIC",
                      "Non-Organik",
                    ],
                  },
                },
              },
            }),
            prisma.setoranOtomatis.aggregate({
              where: {
                bin: binWhere,
              },
              _sum: { berat: true },
            }),
          ]);

        const totalWasteWeight = Math.round(Number(wasteSum._sum.berat || 0) * 100) / 100;

        const totalAttendances = await prisma.activityAttendance.count({
          where:
            studentUserIds.length > 0
              ? { studentId: { in: studentUserIds } }
              : { id: "impossible-id" },
        });

        const activeTodayCount =
          studentUserIds.length > 0
            ? (
                await prisma.activityAttendance.groupBy({
                  by: ["studentId"],
                  where: {
                    studentId: { in: studentUserIds },
                    attendedAt: { gte: todayStart, lte: todayEnd },
                  },
                })
              ).length
            : 0;

        const attendancesWithDuration =
          studentUserIds.length > 0
            ? await prisma.activityAttendance.findMany({
                where: { studentId: { in: studentUserIds } },
                select: { attendedAt: true, checkOutAt: true },
              })
            : [];

        let actualHours = 0;
        for (const a of attendancesWithDuration) {
          if (a.checkOutAt && a.attendedAt) {
            const diff = (a.checkOutAt.getTime() - a.attendedAt.getTime()) / (1000 * 60 * 60);
            actualHours += Math.max(0.5, Math.min(8, diff));
          } else {
            actualHours += configTargets.targetHarianJam || 4.0;
          }
        }
        actualHours = Math.round(actualHours * 100) / 100;

        const ruleConfigs = await configService.getRuleEngineConfigs();
        const totalSchedules = await getEligiblePastSchedulesCount(grp.id);
        const studentRates = await Promise.all(
          studentUserIds.map((uId) =>
            calculateStudentAttendanceRate(uId, totalSchedules, ruleConfigs, configTargets)
          )
        );
        const avgAttendanceRate =
          studentRates.length > 0
            ? Math.round(studentRates.reduce((a, b) => a + b, 0) / studentRates.length)
            : 0;

        const pointSum = await prisma.pointHistory.aggregate({
          where:
            studentUserIds.length > 0
              ? { userId: { in: studentUserIds } }
              : { id: "impossible-id" },
          _sum: { points: true },
        });

        const prokerList = await prisma.programKerjaKkn.findMany({
          where: { kelompokId: grp.id },
          orderBy: { createdAt: "desc" },
        });

        let prokerBelumMulaiCount = 0;
        let prokerSedangBerjalanCount = 0;
        let prokerSelesaiCount = 0;

        const mappedProker = prokerList.map((p, pIdx) => {
          const parsed = parseProkerDeskripsi(p.deskripsi);
          let judul = parsed.judul;
          let deskripsiDetail = parsed.deskripsi;
          const legacySt = String(p.status || "").toUpperCase();
          let u = (p as any).statusUsulan;
          if (!u) {
            if (
              legacySt === "DITERIMA" ||
              legacySt === "DISETUJUI" ||
              legacySt === "SEDANG_BERJALAN" ||
              legacySt === "SELESAI"
            )
              u = "DISETUJUI";
            else if (legacySt === "DITOLAK" || legacySt === "TIDAK_DISETUJUI") u = "DITOLAK";
            else u = "BELUM_DISETUJUI";
          }
          let pl = (p as any).statusPelaksanaan;
          if (!pl) {
            if (legacySt === "SELESAI") pl = "SELESAI";
            else if (
              legacySt === "SEDANG_BERJALAN" ||
              legacySt === "SEDANG_DILAKSANAKAN" ||
              legacySt === "BERJALAN"
            )
              pl = "SEDANG_BERJALAN";
            else pl = "BELUM_MULAI";
          }

          if (pl === "SELESAI") prokerSelesaiCount++;
          else if (pl === "SEDANG_BERJALAN") prokerSedangBerjalanCount++;
          else prokerBelumMulaiCount++;

          return {
            id: p.id,
            nomor: p.nomor || pIdx + 1,
            judul,
            deskripsi: deskripsiDetail,
            kategori: p.kategori,
            sumber: p.sumber,
            waktuPelaksanaan: p.waktuPelaksanaan || null,
            urlGoogleDrive: p.linkGoogleDrive || null,
            linkGoogleDrive: p.linkGoogleDrive || null,
            kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
            status: p.status,
            statusUsulan: u,
            statusPelaksanaan: pl,
            skorPenilaian: p.skorPenilaian !== null ? Number(p.skorPenilaian) : null,
            createdAt: p.createdAt.toISOString(),
          };
        });

        return {
          id: grp.id,
          name: grp.name,
          kelurahan: resolvedKelurahanName || grp.kelurahan || "Sadang Serang",
          kecamatan: kecamatanName || "Coblong",
          kabupaten: kabupatenName || "Kota Bandung",
          provinsi: provinsiName || "Jawa Barat",
          cakupanRw: resolvedCakupanRw,
          posko: grp.poskoKkn
            ? {
                id: grp.poskoKkn.id,
                nama: grp.poskoKkn.nama,
                alamat: grp.poskoKkn.alamat,
                latitude: grp.poskoKkn.latitude ? Number(grp.poskoKkn.latitude) : null,
                longitude: grp.poskoKkn.longitude ? Number(grp.poskoKkn.longitude) : null,
              }
            : null,
          facilities: grp.facilities.map((f: any) => ({
            id: f.id,
            nama: f.nama,
            jenis: f.jenis,
            alamat: f.alamat,
            latitude: f.latitude ? Number(f.latitude) : null,
            longitude: f.longitude ? Number(f.longitude) : null,
            statusApproval: f.statusApproval,
          })),
          ketua: ketuaStudent
            ? {
                id: ketuaStudent.id,
                userId: ketuaStudent.userId,
                name: ketuaStudent.user?.name || "Ketua Kelompok",
                nim: ketuaStudent.nim,
                phone: ketuaStudent.user?.phone,
              }
            : null,
          dpl: grp.dpl
            ? {
                id: grp.dpl.id,
                name: grp.dpl.name,
                nip: grp.dpl.nip,
                institusi: grp.dpl.institusi,
                programStudi: grp.dpl.programStudi,
                phone: grp.dpl.phone,
              }
            : null,
          studentCount,
          activeTodayCount,
          actualHours,
          targetHours: configTargets.targetTotalJam || 100,
          targetTotalKegiatan: configTargets.targetTotalKegiatan || 2000,
          activatedBinsCount,
          organikBinsCount,
          anorganikBinsCount,
          totalWasteWeight,
          avgAttendanceRate,
          totalGroupPoints: pointSum._sum.points || 0,
          prokerBelumMulaiCount,
          prokerSedangBerjalanCount,
          prokerSelesaiCount,
          totalProkerCount: prokerList.length,
          programKerja: mappedProker,
        };
      })
    );

    return groupSummaries;
  },

  /**
   * 2. Detail per Mahasiswa Dampingan DPL
   */
  getStudentDetails: async (
    dplUserId: string,
    groupId?: string,
    role?: string,
    search?: string
  ) => {
    const whereGroup: any = await getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });

    if (myGroups.length === 0) {
      return [];
    }

    const myGroupIds = myGroups.map((g) => g.id);

    const studentWhere: any = { kelompokId: { in: myGroupIds } };
    if (search && search.trim() !== "") {
      const q = search.trim();
      studentWhere.OR = [
        { nim: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { jurusan: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.studentKkn.findMany({
      where: studentWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            fotoProfil: true,
          },
        },
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const studentDetails = await Promise.all(
      students.map(async (st) => {
        const attendances = await prisma.activityAttendance.findMany({
          where: { studentId: st.userId },
          include: { schedule: true },
          orderBy: { attendedAt: "desc" },
        });

        const leaveRequests = await prisma.studentLeaveRequest.findMany({
          where: { studentId: st.userId },
          orderBy: { createdAt: "desc" },
        });

        const sickCount = leaveRequests.filter(
          (r) => r.type === "SAKIT" && r.status === "APPROVED"
        ).length;
        const izinCount = leaveRequests.filter(
          (r) => r.type === "IZIN" && r.status === "APPROVED"
        ).length;
        const rejectedAbsenceCount = leaveRequests.filter((r) => r.status === "REJECTED").length;

        const totalSchedules = await getEligiblePastSchedulesCount(st.kelompokId || undefined);
        const attendedCount = attendances.filter((a) => {
          const stUpper = String(a.status || "").toUpperCase();
          return !["ALPA", "ALPHA", "TIDAK_ADA_KEGIATAN", "SKIP_KEGIATAN"].includes(stUpper);
        }).length;
        const alphaCount = attendances.filter((a) => {
          const stUpper = String(a.status || "").toUpperCase();
          return stUpper === "ALPA" || stUpper === "ALPHA";
        }).length;

        const configTargets = await dplService.getConfigTargets();
        const ruleConfigs = await configService.getRuleEngineConfigs();
        const baseScore = Number(st.assessmentScore || 0);
        const finalCalculatedScore = baseScore;

        let totalMinutes = 0;
        for (const a of attendances) {
          if (a.checkOutAt && a.attendedAt) {
            const diffMs = Math.max(
              0,
              new Date(a.checkOutAt).getTime() - new Date(a.attendedAt).getTime()
            );
            const mins = Math.min(480, Math.round(diffMs / (1000 * 60)));
            totalMinutes += mins;
          } else if (a.attendedAt) {
            const isToday = new Date(a.attendedAt).toDateString() === new Date().toDateString();
            if (isToday) {
              const diffMs = Math.max(0, Date.now() - new Date(a.attendedAt).getTime());
              totalMinutes += Math.min(480, Math.round(diffMs / (1000 * 60)));
            } else {
              totalMinutes += Math.round((configTargets.targetHarianJam || 4) * 60);
            }
          }
        }
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        const targetHours = configTargets.targetTotalJam || 200;
        const progressPercentage = Math.round((totalMinutes / (targetHours * 60 || 1)) * 100);

        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });
        const netPoints = Math.max(0, points._sum.points || 0);

        return {
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa KKN",
          phone: st.user?.phone || "-",
          nim: st.nim || "-",
          jurusan: st.jurusan || "-",
          fakultas: st.fakultas || "-",
          fotoProfil: st.user?.fotoProfil || null,
          isKetua: Boolean(st.isKetua),
          kelompokName: st.kelompok?.name || "-",
          assessmentScore: finalCalculatedScore,
          baseAssessmentScore: baseScore,
          isAssessed: Boolean(st.isAssessed),
          individualPoints: netPoints,
          attendanceRate: await calculateStudentAttendanceRate(
            st.userId,
            totalSchedules,
            ruleConfigs,
            configTargets
          ),
          attendedCount,
          sickCount,
          izinCount,
          alphaCount,
          totalHours,
          totalMinutes,
          remainingMinutes,
          targetHours,
          progressPercentage,
          statusKehadiranLabel:
            alphaCount > 0 ? "Perlu Perhatian (Ada Alpa)" : "Tertib Presensi",
          attendances: attendances.map((a) => ({
            id: a.id,
            scheduleTitle: a.schedule?.title || "Kegiatan KKN",
            attendedAt: a.attendedAt,
            status: a.status,
          })),
          leaveRequests: leaveRequests.map((l) => ({
            id: l.id,
            type: l.type,
            reason: l.reason,
            status: l.status,
            createdAt: l.createdAt,
          })),
        };
      })
    );

    return studentDetails;
  },

  /**
   * Mendapatkan summary kumulatif jam aktual mahasiswa KKN terhadap minimal target
   */
  getStudentCumulativeSummary: async (
    dplUserId: string,
    groupId?: string,
    role?: string,
    search?: string
  ) => {
    const whereGroup: any = await getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });

    if (myGroups.length === 0) {
      return [];
    }

    const myGroupIds = myGroups.map((g) => g.id);

    const studentWhere: any = { kelompokId: { in: myGroupIds } };
    if (search && search.trim() !== "") {
      const q = search.trim();
      studentWhere.OR = [
        { nim: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { jurusan: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.studentKkn.findMany({
      where: studentWhere,
      include: {
        user: { select: { id: true, name: true, fotoProfil: true } },
        kelompok: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const configTargets = await dplService.getConfigTargets();
    const targetHours = configTargets.targetTotalJam || 200;
    const targetTotalMinutes = targetHours * 60;

    const summaryList = await Promise.all(
      students.map(async (st) => {
        const attendances = await prisma.activityAttendance.findMany({
          where: { studentId: st.userId },
          select: { attendedAt: true, checkOutAt: true },
        });

        let totalMinutes = 0;
        for (const a of attendances) {
          if (a.checkOutAt && a.attendedAt) {
            const diffMs = Math.max(
              0,
              new Date(a.checkOutAt).getTime() - new Date(a.attendedAt).getTime()
            );
            const mins = Math.min(480, Math.round(diffMs / (1000 * 60)));
            totalMinutes += mins;
          } else if (a.attendedAt) {
            const isToday = new Date(a.attendedAt).toDateString() === new Date().toDateString();
            if (isToday) {
              const diffMs = Math.max(0, Date.now() - new Date(a.attendedAt).getTime());
              totalMinutes += Math.min(480, Math.round(diffMs / (1000 * 60)));
            } else {
              totalMinutes += Math.round((configTargets.targetHarianJam || 4) * 60);
            }
          }
        }

        const totalHoursActual = Math.floor(totalMinutes / 60);
        const remainingMinsActual = totalMinutes % 60;

        const progressPercentage = Math.round((totalMinutes / (targetTotalMinutes || 1)) * 100);
        const isTargetAchieved = totalMinutes >= targetTotalMinutes;

        return {
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa KKN",
          nim: st.nim || "-",
          kelompokName: st.kelompok?.name || "-",
          fotoProfil: st.user?.fotoProfil || null,
          cumulativeStats: {
            totalActualMinutes: totalMinutes,
            totalActualFormatted: `${totalHoursActual} Jam ${remainingMinsActual} Menit`,
            targetTotalMinutes: targetTotalMinutes,
            targetTotalFormatted: `${targetHours} Jam`,
            progressPercentage: Math.min(100, progressPercentage),
            isTargetAchieved,
          },
        };
      })
    );

    return summaryList;
  },

  /**
   * 3. Detail Warga yang Dibantu (w/ Waste Pattern)
   */
  getAssistedCitizens: async (dplUserId: string, studentId: string) => {
    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
      },
      include: { user: true },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
    }

    const bins = await prisma.bin.findMany({
      where: { registeredByStudentId: student.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            createdAt: true,
          },
        },
        category: true,
        rw: true,
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const citizenList = await Promise.all(
      bins.map(async (bin) => {
        const citizen = bin.user;
        const setoranLogs = citizen
          ? await prisma.setoranOtomatis.findMany({
              where: { wargaId: citizen.id },
              orderBy: { createdAt: "desc" },
            })
          : [];

        const recentSetoranCount = setoranLogs.filter((s) => s.createdAt >= sevenDaysAgo).length;
        const totalKg = setoranLogs.reduce((acc, curr) => acc + Number(curr.berat || 0), 0);
        const totalPoints = setoranLogs.reduce((acc, curr) => acc + Number(curr.poin || 0), 0);

        const polaBuangSampah =
          recentSetoranCount >= 3
            ? "RUTIN"
            : setoranLogs.length > 0
              ? "KURANG_RUTIN"
              : "BELUM_SETOR";

        return {
          binId: bin.id,
          qrCode: bin.qrCode,
          binStatus: bin.status,
          registeredAt: bin.createdAt,
          warga: citizen
            ? {
                id: citizen.id,
                nama: citizen.name,
                phone: citizen.phone,
                alamat: citizen.address || "-",
              }
            : null,
          totalSetoranCount: setoranLogs.length,
          recentSetoranCount,
          totalKg: Math.round(totalKg * 100) / 100,
          totalPoints,
          polaBuangSampah,
        };
      })
    );

    return {
      student: {
        id: student.id,
        name: student.user?.name || "Mahasiswa",
        jurusan: student.jurusan,
      },
      totalCitizensAssisted: citizenList.filter((c) => c.warga !== null).length,
      citizens: citizenList,
    };
  },

  /**
   * 4. Peta Sebaran (Hanya Wilayah & Kelompok DPL)
   */
  getMapCoverage: async (dplUserId: string, role?: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: {
        id: true,
        name: true,
        kelurahan: true,
        cakupanRw: true,
        students: { select: { userId: true } },
      },
    });

    if (groups.length === 0) {
      return { groups: [], rwAreas: [], bins: [] };
    }

    const allStudentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    const bins = await prisma.bin.findMany({
      where:
        allStudentUserIds.length > 0
          ? { registeredByStudentId: { in: allStudentUserIds } }
          : { id: "impossible-id" },
      take: 200,
      select: {
        id: true,
        qrCode: true,
        status: true,
        latitude: true,
        longitude: true,
        user: { select: { name: true, address: true } },
      },
    });

    const groupKelurahans = groups.map((g) => g.kelurahan).filter(Boolean) as string[];

    const rwAreas = await prisma.rw.findMany({
      where:
        groupKelurahans.length > 0
          ? { kelurahan: { name: { in: groupKelurahans, mode: "insensitive" } } }
          : {},
      include: { kelurahan: true },
    });

    const poskos = await prisma.poskoKkn.findMany({
      where: { kelompokId: { in: groups.map((g) => g.id) } },
      select: {
        id: true,
        kelompokId: true,
        nama: true,
        alamat: true,
        latitude: true,
        longitude: true,
      },
    });

    const facilities = await prisma.facility.findMany({
      where: { kelompokId: { in: groups.map((g) => g.id) } },
      select: {
        id: true,
        nama: true,
        jenis: true,
        latitude: true,
        longitude: true,
        kelompokId: true,
        statusApproval: true,
      },
    });

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        kelurahan: g.kelurahan || null,
        cakupanRw: g.cakupanRw,
      })),
      rwAreas: rwAreas.map((rw) => ({
        id: rw.id,
        name: rw.name,
        kelurahan: rw.kelurahan?.name || null,
        latitude: rw.latitude ? Number(rw.latitude) : null,
        longitude: rw.longitude ? Number(rw.longitude) : null,
      })),
      bins: bins.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        status: b.status,
        latitude: b.latitude ? Number(b.latitude) : 0,
        longitude: b.longitude ? Number(b.longitude) : 0,
        wargaNama: b.user?.name || "Warga",
      })),
      poskos: poskos.map((p) => ({
        id: p.id,
        kelompokId: p.kelompokId,
        nama: p.nama,
        alamat: p.alamat,
        latitude: p.latitude ? Number(p.latitude) : 0,
        longitude: p.longitude ? Number(p.longitude) : 0,
      })),
      facilities: facilities.map((f) => ({
        id: f.id,
        nama: f.nama,
        jenis: f.jenis,
        latitude: f.latitude ? Number(f.latitude) : 0,
        longitude: f.longitude ? Number(f.longitude) : 0,
        kelompokId: f.kelompokId,
        statusApproval: f.statusApproval,
      })),
    };
  },

  /**
   * 5. Notifikasi / Alert DPL (Hanya Pengajuan Izin dari Mahasiswa Dampingan DPL)
   */
  getAlerts: async (dplUserId: string, role?: string) => {
    // 1. Auto-eskalasi pengajuan izin yang PENDING lebih dari 24 jam ke Panitia Task Force
    // BUGFIX: Scope auto-eskalasi hanya ke mahasiswa kelompok DPL ini, bukan seluruh sistem
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const myGroups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { students: { select: { userId: true } } },
    });
    const myStudentIds = myGroups.flatMap((g) => g.students.map((s) => s.userId));
    if (myStudentIds.length > 0) {
      await prisma.studentLeaveRequest.updateMany({
        where: {
          status: "PENDING",
          createdAt: { lt: oneDayAgo },
          studentId: { in: myStudentIds },
        },
        data: {
          status: "ESCALATED",
          rejectionReason: "Auto-eskalasi ke Panitia Taskforce (DPL tidak merespons dalam 24 jam)",
        },
      });
    }

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: {
        id: true,
        students: { select: { userId: true, user: { select: { name: true } } } },
      },
    });

    if (groups.length === 0) {
      return { pendingApprovalsCount: 0, pendingRequests: [] };
    }

    const studentMap = new Map<string, string>();
    groups.forEach((g) =>
      g.students.forEach((s) => studentMap.set(s.userId, s.user?.name || "Mahasiswa"))
    );

    const studentUserIds = Array.from(studentMap.keys());
    if (studentUserIds.length === 0) {
      return { pendingApprovalsCount: 0, pendingRequests: [] };
    }

    const pendingRequests = await prisma.studentLeaveRequest.findMany({
      where: { studentId: { in: studentUserIds }, status: { in: ["PENDING", "CANCEL_REQUESTED"] } },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      pendingApprovalsCount: pendingRequests.length,
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || "Mahasiswa",
        type: r.type,
        reason: r.reason,
        evidenceUrl: r.evidenceUrl,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  },

  /**
   * 6. Riwayat Approval Log DPL (Hanya Riwayat Kelompok DPL)
   */
  getApprovalHistory: async (dplUserId: string, role?: any) => {
    const normalizedRole = getRoleString(role);
    const isAdmin = [
      "DEVELOPER",
      "ADMIN_DLH",
      "DLH",
      "DLH_ADMIN",
      "SUPER_USER",
      "ADMIN",
      "PANITIA_TASKFORCE",
      "PEMIMPIN",
    ].some((r) => normalizedRole.includes(r));

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { students: { select: { userId: true } } },
    });

    const studentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    const history = await prisma.studentLeaveRequest.findMany({
      where: isAdmin
        ? { reviewedAt: { not: null } }
        : {
            AND: [
              { studentId: { in: studentUserIds } },
              {
                OR: [
                  { reviewedById: dplUserId },
                  {
                    status: {
                      in: ["APPROVED", "REJECTED", "ESCALATED", "CANCELLED", "OVERRIDDEN_HADIR"],
                    },
                  },
                ],
              },
            ],
          },
      include: {
        student: { select: { name: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    });

    return history.map((h) => ({
      id: h.id,
      studentName: h.student?.name || "Mahasiswa",
      type: h.type,
      reason: h.reason,
      status: h.status,
      startDate: h.startDate,
      endDate: h.endDate,
      reviewedAt: h.reviewedAt || h.updatedAt,
      rejectionReason: h.rejectionReason,
      evidenceUrl: h.evidenceUrl,
    }));
  },

  /**
   * 7. Form Penilaian Aktivitas Mahasiswa
   */
  assessStudent: async (dplUserId: string, studentId: string, score: number, note?: string) => {
    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
      throw new Error("INVALID_SCORE_RANGE: Nilai asesmen harus berada di antara 0 sampai 100");
    }

    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
      },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
    }

    const updated = await prisma.studentKkn.update({
      where: { id: student.id },
      data: {
        assessmentScore: score,
        isAssessed: true,
        // BUGFIX: Simpan assessmentNote yang ada di schema (catatan_penilaian_dpl)
        ...(note !== undefined ? { assessmentNote: note } : {}),
      },
      include: { user: { select: { name: true } } },
    });

    return {
      success: true,
      studentId: updated.id,
      studentName: updated.user?.name || "Mahasiswa",
      assessmentScore: Number(updated.assessmentScore),
      isAssessed: updated.isAssessed,
      assessmentNote: updated.assessmentNote || note || null,
      note: note || "Penilaian berhasil disimpan",
    };
  },

  /**
   * Decide (Approve/Reject/Escalate) Leave Request
   * Saat APPROVED: otomatis mengupdate / meng-generate absensi SAKIT/IZIN pada jadwal terkait.
   */
  decideLeaveRequest: async (
    dplUserId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    rejectionReason?: string
  ) => {
    const req = await prisma.studentLeaveRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            studentProfile: {
              include: { kelompok: true },
            },
          },
        },
      },
    });

    if (!req) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const updated = await prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById: dplUserId,
        reviewedAt: new Date(),
        rejectionReason: status === "REJECTED" || status === "ESCALATED" ? rejectionReason : null,
      },
    });

    // Jika disetujui (APPROVED), sinkronkan presensi otomatis untuk jadwal kegiatan mahasiswa ybs
    if (status === "APPROVED") {
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate || req.startDate);
      end.setHours(23, 59, 59, 999);

      const studentProfile = await prisma.studentKkn.findFirst({
        where: {
          OR: [{ userId: req.studentId }, { id: req.studentId }],
        },
      });

      const targetStudentId = studentProfile?.userId || req.studentId;

      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
          ...(studentProfile?.kelompokId
            ? { OR: [{ kelompokId: studentProfile.kelompokId }, { kelompokId: null }] }
            : {}),
        },
      });

      const attStatus = String(req.type || "")
        .toUpperCase()
        .includes("SAKIT")
        ? "SAKIT"
        : "IZIN";

      for (const sch of schedules) {
        const lat = sch.latitude ? Number(sch.latitude) : 0;
        const lng = sch.longitude ? Number(sch.longitude) : 0;
        await prisma.activityAttendance.upsert({
          where: {
            studentId_scheduleId: {
              studentId: targetStudentId,
              scheduleId: sch.id,
            },
          },
          create: {
            studentId: targetStudentId,
            scheduleId: sch.id,
            status: attStatus,
            method: "IZIN_DPL",
            latitude: lat,
            longitude: lng,
            attendedAt: sch.date || new Date(),
          },
          update: {
            status: attStatus,
            method: "IZIN_DPL",
          },
        });
      }
    } else if (status === "REJECTED") {
      // Jika ditolak, bersihkan status presensi IZIN_DPL yang mungkin sempat disetujui sebelumnya
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate || req.startDate);
      end.setHours(23, 59, 59, 999);

      const studentProfile = await prisma.studentKkn.findFirst({
        where: {
          OR: [{ userId: req.studentId }, { id: req.studentId }],
        },
      });

      const targetStudentId = studentProfile?.userId || req.studentId;

      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      for (const sch of schedules) {
        await prisma.activityAttendance.deleteMany({
          where: {
            studentId: targetStudentId,
            scheduleId: sch.id,
            method: "IZIN_DPL",
          },
        });
      }
    }

    return updated;
  },

  /**
   * Decide (Approve / Reject) Permohonan Pembatalan Izin Mahasiswa (Skenario B)
   * Jika disetujui (APPROVE_HADIR):
   * - Ubah status pengajuan menjadi OVERRIDDEN_HADIR
   * - Update kehadiran mahasiswa pada jadwal terkait menjadi HADIR (method: OVERRIDE_DPL)
   * Jika ditolak (REJECT_CANCEL):
   * - Kembalikan status ke APPROVED
   */
  decideCancelLeaveRequest: async (
    dplUserId: string,
    requestId: string,
    action: "APPROVE_HADIR" | "REJECT_CANCEL",
    note?: string
  ) => {
    const req = await prisma.studentLeaveRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            studentProfile: {
              include: { kelompok: true },
            },
          },
        },
      },
    });

    if (!req) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    if (action === "REJECT_CANCEL") {
      const updated = await prisma.studentLeaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          rejectionReason: note || "Permohonan pembatalan izin ditolak DPL. Izin tetap berlaku.",
          reviewedById: dplUserId,
          reviewedAt: new Date(),
        },
      });
      return updated;
    }

    // APPROVE_HADIR: Setujui Batal Izin -> Ubah ke Hadir
    const updated = await prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: "OVERRIDDEN_HADIR",
        reviewedById: dplUserId,
        reviewedAt: new Date(),
        rejectionReason:
          note || "Izin dibatalkan dan disetujui DPL. Status presensi diubah menjadi Hadir.",
      },
    });

    const start = new Date(req.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(req.endDate || req.startDate);
    end.setHours(23, 59, 59, 999);

    const studentProfile = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ userId: req.studentId }, { id: req.studentId }],
      },
    });

    const targetStudentId = studentProfile?.userId || req.studentId;

    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        ...(studentProfile?.kelompokId
          ? { OR: [{ kelompokId: studentProfile.kelompokId }, { kelompokId: null }] }
          : {}),
      },
    });

    for (const sch of schedules) {
      const lat = sch.latitude ? Number(sch.latitude) : 0;
      const lng = sch.longitude ? Number(sch.longitude) : 0;
      await prisma.activityAttendance.upsert({
        where: {
          studentId_scheduleId: {
            studentId: targetStudentId,
            scheduleId: sch.id,
          },
        },
        create: {
          studentId: targetStudentId,
          scheduleId: sch.id,
          status: "HADIR",
          method: "OVERRIDE_DPL",
          latitude: lat,
          longitude: lng,
          attendedAt: new Date(),
        },
        update: {
          status: "HADIR",
          method: "OVERRIDE_DPL",
        },
      });
    }

    return updated;
  },

  /**
   * 8. Program Kerja KKN - Get List
   */
  getProgramKerja: async (
    dplUserId: string,
    groupId?: string,
    role?: any,
    filters?: {
      kategori?: string;
      statusUsulan?: string;
      statusPelaksanaan?: string;
      statusPenilaian?: string;
      search?: string;
    }
  ) => {
    const whereGroup: any = await getKelompokWhere(dplUserId, role);
    if (groupId && groupId !== "ALL") whereGroup.id = groupId;

    let groups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: {
        id: true,
        name: true,
        kelurahan: true,
        cakupanRw: true,
        dpl: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        students: {
          select: {
            id: true,
            nim: true,
            jurusan: true,
            isKetua: true,
            noWa: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: [{ isKetua: "desc" }, { nim: "asc" }],
        },
      },
    });

    if (groups.length === 0) {
      groups = await prisma.kelompokKkn.findMany({
        where: groupId && groupId !== "ALL" ? { id: groupId } : undefined,
        select: {
          id: true,
          name: true,
          kelurahan: true,
          cakupanRw: true,
          dpl: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          students: {
            select: {
              id: true,
              nim: true,
              jurusan: true,
              isKetua: true,
              noWa: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
            orderBy: [{ isKetua: "desc" }, { nim: "asc" }],
          },
        },
      });
    }

    if (groups.length === 0) {
      return [];
    }

    const groupIds = groups.map((g) => g.id);
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    // Enforce H+5 Soft-Expiry Rule: If approved > 5 days ago and still BELUM_MULAI, soft-cancel
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await prisma.programKerjaKkn
      .updateMany({
        where: {
          kelompokId: { in: groupIds },
          statusUsulan: "DISETUJUI",
          statusPelaksanaan: "BELUM_MULAI",
          updatedAt: { lt: fiveDaysAgo },
        },
        data: {
          statusUsulan: "KADALUARSA_OTOMATIS",
          status: "DITOLAK",
          catatanDpl:
            "Dibatalkan otomatis oleh sistem (H+5): Program kerja tidak dimulai dalam 5 hari setelah disetujui.",
        },
      })
      .catch(() => {});

    const prokerWhere: any = {
      kelompokId: { in: groupIds },
    };

    const andConditions: any[] = [];

    if (filters?.kategori && filters.kategori !== "ALL") {
      prokerWhere.kategori = { equals: filters.kategori, mode: "insensitive" };
    }

    // Filter Status Usulan (DISETUJUI / DITOLAK / BELUM_DISETUJUI)
    if (filters?.statusUsulan && filters.statusUsulan !== "ALL") {
      const u = filters.statusUsulan.toUpperCase();
      if (u === "DISETUJUI" || u === "DITERIMA") {
        andConditions.push({
          OR: [
            { statusUsulan: { in: ["DISETUJUI", "DITERIMA"] } },
            { status: { in: ["DITERIMA", "SEDANG_BERJALAN", "SELESAI"] } },
          ],
        });
      } else if (u === "DITOLAK" || u === "TIDAK_DISETUJUI") {
        andConditions.push({
          OR: [{ statusUsulan: { in: ["DITOLAK", "TIDAK_DISETUJUI"] } }, { status: "DITOLAK" }],
        });
      } else if (u === "BELUM_DISETUJUI" || u === "MENUNGGU" || u === "PENDING") {
        andConditions.push({
          OR: [
            { statusUsulan: { in: ["BELUM_DISETUJUI", "MENUNGGU", "PENDING"] } },
            { status: "BELUM_DISETUJUI" },
          ],
        });
      }
    }

    // Filter Status Pelaksanaan (BELUM_MULAI / SEDANG_BERJALAN / SELESAI)
    if (filters?.statusPelaksanaan && filters.statusPelaksanaan !== "ALL") {
      const p = filters.statusPelaksanaan.toUpperCase();
      if (p === "SELESAI" || p === "SUDAH") {
        andConditions.push({
          OR: [{ statusPelaksanaan: "SELESAI" }, { status: "SELESAI" }],
        });
      } else if (
        p === "BERJALAN" ||
        p === "SEDANG_BERJALAN" ||
        p === "SEDANG" ||
        p === "SEDANG_DILAKSANAKAN" ||
        p === "BERLANGSUNG" ||
        p === "SEDANG_BERLANGSUNG"
      ) {
        andConditions.push({
          OR: [
            { statusPelaksanaan: { in: ["SEDANG_BERJALAN", "SEDANG_DILAKSANAKAN", "BERJALAN"] } },
            { status: "SEDANG_BERJALAN" },
          ],
        });
      } else if (p === "BELUM_MULAI" || p === "BELUM") {
        andConditions.push({
          OR: [
            { statusPelaksanaan: { in: ["BELUM_MULAI", "BELUM"] } },
            { status: { in: ["BELUM_DISETUJUI", "DITERIMA"] } },
          ],
        });
      }
    }

    if (filters?.statusPenilaian && filters.statusPenilaian !== "ALL") {
      if (filters.statusPenilaian === "SUDAH_DINILAI") {
        prokerWhere.skorPenilaian = { not: null };
      } else if (filters.statusPenilaian === "BELUM_DINILAI") {
        prokerWhere.skorPenilaian = null;
      }
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      andConditions.push({
        OR: [
          { deskripsi: { contains: q, mode: "insensitive" } },
          { kategori: { contains: q, mode: "insensitive" } },
          { kelompok: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      prokerWhere.AND = andConditions;
    }

    const prokers = await prisma.programKerjaKkn.findMany({
      where: prokerWhere,
      include: {
        reviewedBy: { select: { id: true, name: true } },
        student: {
          select: {
            id: true,
            nim: true,
            jurusan: true,
            isKetua: true,
            noWa: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ kelompokId: "asc" }, { nomor: "asc" }, { createdAt: "asc" }],
    });

    return prokers.map((p) => {
      const skorNum = p.skorPenilaian !== null ? Number(p.skorPenilaian) : null;
      let calculatedPredikat: string | null = null;
      if (skorNum !== null) {
        if (skorNum >= 85) calculatedPredikat = "Sangat Baik";
        else if (skorNum >= 70) calculatedPredikat = "Baik";
        else if (skorNum >= 60) calculatedPredikat = "Cukup";
        else calculatedPredikat = "Kurang";
      }

      // Standarisasi Status Usulan (DISETUJUI / DITOLAK / BELUM_DISETUJUI)
      let resolvedStatusUsulan = (p as any).statusUsulan;
      const legacySt = String(p.status || "").toUpperCase();
      if (!resolvedStatusUsulan) {
        if (
          legacySt === "DITERIMA" ||
          legacySt === "DISETUJUI" ||
          legacySt === "SEDANG_BERJALAN" ||
          legacySt === "SELESAI"
        ) {
          resolvedStatusUsulan = "DISETUJUI";
        } else if (legacySt === "DITOLAK" || legacySt === "TIDAK_DISETUJUI") {
          resolvedStatusUsulan = "DITOLAK";
        } else {
          resolvedStatusUsulan = "BELUM_DISETUJUI";
        }
      }

      // Standarisasi Status Pelaksanaan (BELUM_MULAI / SEDANG_BERJALAN / SELESAI)
      let resolvedStatusPelaksanaan = (p as any).statusPelaksanaan;
      if (!resolvedStatusPelaksanaan) {
        if (legacySt === "SELESAI") {
          resolvedStatusPelaksanaan = "SELESAI";
        } else if (legacySt === "SEDANG_BERJALAN" || legacySt === "SEDANG_DILAKSANAKAN") {
          resolvedStatusPelaksanaan = "SEDANG_BERJALAN";
        } else {
          resolvedStatusPelaksanaan = "BELUM_MULAI";
        }
      }

      const parsedDesc = parseProkerDeskripsi(p.deskripsi);
      const grp = groupMap.get(p.kelompokId) as any;
      const mhsList = (grp?.students || []).map((s: any) => ({
        id: s.id,
        nama: s.user?.name || "-",
        nim: s.nim || "-",
        prodi: s.jurusan || s.prodi || "-",
        isKetua: s.isKetua || false,
        phone: s.user?.phone || s.noWa || "-",
      }));
      const ketuaMhs = grp?.students?.find((s: any) => s.isKetua);

      // Tentukan Penginput / Pengusul Proker
      let penginputInfo: any = null;
      const sumberUpper = String(p.sumber || "").toUpperCase();
      if (sumberUpper === "DPL") {
        penginputInfo = {
          nama: grp?.dpl?.name || "Dosen Pembimbing Lapangan",
          role: "DPL",
          nim: null,
          prodi: null,
          telepon: grp?.dpl?.phone || null,
        };
      } else {
        // Sumber Mahasiswa
        if (p.student) {
          penginputInfo = {
            id: p.student.id,
            nama: p.student.user?.name || "Mahasiswa",
            nim: p.student.nim || null,
            prodi: (p.student as any).jurusan || (p.student as any).prodi || null,
            role: "MAHASISWA",
            isKetua: p.student.isKetua || false,
            telepon: p.student.user?.phone || p.student.noWa || null,
          };
        } else if (ketuaMhs) {
          penginputInfo = {
            id: ketuaMhs.id,
            nama: ketuaMhs.user?.name ? `${ketuaMhs.user.name} (Ketua)` : "Mahasiswa (Ketua)",
            nim: ketuaMhs.nim || null,
            prodi: (ketuaMhs as any).jurusan || (ketuaMhs as any).prodi || null,
            role: "MAHASISWA",
            isKetua: true,
            telepon: ketuaMhs.user?.phone || ketuaMhs.noWa || null,
          };
        } else if (mhsList.length > 0) {
          penginputInfo = {
            id: mhsList[0].id,
            nama: mhsList[0].nama,
            nim: mhsList[0].nim,
            prodi: mhsList[0].prodi,
            role: "MAHASISWA",
            isKetua: false,
            telepon: mhsList[0].phone,
          };
        } else {
          penginputInfo = {
            nama: "Mahasiswa Kelompok",
            role: "MAHASISWA",
            nim: null,
            prodi: null,
            telepon: null,
          };
        }
      }

      return {
        id: p.id,
        kelompokId: p.kelompokId,
        kelompokName: grp?.name || "-",
        kelurahan: grp?.kelurahan || "-",
        cakupanRw: grp?.cakupanRw || [],
        dplName: grp?.dpl?.name || "-",
        totalMahasiswa: mhsList.length,
        penginput: penginputInfo,
        mahasiswaList: mhsList,
        nomor: p.nomor || 1,
        judul: parsedDesc.judul,
        deskripsi: parsedDesc.deskripsi,
        kategori: normalizeProkerKategori(p.kategori),
        sumber: p.sumber || "MAHASISWA",
        waktuPelaksanaan: p.waktuPelaksanaan || null,
        linkGoogleDrive: p.linkGoogleDrive || null,
        kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
        status: p.status,
        statusUsulan: resolvedStatusUsulan,
        statusPelaksanaan: resolvedStatusPelaksanaan,
        catatanDpl: p.catatanDpl,
        reviewedByName: p.reviewedBy?.name || null,
        reviewedAt: p.reviewedAt,
        skorPenilaian: skorNum,
        predikat: (p as any).predikat || calculatedPredikat,
        statusPenilaian:
          (p as any).statusPenilaian || (skorNum !== null ? "SUDAH_DINILAI" : "BELUM_DINILAI"),
        aspekPenilaian: (p as any).aspekPenilaian || null,
        evaluasiDpl: p.evaluasiDpl,
        createdAt: p.createdAt,
      };
    });
  },

  /**
   * 9. Program Kerja KKN - Create
   */
  createProgramKerja: async (
    dplUserId: string,
    role: any,
    data: {
      kelompokId: string;
      nomor?: number;
      deskripsi: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
      status?:
        | "BELUM_DISETUJUI"
        | "DITERIMA"
        | "DISETUJUI"
        | "DITOLAK"
        | "TIDAK_DISETUJUI"
        | "SEDANG_BERJALAN"
        | "SEDANG_DILAKSANAKAN"
        | "SELESAI";
      statusUsulan?: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | string;
      statusPelaksanaan?: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | string;
    }
  ) => {
    let groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    let allowedGroupIds = groups.map((g) => g.id);

    if (allowedGroupIds.length === 0) {
      const allGroups = await prisma.kelompokKkn.findMany({
        take: 1,
        select: { id: true },
      });
      allowedGroupIds = allGroups.map((g) => g.id);
    }

    let targetKelompokId = data.kelompokId;
    if (!targetKelompokId || !allowedGroupIds.includes(targetKelompokId)) {
      if (allowedGroupIds.length > 0) {
        targetKelompokId = allowedGroupIds[0];
      } else {
        const firstGrp = await prisma.kelompokKkn.findFirst({ select: { id: true } });
        if (firstGrp) {
          targetKelompokId = firstGrp.id;
        } else {
          throw new Error("FORBIDDEN_SCOPE");
        }
      }
    }

    let normalizedStatusUsulan = data.statusUsulan || data.status || "BELUM_DISETUJUI";
    if (normalizedStatusUsulan === "DITERIMA") normalizedStatusUsulan = "DISETUJUI";
    if (normalizedStatusUsulan === "TIDAK_DISETUJUI") normalizedStatusUsulan = "DITOLAK";

    let normalizedStatusPelaksanaan = data.statusPelaksanaan || "BELUM_MULAI";
    if (
      normalizedStatusPelaksanaan === "BERJALAN" ||
      normalizedStatusPelaksanaan === "SEDANG" ||
      normalizedStatusPelaksanaan === "BERLANGSUNG" ||
      normalizedStatusPelaksanaan === "SEDANG_BERLANGSUNG"
    )
      normalizedStatusPelaksanaan = "SEDANG_BERJALAN";
    if (normalizedStatusPelaksanaan === "SUDAH") normalizedStatusPelaksanaan = "SELESAI";

    // Legacy status synchronization
    let legacyStatus: any = "BELUM_DISETUJUI";
    if (normalizedStatusPelaksanaan === "SELESAI") {
      legacyStatus = "SELESAI";
    } else if (normalizedStatusPelaksanaan === "SEDANG_BERJALAN") {
      legacyStatus = "SEDANG_BERJALAN";
    } else if (normalizedStatusUsulan === "DISETUJUI") {
      legacyStatus = "DITERIMA";
    } else if (normalizedStatusUsulan === "DITOLAK") {
      legacyStatus = "DITOLAK";
    }

    let combinedDeskripsi = (data.deskripsi || "").trim();
    if ((data as any).judul && (data as any).judul.trim()) {
      const cleanJ = (data as any).judul.trim().replace(/\*\*/g, "");
      const cleanD = combinedDeskripsi.replace(/^\*\*.*?\*\*(?:\r?\n+)?/, "").trim();
      combinedDeskripsi = cleanD ? `**${cleanJ}**\n\n${cleanD}` : `**${cleanJ}**`;
    }

    const createPayload: any = {
      kelompokId: targetKelompokId,
      nomor: data.nomor || 1,
      deskripsi: combinedDeskripsi,
      kategori: normalizeProkerKategori(data.kategori),
      sumber: data.sumber || "MAHASISWA",
      waktuPelaksanaan: data.waktuPelaksanaan || null,
      linkGoogleDrive: data.linkGoogleDrive || null,
      kebutuhanBiaya: data.kebutuhanBiaya || 0,
      status: legacyStatus,
      statusUsulan: normalizedStatusUsulan,
      statusPelaksanaan: normalizedStatusPelaksanaan,
    };

    const proker = await prisma.programKerjaKkn.create({
      data: createPayload,
    });
    return {
      ...proker,
      statusUsulan: (proker as any).statusUsulan || normalizedStatusUsulan,
      statusPelaksanaan: (proker as any).statusPelaksanaan || normalizedStatusPelaksanaan,
    };
  },

  /**
   * 10. Program Kerja KKN - Update
   */
  updateProgramKerja: async (
    id: string,
    userId: string,
    role: any,
    data: {
      nomor?: number;
      deskripsi?: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
      status?: "BELUM_DISETUJUI" | "DITERIMA" | "DITOLAK" | "SEDANG_BERJALAN" | "SELESAI";
      statusUsulan?: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | string;
      statusPelaksanaan?: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | string;
      catatanDpl?: string;
    }
  ) => {
    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(userId, role),
      select: { id: true },
    });
    let allowedGroupIds = groups.map((g) => g.id);
    if (allowedGroupIds.length === 0) {
      const allGroups = await prisma.kelompokKkn.findMany({ select: { id: true } });
      allowedGroupIds = allGroups.map((g) => g.id);
    }

    if (allowedGroupIds.length > 0 && !allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updateData: any = {};
    if (data.nomor !== undefined) updateData.nomor = data.nomor;
    if ((data as any).judul !== undefined || data.deskripsi !== undefined) {
      const existingParsed = parseProkerDeskripsi(prokerExisting.deskripsi);
      const newJudul =
        (data as any).judul !== undefined
          ? String((data as any).judul)
              .trim()
              .replace(/\*\*/g, "")
          : existingParsed.judul;
      const newDesc =
        data.deskripsi !== undefined
          ? data.deskripsi.replace(/^\*\*.*?\*\*(?:\r?\n+)?/, "").trim()
          : existingParsed.deskripsi;
      updateData.deskripsi = newDesc ? `**${newJudul}**\n\n${newDesc}` : `**${newJudul}**`;
    }
    if (data.kategori !== undefined) updateData.kategori = normalizeProkerKategori(data.kategori);
    if (data.sumber !== undefined) updateData.sumber = data.sumber;
    if (data.waktuPelaksanaan !== undefined) updateData.waktuPelaksanaan = data.waktuPelaksanaan;
    if (data.linkGoogleDrive !== undefined) updateData.linkGoogleDrive = data.linkGoogleDrive;
    if (data.kebutuhanBiaya !== undefined) updateData.kebutuhanBiaya = data.kebutuhanBiaya;

    let targetUsulan = data.statusUsulan;
    let targetPelaksanaan = data.statusPelaksanaan;

    if (data.status !== undefined && !targetUsulan && !targetPelaksanaan) {
      const s = String(data.status).toUpperCase();
      if (s === "SELESAI") {
        targetUsulan = "DISETUJUI";
        targetPelaksanaan = "SELESAI";
      } else if (s === "SEDANG_BERJALAN" || s === "SEDANG_DILAKSANAKAN") {
        targetUsulan = "DISETUJUI";
        targetPelaksanaan = "SEDANG_BERJALAN";
      } else if (s === "DITERIMA" || s === "DISETUJUI") {
        targetUsulan = "DISETUJUI";
        targetPelaksanaan = "BELUM_MULAI";
      } else if (s === "DITOLAK" || s === "TIDAK_DISETUJUI") {
        targetUsulan = "DITOLAK";
        targetPelaksanaan = "BELUM_MULAI";
      } else {
        targetUsulan = "BELUM_DISETUJUI";
        targetPelaksanaan = "BELUM_MULAI";
      }
    }

    if (targetUsulan !== undefined) {
      let normU = targetUsulan;
      if (normU === "DITERIMA") normU = "DISETUJUI";
      if (normU === "TIDAK_DISETUJUI") normU = "DITOLAK";
      updateData.statusUsulan = normU;
    }

    if (targetPelaksanaan !== undefined) {
      let normP = targetPelaksanaan;
      if (normP === "BERJALAN" || normP === "SEDANG") normP = "SEDANG_BERJALAN";
      if (normP === "SUDAH") normP = "SELESAI";
      updateData.statusPelaksanaan = normP;
    }

    // Sync legacy status
    const effectiveUsulan =
      updateData.statusUsulan || (prokerExisting as any).statusUsulan || "BELUM_DISETUJUI";
    const effectivePelaksanaan =
      updateData.statusPelaksanaan || (prokerExisting as any).statusPelaksanaan || "BELUM_MULAI";
    if (effectivePelaksanaan === "SELESAI") {
      updateData.status = "SELESAI";
    } else if (effectivePelaksanaan === "SEDANG_BERJALAN") {
      updateData.status = "SEDANG_BERJALAN";
    } else if (effectiveUsulan === "DISETUJUI") {
      updateData.status = "DITERIMA";
    } else if (effectiveUsulan === "DITOLAK") {
      updateData.status = "DITOLAK";
    } else {
      updateData.status = "BELUM_DISETUJUI";
    }

    if (data.catatanDpl !== undefined) updateData.catatanDpl = data.catatanDpl;

    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: updateData,
    });
    return {
      ...proker,
      statusUsulan: (proker as any).statusUsulan || effectiveUsulan,
      statusPelaksanaan: (proker as any).statusPelaksanaan || effectivePelaksanaan,
    };
  },

  /**
   * 11. Program Kerja KKN - Delete
   */
  deleteProgramKerja: async (id: string, userId: string, role: any) => {
    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(userId, role),
      select: { id: true },
    });
    let allowedGroupIds = groups.map((g) => g.id);
    if (allowedGroupIds.length === 0) {
      const allGroups = await prisma.kelompokKkn.findMany({ select: { id: true } });
      allowedGroupIds = allGroups.map((g) => g.id);
    }

    if (allowedGroupIds.length > 0 && !allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    return await prisma.programKerjaKkn.delete({
      where: { id },
    });
  },

  /**
   * 12. Program Kerja KKN - Decision (Accept / Reject / Update Status)
   */
  decideProgramKerja: async (
    dplUserId: string,
    id: string,
    status:
      | "DITERIMA"
      | "DISETUJUI"
      | "DITOLAK"
      | "TIDAK_DISETUJUI"
      | "SEDANG_BERJALAN"
      | "SEDANG_DILAKSANAKAN"
      | "SELESAI"
      | "BELUM_DISETUJUI",
    catatanDpl?: string,
    role?: any,
    statusPelaksanaan?: string
  ) => {
    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    let allowedGroupIds = groups.map((g) => g.id);
    // BUGFIX: Fallback untuk SUPER_USER — sama seperti di updateProgramKerja
    if (allowedGroupIds.length === 0) {
      const allGroups = await prisma.kelompokKkn.findMany({ select: { id: true } });
      allowedGroupIds = allGroups.map((g) => g.id);
    }

    if (allowedGroupIds.length > 0 && !allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    let normalizedStatus: any = status;
    if (normalizedStatus === "DISETUJUI") normalizedStatus = "DITERIMA";
    if (normalizedStatus === "TIDAK_DISETUJUI") normalizedStatus = "DITOLAK";
    if (normalizedStatus === "SEDANG_DILAKSANAKAN") normalizedStatus = "SEDANG_BERJALAN";

    let statusUsulan = "BELUM_DISETUJUI";
    if (
      normalizedStatus === "DITERIMA" ||
      normalizedStatus === "SEDANG_BERJALAN" ||
      normalizedStatus === "SELESAI"
    ) {
      statusUsulan = "DISETUJUI";
    } else if (normalizedStatus === "DITOLAK") {
      statusUsulan = "DITOLAK";
    }

    let newStatusPelaksanaan =
      statusPelaksanaan || (prokerExisting as any).statusPelaksanaan || "BELUM_MULAI";
    if (normalizedStatus === "SELESAI") newStatusPelaksanaan = "SELESAI";
    else if (normalizedStatus === "SEDANG_BERJALAN") newStatusPelaksanaan = "SEDANG_BERJALAN";

    const updatePayload: any = {
      status: normalizedStatus,
      statusUsulan,
      statusPelaksanaan: newStatusPelaksanaan,
      catatanDpl: catatanDpl !== undefined ? catatanDpl || null : undefined,
      reviewedById: dplUserId,
      reviewedAt: new Date(),
    };

    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: updatePayload,
    });
    return {
      ...proker,
      statusUsulan: (proker as any).statusUsulan || statusUsulan,
      statusPelaksanaan: (proker as any).statusPelaksanaan || newStatusPelaksanaan,
    };
  },

  /**
   * 13. Program Kerja KKN - Penilaian / Evaluasi Output Proker
   */
  assessProgramKerja: async (
    dplUserId: string,
    id: string,
    skorPenilaian: number,
    evaluasiDpl?: string,
    role?: any,
    aspekPenilaian?: any,
    predikat?: string,
    statusPenilaian?: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI",
    statusPelaksanaan?: string
  ) => {
    if (skorPenilaian < 0 || skorPenilaian > 100) {
      throw new Error("Skor penilaian harus berada di rentang 0-100");
    }

    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const statusUsulanStr = String(
      prokerExisting.statusUsulan || prokerExisting.status || ""
    ).toUpperCase();
    const isApproved = statusUsulanStr === "DISETUJUI" || statusUsulanStr === "DITERIMA";
    if (!isApproved) {
      if (statusUsulanStr === "DITOLAK" || statusUsulanStr === "TIDAK_DISETUJUI") {
        throw new Error("PROKER_REJECTED");
      }
      throw new Error("PROKER_NOT_APPROVED");
    }

    // Validasi status pelaksanaan: Proker belum mulai tidak dapat dinilai
    const statusPelaksanaanStr = String(
      (prokerExisting as any).statusPelaksanaan ||
        (prokerExisting.status === "SELESAI"
          ? "SELESAI"
          : prokerExisting.status === "SEDANG_BERJALAN"
          ? "SEDANG_BERJALAN"
          : "BELUM_MULAI")
    ).toUpperCase();
    if (statusPelaksanaanStr === "BELUM_MULAI" || statusPelaksanaanStr === "BELUM") {
      throw new Error("PROKER_NOT_STARTED");
    }

    // Evaluasi 26-08-2026: Proker bisa dinilai sejak awal kegiatan, namun WAJIB memiliki lampiran file
    // Belum ada file = Belum bisa dinilai (penilaian disabled/locked)
    const hasFile = Boolean(
      (prokerExisting as any).attachmentFile ||
      (prokerExisting as any).hasAttachment ||
      prokerExisting.linkGoogleDrive ||
      ((prokerExisting as any).attachmentUrls &&
        Array.isArray((prokerExisting as any).attachmentUrls) &&
        (prokerExisting as any).attachmentUrls.length > 0)
    );

    if (!hasFile) {
      throw new Error(
        "PROKER_ATTACHMENT_REQUIRED: File lampiran bukti program kerja belum diunggah oleh ketua kelompok. Penilaian belum dapat dilakukan."
      );
    }

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    const allowedGroupIds = groups.map((g) => g.id);

    if (!allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    let finalPredikat = predikat;
    if (!finalPredikat) {
      if (skorPenilaian >= 85) finalPredikat = "Sangat Baik";
      else if (skorPenilaian >= 70) finalPredikat = "Baik";
      else if (skorPenilaian >= 60) finalPredikat = "Cukup";
      else finalPredikat = "Kurang";
    }

    const finalStatusPenilaian =
      statusPenilaian || (skorPenilaian > 0 ? "SUDAH_DINILAI" : "SEDANG_DINILAI");
    const targetStatusPelaksanaan = statusPelaksanaan || "SELESAI";

    const updateData: any = {
      skorPenilaian,
      evaluasiDpl: evaluasiDpl || null,
      reviewedById: dplUserId,
      reviewedAt: new Date(),
      predikat: finalPredikat,
      statusPenilaian: finalStatusPenilaian,
      statusPelaksanaan: targetStatusPelaksanaan,
      status: targetStatusPelaksanaan === "SELESAI" ? "SELESAI" : "SEDANG_BERJALAN",
    };

    if (aspekPenilaian !== undefined) {
      updateData.aspekPenilaian = aspekPenilaian;
    }

    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: updateData,
    });

    return {
      ...proker,
      skorPenilaian: Number(proker.skorPenilaian),
      predikat: (proker as any).predikat || finalPredikat,
      statusPenilaian: (proker as any).statusPenilaian || finalStatusPenilaian,
      aspekPenilaian: (proker as any).aspekPenilaian || aspekPenilaian || null,
      statusUsulan: (proker as any).statusUsulan || "DISETUJUI",
      statusPelaksanaan: (proker as any).statusPelaksanaan || statusPelaksanaan || "BELUM_MULAI",
    };
  },

  /**
   * 13b. Program Kerja KKN - Bukti Kegiatan & Dokumentasi
   */
  getProgramKerjaBukti: async (dplUserId: string, prokerId: string, role?: any) => {
    const proker = await prisma.programKerjaKkn.findUnique({
      where: { id: prokerId },
      include: {
        kelompok: {
          include: {
            students: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });
    if (!proker) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    const allowedGroupIds = groups.map((g) => g.id);
    if (!allowedGroupIds.includes(proker.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const studentUserIds = proker.kelompok.students.map((s) => s.userId);
    const attendances = await prisma.activityAttendance.findMany({
      where: {
        studentId: { in: studentUserIds },
      },
      orderBy: { attendedAt: "desc" },
      take: 12,
      include: {
        schedule: { select: { title: true, location: true, category: true } },
        student: { select: { name: true } },
      },
    });

    // 1. Ambil foto dari Logbook KKN (Kegiatan & Laporan Mahasiswa) berdasarkan programKerjaId atau kelompokId
    let logbookPhotos: any[] = [];
    try {
      const logbooks = await prisma.logbookKkn.findMany({
        where: {
          OR: [{ programKerjaId: prokerId }, { kelompokId: proker.kelompokId }],
        },
        orderBy: { createdAt: "desc" },
        take: 24,
        include: {
          penulis: { select: { name: true } },
        },
      });
      logbookPhotos = logbooks
        .filter((l) => l.fotoBuktiUrl && l.fotoBuktiUrl.trim() !== "" && l.fotoBuktiUrl !== "null")
        .map((l) => ({
          id: l.id,
          activityTitle:
            l.deskripsi?.split("\n")[0]?.replace(/^[*#\s]+/, "") || "Logbook Kegiatan KKN",
          description: l.tempat ? `Tempat: ${l.tempat}` : "Dokumentasi Logbook",
          photoUrl: l.fotoBuktiUrl,
          checkIn: (l.tanggalKegiatan || l.createdAt).toISOString(),
          user: { name: l.penulis?.name || "Mahasiswa" },
          type: "LOGBOOK",
        }));
    } catch {
      // Abaikan jika error
    }

    // 2. Ambil foto dari KritikSaranPemanfaatan (Lapor Pemanfaatan) berdasarkan programKerjaId
    let feedbackPhotos: any[] = [];
    try {
      const feedbacks = await (prisma as any).kritikSaranPemanfaatan.findMany({
        where: {
          programKerjaId: prokerId,
          fotoBuktiUrl: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          user: { select: { name: true } },
        },
      });
      feedbackPhotos = feedbacks
        .filter((f: any) => f.fotoBuktiUrl && f.fotoBuktiUrl.trim() !== "")
        .map((f: any) => ({
          id: f.id,
          activityTitle: f.judul || "Lapor Pemanfaatan Sampah",
          description: f.kategori || "",
          photoUrl: f.fotoBuktiUrl,
          checkIn: (f.createdAt || new Date()).toISOString(),
          user: { name: f.user?.name || f.wargaNama || "Mahasiswa" },
          type: "LAPOR_PEMANFAATAN",
        }));
    } catch {
      // Abaikan jika tabel belum di-migrate
    }

    // 3. Ambil foto dari Pemanfaatan (Catat Hasil) berdasarkan programKerjaId
    let pemanfaatanPhotos: any[] = [];
    try {
      const pemanfaatans = await prisma.pemanfaatan.findMany({
        where: {
          programKerjaId: prokerId,
          fotoDokumentasiUrl: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
      pemanfaatanPhotos = pemanfaatans
        .filter(
          (p) =>
            p.fotoDokumentasiUrl &&
            p.fotoDokumentasiUrl.trim() !== "" &&
            p.fotoDokumentasiUrl !== "null"
        )
        .map((p) => ({
          id: p.id,
          activityTitle: p.program || p.teknologi || "Catat Hasil Pemanfaatan",
          description: `Komoditas: ${p.jenisKomoditas || p.bahanBaku || "-"}`,
          photoUrl: p.fotoDokumentasiUrl,
          checkIn: (p.tanggalPencatatan || new Date()).toISOString(),
          user: { name: proker.kelompok.name },
          type: "CATAT_PEMANFAATAN",
        }));
    } catch {
      // Abaikan jika tabel belum di-migrate
    }

    // 4. Presensi Kehadiran Mahasiswa di Lapangan
    const attendancesMapped = attendances.map((a) => ({
      id: a.id,
      activityTitle: a.schedule?.title || "Kegiatan Presensi Lapangan",
      description: a.schedule?.location || a.schedule?.category || "Presensi Terverifikasi",
      photoUrl: null,
      checkIn: a.attendedAt.toISOString(),
      user: { name: a.student?.name || "Mahasiswa" },
      type: "PRESENSI",
    }));

    const allBukti = [
      ...logbookPhotos,
      ...feedbackPhotos,
      ...pemanfaatanPhotos,
      ...attendancesMapped,
    ].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    return {
      proker: {
        id: proker.id,
        nomor: proker.nomor,
        deskripsi: proker.deskripsi,
        kategori: proker.kategori,
        linkGoogleDrive: proker.linkGoogleDrive,
        kelompokName: proker.kelompok.name,
        kelurahan: proker.kelompok.kelurahan,
      },
      attendances: allBukti,
    };
  },

  /**
   * 14. Rekap Nilai Akhir & Lembar Penilaian KKN (Submenu 3)
   */
  getRekapNilaiAkhir: async (dplUserId: string, groupId?: string, role?: any) => {
    const whereGroup: any = await getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const groups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      include: {
        students: {
          include: {
            user: {
              include: {
                penilaianKkn: true,
              },
            },
          },
        },
        programKerja: true,
        penilaianMahasiswa: true,
      },
    });

    if (groups.length === 0) {
      return {
        groups: [],
        students: [],
        stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 },
      };
    }

    const allStudentsList: any[] = [];
    let totalScoreSum = 0;
    let totalAttRateSum = 0;

    const configTargets = await dplService.getConfigTargets();
    const ruleConfigs = await configService.getRuleEngineConfigs();

    for (const grp of groups) {
      const totalSchedules = await getEligiblePastSchedulesCount(grp.id);
      const prokerCount = grp.programKerja.length;
      const prokerAvgScore =
        prokerCount > 0
          ? grp.programKerja.reduce((acc, p) => acc + Number(p.skorPenilaian || 0), 0) / prokerCount
          : 0;

      for (const st of grp.students) {
        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });

        const rawPoints = Number(points._sum.points || 0);
        // Poin dampingan normalized to 0-100 scale (default base 85 if active)
        const poinDampinganScore =
          rawPoints > 0 ? Math.min(100, Math.max(70, Math.round((rawPoints / 100) * 10) + 75)) : 80;

        const attRate = await calculateStudentAttendanceRate(
          st.userId,
          totalSchedules,
          ruleConfigs,
          configTargets
        );

        const pRecord = st.user?.penilaianKkn;

        // DPL Individu Score (Murni dari input DPL, tanpa skor fiktif)
        const dplIndivRaw = pRecord?.subtotalDpl
          ? Number(pRecord.subtotalDpl)
          : st.isAssessed
            ? Number(st.assessmentScore ?? 0)
            : null;
        const dplIndiv = dplIndivRaw !== null ? dplIndivRaw : null;

        // MPL Individu Score (Murni dari input MPL, tanpa skor fiktif)
        const mplIndivRaw = pRecord?.subtotalMitra ? Number(pRecord.subtotalMitra) : null;
        const mplIndiv = mplIndivRaw !== null && mplIndivRaw > 0 ? mplIndivRaw : null;

        // Gabungan Individu: ((50 * DPL) + (50 * MPL)) / 100
        const indivGabungan =
          mplIndiv !== null && dplIndiv !== null
            ? Math.round(((50 * dplIndiv + 50 * mplIndiv) / 100) * 10) / 10
            : null;

        // Proker DPL & MPL Scores
        const dplProker =
          prokerAvgScore > 0
            ? Math.round(prokerAvgScore * 10) / 10
            : dplIndiv !== null
              ? dplIndiv
              : null;
        const mplProker = mplIndiv !== null ? mplIndiv : null;
        const prokerGabungan =
          mplProker !== null && dplProker !== null
            ? Math.round(((50 * dplProker + 50 * mplProker) / 100) * 10) / 10
            : null;

        // Kelompok DPL & MPL Scores
        const dplKelompok = dplIndiv !== null ? dplIndiv : null;
        const mplKelompok = mplIndiv !== null ? mplIndiv : null;
        const kelompokGabungan =
          mplKelompok !== null && dplKelompok !== null
            ? Math.round(((50 * dplKelompok + 50 * mplKelompok) / 100) * 10) / 10
            : null;

        // Nilai Akhir & Huruf Mutu: HANYA DITERBITKAN JIKA KEDUA PIHAK (DPL & MPL) LENGKAP
        let finalScore: number | null = null;
        let gradeLetter: string | null = null;
        let statusStr = "Menunggu Penilaian";

        if (dplIndiv === null && mplIndiv === null) {
          statusStr = "Menunggu DPL & MPL";
        } else if (dplIndiv === null) {
          statusStr = "Menunggu DPL";
        } else if (mplIndiv === null) {
          statusStr = "Menunggu MPL";
        }

        const effectiveKehadiran = attRate > 0 ? attRate : 0;
        const effectivePoin = poinDampinganScore > 0 ? poinDampinganScore : 0;

        if (
          dplIndiv !== null &&
          mplIndiv !== null &&
          indivGabungan !== null &&
          prokerGabungan !== null &&
          kelompokGabungan !== null
        ) {
          const calcScore =
            0.25 * effectiveKehadiran +
            0.15 * effectivePoin +
            0.2 * indivGabungan +
            0.2 * prokerGabungan +
            0.2 * kelompokGabungan;
          finalScore = Math.round(calcScore * 10) / 10;
          if (finalScore >= 80) gradeLetter = "A";
          else if (finalScore >= 70) gradeLetter = "B";
          else if (finalScore >= 60) gradeLetter = "C";
          else if (finalScore >= 50) gradeLetter = "D";
          else gradeLetter = "E";
          statusStr = "Lengkap";
        }

        if (finalScore !== null) {
          totalScoreSum += finalScore;
        }
        totalAttRateSum += effectiveKehadiran;

        allStudentsList.push({
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa",
          nim: st.nim || "-",
          jurusan: st.jurusan || "-",
          fakultas: st.fakultas || "-",
          kelompokId: grp.id,
          kelompokName: grp.name,
          kelurahan: grp.kelurahan || "-",
          isKetua: Boolean(st.isKetua),
          kehadiran: effectiveKehadiran,
          poinDampingan: effectivePoin,
          individuDpl: dplIndiv,
          individuMpl: mplIndiv,
          individuGabungan: indivGabungan,
          prokerDpl: dplProker,
          prokerMpl: mplProker,
          prokerGabungan: prokerGabungan,
          kelompokDpl: dplKelompok,
          kelompokMpl: mplKelompok,
          kelompokGabungan: kelompokGabungan,
          nilaiAkhir: finalScore,
          predikat: gradeLetter,
          status: statusStr,
          // Compatibility fields
          skorIndividu: dplIndiv || 0,
          catatanIndividu: st.assessmentNote || "",
          skorProkerKelompok: Math.round(prokerAvgScore * 100) / 100,
          tingkatKehadiran: effectiveKehadiran,
          hurufMutu: gradeLetter || "-",
          statusLulus: finalScore && finalScore >= 65 ? "LULUS" : "BELUM LULUS",
        });
      }
    }

    const totalStudents = allStudentsList.length;
    const rerataNilai =
      totalStudents > 0 ? Math.round((totalScoreSum / totalStudents) * 100) / 100 : 0;
    const rerataKehadiran =
      totalStudents > 0 ? Math.round((totalAttRateSum / totalStudents) * 100) / 100 : 0;

    const allProkers = groups.flatMap((g) => g.programKerja || []);
    const totalProkers = allProkers.length;

    // Helper resolver status usulan & pelaksanaan
    const resolveProkerStatus = (p: any) => {
      const legacySt = String(p.status || "").toUpperCase();
      let u = p.statusUsulan;
      if (!u) {
        if (
          legacySt === "DITERIMA" ||
          legacySt === "DISETUJUI" ||
          legacySt === "SEDANG_BERJALAN" ||
          legacySt === "SELESAI"
        )
          u = "DISETUJUI";
        else if (legacySt === "DITOLAK" || legacySt === "TIDAK_DISETUJUI") u = "DITOLAK";
        else u = "BELUM_DISETUJUI";
      }
      let pl = p.statusPelaksanaan;
      if (!pl) {
        if (legacySt === "SELESAI") pl = "SELESAI";
        else if (legacySt === "SEDANG_BERJALAN" || legacySt === "SEDANG_DILAKSANAKAN")
          pl = "SEDANG_BERJALAN";
        else pl = "BELUM_MULAI";
      }
      return { usulan: u, pelaksanaan: pl };
    };

    const totalUsulanDisetujui = allProkers.filter(
      (p) => resolveProkerStatus(p).usulan === "DISETUJUI"
    ).length;
    const totalUsulanDitolak = allProkers.filter(
      (p) => resolveProkerStatus(p).usulan === "DITOLAK"
    ).length;
    const totalUsulanMenunggu = allProkers.filter(
      (p) => resolveProkerStatus(p).usulan === "BELUM_DISETUJUI"
    ).length;

    const totalPelaksanaanBelumMulai = allProkers.filter(
      (p) => resolveProkerStatus(p).pelaksanaan === "BELUM_MULAI"
    ).length;
    const totalPelaksanaanSedangBerjalan = allProkers.filter(
      (p) => resolveProkerStatus(p).pelaksanaan === "SEDANG_BERJALAN"
    ).length;
    const totalPelaksanaanSelesai = allProkers.filter(
      (p) => resolveProkerStatus(p).pelaksanaan === "SELESAI"
    ).length;

    return {
      groups: groups.map((g) => {
        const grpProkers = g.programKerja || [];
        return {
          id: g.id,
          name: g.name,
          kelurahan: g.kelurahan || null,
          totalProker: grpProkers.length,
          usulanDisetujui: grpProkers.filter((p) => resolveProkerStatus(p).usulan === "DISETUJUI")
            .length,
          usulanDitolak: grpProkers.filter((p) => resolveProkerStatus(p).usulan === "DITOLAK")
            .length,
          usulanMenunggu: grpProkers.filter(
            (p) => resolveProkerStatus(p).usulan === "BELUM_DISETUJUI"
          ).length,
          pelaksanaanBelumMulai: grpProkers.filter(
            (p) => resolveProkerStatus(p).pelaksanaan === "BELUM_MULAI"
          ).length,
          pelaksanaanSedangBerjalan: grpProkers.filter(
            (p) => resolveProkerStatus(p).pelaksanaan === "SEDANG_BERJALAN"
          ).length,
          pelaksanaanSelesai: grpProkers.filter(
            (p) => resolveProkerStatus(p).pelaksanaan === "SELESAI"
          ).length,
          // Compatibility fields
          prokerDisetujui: grpProkers.filter((p) => resolveProkerStatus(p).usulan === "DISETUJUI")
            .length,
          prokerTidakDisetujui: grpProkers.filter(
            (p) => resolveProkerStatus(p).usulan === "DITOLAK"
          ).length,
          prokerSedangDilaksanakan: grpProkers.filter(
            (p) => resolveProkerStatus(p).pelaksanaan === "SEDANG_BERJALAN"
          ).length,
          prokerSelesai: grpProkers.filter((p) => resolveProkerStatus(p).pelaksanaan === "SELESAI")
            .length,
        };
      }),
      students: allStudentsList,
      stats: {
        totalStudents,
        rerataNilai,
        rerataKehadiran,
        proker: {
          total: totalProkers,
          usulan: {
            disetujui: totalUsulanDisetujui,
            ditolak: totalUsulanDitolak,
            menunggu: totalUsulanMenunggu,
          },
          pelaksanaan: {
            belumMulai: totalPelaksanaanBelumMulai,
            sedangBerjalan: totalPelaksanaanSedangBerjalan,
            selesai: totalPelaksanaanSelesai,
          },
          // Compatibility fields
          disetujui: totalUsulanDisetujui,
          tidakDisetujui: totalUsulanDitolak,
          sedangDilaksanakan: totalPelaksanaanSedangBerjalan,
          selesai: totalPelaksanaanSelesai,
        },
      },
    };
  },

  /**
   * 15. Target & Konfigurasi KKN (Fetch & Update Real DB SystemConfig)
   */
  getConfigTargets: async () => {
    const keys = [
      "kkn_target_total_kegiatan",
      "kkn_target_total_jam",
      "kkn_target_harian_jam",
      "kkn_target_harian_kegiatan",
      "kkn_hari_kerja",
      "kkn_jam_kerja",
      "kkn_target_pekan",
      "kkn_target_total_hari",
      "kkn_catatan_dpl",
      "attendance_min_duration_hours",
      "attendance_min_duration_minutes",
      "attendance_min_duration_seconds",
    ];

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    const targetHariTotal = Number(configMap.get("kkn_target_total_hari") || 50);
    const targetJamRaw = Number(configMap.get("kkn_target_total_jam"));
    const targetJamTotal = !isNaN(targetJamRaw) && targetJamRaw > 0 ? targetJamRaw : 200;

    let minHours = Number(configMap.get("attendance_min_duration_hours") ?? 0);
    let minMinutes = Number(configMap.get("attendance_min_duration_minutes") ?? 0);
    let minSeconds = Number(configMap.get("attendance_min_duration_seconds") ?? 0);

    let minTotalHours = (minHours * 3600 + minMinutes * 60 + minSeconds) / 3600;

    // Otomatisasi: Jika durasi minimal harian belum diatur atau nilai uji coba lama (< 0.05 jam saat target kumulatif >= 10 jam)
    const autoDailyMins =
      targetHariTotal > 0 ? Math.round((targetJamTotal * 60) / targetHariTotal) : 240;
    if (minTotalHours <= 0 || (minTotalHours < 0.05 && targetJamTotal >= 10)) {
      minHours = Math.floor(autoDailyMins / 60);
      minMinutes = autoDailyMins % 60;
      minSeconds = 0;
      minTotalHours = (minHours * 60 + minMinutes) / 60;
    }

    const targetHarianRaw = Number(configMap.get("kkn_target_harian_jam"));
    const targetHarian =
      !isNaN(targetHarianRaw) && targetHarianRaw > 0 && targetHarianRaw >= 0.05
        ? targetHarianRaw
        : minTotalHours;

    return {
      targetTotalKegiatan: Number(configMap.get("kkn_target_total_kegiatan") || 2000),
      targetTotalJam: targetJamTotal,
      targetHarianJam: targetHarian,
      targetHarianKegiatan: Number(configMap.get("kkn_target_harian_kegiatan") || 5),
      attendanceMinDurationHours: minHours,
      attendanceMinDurationMinutes: minMinutes,
      attendanceMinDurationSeconds: minSeconds,
      hariKerja: (configMap.get("kkn_hari_kerja") || "Senin - Jumat")
        .replace(/\?{2,3}|â€“|–|—/g, " - ")
        .replace(/\s+-\s+/g, " - ")
        .trim(),
      jamKerja: (configMap.get("kkn_jam_kerja") || "08:00 - 19:00 WIB")
        .replace(/\?{2,3}|â€“|–|—/g, " - ")
        .replace(/\s+-\s+/g, " - ")
        .trim(),
      targetPekan: Number(configMap.get("kkn_target_pekan") || 10),
      targetTotalHari: targetHariTotal,
      catatanDpl:
        configMap.get("kkn_catatan_dpl") ||
        `Pastikan mahasiswa hadir minimal ${minHours > 0 ? `${minHours} jam ` : ""}${minMinutes > 0 ? `${minMinutes} menit ` : ""}per hari di lokasi kegiatan. Verifikasi lokasi melalui GPS dan unduh berita acara sebagai bukti validasi.`,
    };
  },

  updateConfigTargets: async (data: {
    targetTotalKegiatan?: number;
    targetTotalJam?: number;
    targetHarianJam?: number;
    targetHarianKegiatan?: number;
    attendanceMinDurationHours?: number;
    attendanceMinDurationMinutes?: number;
    attendanceMinDurationSeconds?: number;
    hariKerja?: string;
    jamKerja?: string;
    targetPekan?: number;
    targetTotalHari?: number;
    catatanDpl?: string;
    updatedBy?: string;
  }) => {
    const targetHari =
      data.targetTotalHari !== undefined ? Number(data.targetTotalHari) : undefined;
    const targetJam = data.targetTotalJam !== undefined ? Number(data.targetTotalJam) : undefined;

    // Jika durasi harian tidak dioper secara eksplisit namun total jam dan total hari ada, hitung otomatis
    if (targetJam !== undefined && targetHari !== undefined && targetHari > 0) {
      if (
        data.attendanceMinDurationHours === undefined &&
        data.attendanceMinDurationMinutes === undefined
      ) {
        const dailyMins = Math.round((targetJam * 60) / targetHari);
        data.attendanceMinDurationHours = Math.floor(dailyMins / 60);
        data.attendanceMinDurationMinutes = dailyMins % 60;
        data.attendanceMinDurationSeconds = 0;
        data.targetHarianJam = dailyMins / 60;
      }
    }

    const updates: { key: string; value: string; desc: string; tipe: string }[] = [];
    if (data.targetTotalKegiatan !== undefined) {
      updates.push({
        key: "kkn_target_total_kegiatan",
        value: String(data.targetTotalKegiatan),
        desc: "Target total seluruh kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetTotalJam !== undefined) {
      updates.push({
        key: "kkn_target_total_jam",
        value: String(data.targetTotalJam),
        desc: "Target minimal jam kumulatif kegiatan mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetHarianJam !== undefined) {
      updates.push({
        key: "kkn_target_harian_jam",
        value: String(data.targetHarianJam),
        desc: "Target minimum jam per hari mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetHarianKegiatan !== undefined) {
      updates.push({
        key: "kkn_target_harian_kegiatan",
        value: String(data.targetHarianKegiatan),
        desc: "Target minimum kegiatan per hari mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.attendanceMinDurationHours !== undefined) {
      updates.push({
        key: "attendance_min_duration_hours",
        value: String(data.attendanceMinDurationHours),
        desc: "Durasi minimal presensi KKN (Jam)",
        tipe: "NUMBER",
      });
    }
    if (data.attendanceMinDurationMinutes !== undefined) {
      updates.push({
        key: "attendance_min_duration_minutes",
        value: String(data.attendanceMinDurationMinutes),
        desc: "Durasi minimal presensi KKN (Menit)",
        tipe: "NUMBER",
      });
    }
    if (data.attendanceMinDurationSeconds !== undefined) {
      updates.push({
        key: "attendance_min_duration_seconds",
        value: String(data.attendanceMinDurationSeconds),
        desc: "Durasi minimal presensi KKN (Detik)",
        tipe: "NUMBER",
      });
    }
    if (data.hariKerja !== undefined) {
      const cleanVal = String(data.hariKerja)
        .replace(/\?{2,3}|â€“|–|—/g, " - ")
        .replace(/\s+-\s+/g, " - ")
        .trim();
      updates.push({
        key: "kkn_hari_kerja",
        value: cleanVal,
        desc: "Hari kerja operasional KKN",
        tipe: "STRING",
      });
    }
    if (data.jamKerja !== undefined) {
      const cleanVal = String(data.jamKerja)
        .replace(/\?{2,3}|â€“|–|—/g, " - ")
        .replace(/\s+-\s+/g, " - ")
        .trim();
      updates.push({
        key: "kkn_jam_kerja",
        value: cleanVal,
        desc: "Jam operasional kerja KKN",
        tipe: "STRING",
      });
    }
    if (data.targetPekan !== undefined) {
      updates.push({
        key: "kkn_target_pekan",
        value: String(data.targetPekan),
        desc: "Periode pekan kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetTotalHari !== undefined) {
      updates.push({
        key: "kkn_target_total_hari",
        value: String(data.targetTotalHari),
        desc: "Total hari kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.catatanDpl !== undefined) {
      updates.push({
        key: "kkn_catatan_dpl",
        value: String(data.catatanDpl),
        desc: "Catatan panduan presensi untuk DPL",
        tipe: "STRING",
      });
    }

    for (const u of updates) {
      await configService.updateConfig(u.key, u.value);
    }

    return await dplService.getConfigTargets();
  },

  // ─────────────────────────────────────────────
  // 12. LOG AKTIVITAS DPL (WEB ENTRY & MONITORING)
  // ─────────────────────────────────────────────
  getDplActivityLogs: async (
    dplUserId: string,
    role: any,
    params?: {
      search?: string;
      groupId?: string;
      kategori?: string;
      status?: string;
      pekanKe?: number;
      page?: number;
      limit?: number;
    }
  ) => {
    const isSuper = isDplSuperUser(role);

    const allowedGroups = await prisma.kelompokKkn.findMany({
      where: await getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    const allowedGroupIds = allowedGroups.map((g) => g.id);

    const where: any = {};

    if (!isSuper) {
      where.OR = [
        { dplId: dplUserId },
        { kelompokId: { in: allowedGroupIds } },
        { kelompok: { dplId: dplUserId } },
      ];
    }

    if (params?.groupId && params.groupId !== "ALL" && params.groupId !== "Semua Kelompok") {
      where.kelompokId = params.groupId;
    }

    if (params?.kategori && params.kategori !== "ALL" && params.kategori !== "Semua Kategori") {
      where.kategori = { equals: params.kategori, mode: "insensitive" };
    }

    if (params?.status && params.status !== "ALL" && params.status !== "Semua Status") {
      where.status = params.status;
    }

    if (
      params?.pekanKe !== undefined &&
      params.pekanKe !== null &&
      !isNaN(Number(params.pekanKe))
    ) {
      where.pekanKe = Number(params.pekanKe);
    }

    if (params?.search && params.search.trim() !== "") {
      const q = params.search.trim();
      const searchCondition = {
        OR: [
          { deskripsi: { contains: q, mode: "insensitive" } },
          { tempat: { contains: q, mode: "insensitive" } },
          { arahanEvaluasi: { contains: q, mode: "insensitive" } },
          { kelompok: { name: { contains: q, mode: "insensitive" } } },
        ],
      };
      if (where.OR) {
        where.AND = [searchCondition];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // 1. Ambil Agregasi Statistik Real Database
    const baseWhereForDpl: any = isSuper
      ? {}
      : {
          OR: [
            { dplId: dplUserId },
            { kelompokId: { in: allowedGroupIds } },
            { kelompok: { dplId: dplUserId } },
          ],
        };
    if (params?.groupId && params.groupId !== "ALL" && params.groupId !== "Semua Kelompok") {
      baseWhereForDpl.kelompokId = params.groupId;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [allLogsForStats, totalMatching, items] = await Promise.all([
      prisma.logbookDpl.findMany({
        where: baseWhereForDpl,
        select: {
          id: true,
          tanggal: true,
          status: true,
          durasiMenit: true,
        },
      }),
      prisma.logbookDpl.count({ where }),
      prisma.logbookDpl.findMany({
        where,
        include: {
          kelompok: {
            select: {
              id: true,
              name: true,
              kelurahan: true,
            },
          },
          dpl: {
            select: {
              id: true,
              name: true,
              nip: true,
              fotoProfil: true,
            },
          },
        },
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
        skip: params?.page && params?.limit ? (params.page - 1) * params.limit : undefined,
        take: params?.limit ? params.limit : undefined,
      }),
    ]);

    // Kalkulasi 4 Indikator Statistik
    const totalAktivitas = allLogsForStats.length;
    let bulanIniCount = 0;
    let totalDurasiMenit = 0;
    let belumDikirimCount = 0;

    for (const log of allLogsForStats) {
      const logDate = new Date(log.tanggal);
      if (logDate >= startOfMonth && logDate <= endOfMonth) {
        bulanIniCount++;
      }
      totalDurasiMenit += log.durasiMenit || 120;
      if (log.status === "DRAF") {
        belumDikirimCount++;
      }
    }

    const totalDurasiHours = Math.round(totalDurasiMenit / 60);
    const totalDurasiLabel = `${totalDurasiHours} jam`;

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const totalPages = Math.max(1, Math.ceil(totalMatching / limit));

    // Resolve Program Kerja deskripsi via database relation ID
    const prokerIds = items.map((it) => it.programKerjaId).filter(Boolean) as string[];
    const prokerMap = new Map<string, string>();
    if (prokerIds.length > 0) {
      const prokerList = await prisma.programKerjaKkn.findMany({
        where: { id: { in: prokerIds } },
        select: { id: true, deskripsi: true, nomor: true },
      });
      prokerList.forEach((p) => {
        prokerMap.set(p.id, p.nomor ? `Proker #${p.nomor}: ${p.deskripsi}` : p.deskripsi);
      });
    }

    return {
      stats: {
        totalAktivitas,
        bulanIni: bulanIniCount,
        totalDurasi: totalDurasiLabel,
        totalDurasiJam: totalDurasiHours,
        belumDikirim: belumDikirimCount,
      },
      items: items.map((item) => {
        const itemDate = new Date(item.tanggal);
        const dateFormatted = itemDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // Bukti Label
        let buktiLabel = "—";
        const rawBukti = (item.fotoBuktiUrl || "").trim();
        const validBuktiList =
          rawBukti && rawBukti !== "null" && rawBukti !== "undefined" && rawBukti !== "-"
            ? Array.from(
                new Set(
                  rawBukti
                    .split(/[,;]/)
                    .map((u) => u.trim())
                    .filter(Boolean)
                )
              )
            : [];
        const validBukti = validBuktiList.length > 0 ? validBuktiList.join(",") : null;
        if (validBukti) {
          if (validBuktiList.length > 1) {
            buktiLabel = `${validBuktiList.length} Foto`;
          } else if (validBukti.endsWith(".pdf")) {
            buktiLabel = "Dokumen";
          } else if (validBukti.includes("notula") || validBukti.includes("doc")) {
            buktiLabel = "Notula";
          } else {
            buktiLabel = "1 Foto";
          }
        }

        const waktuM = item.waktuMulai || "09.00";
        const waktuS = item.waktuSelesai || "11.00";
        const waktuLengkap = `${waktuM}–${waktuS}`;
        const kat = item.kategori || "Kunjungan Lapangan";
        const st = item.status || "TERKIRIM";
        const durasiM = item.durasiMenit || 120;
        const durasiH = Math.floor(durasiM / 60);
        const durasiRemM = durasiM % 60;
        const durasiLabel =
          durasiH > 0 && durasiRemM > 0
            ? `${durasiH} jam ${durasiRemM} menit`
            : durasiH > 0
              ? `${durasiH} jam`
              : `${durasiM} menit`;

        return {
          id: item.id,
          dplId: item.dplId,
          dplNama: item.dpl?.name || "DPL",
          kelompokId: item.kelompokId,
          kelompokNama: item.kelompok?.name || "Kelompok KKN",
          kelurahan: item.kelompok?.kelurahan || "-",
          tanggal: item.tanggal.toISOString().split("T")[0],
          tanggalFormatted: dateFormatted,
          waktuMulai: waktuM,
          waktuSelesai: waktuS,
          waktuLengkap: waktuLengkap,
          kategori: kat,
          lokasi: item.tempat || "RW Dampingan",
          tempat: item.tempat,
          ringkasanAktivitas: item.deskripsi,
          deskripsi: item.deskripsi,
          hasilTindakLanjut: item.arahanEvaluasi || "",
          arahanEvaluasi: item.arahanEvaluasi || "",
          programKerjaId: item.programKerjaId || null,
          programKerjaDeskripsi: item.programKerjaId
            ? prokerMap.get(item.programKerjaId) || null
            : null,
          durasiMenit: durasiM,
          durasi: durasiLabel,
          bukti: buktiLabel,
          fotoBuktiUrl: validBukti,
          simpanLokasi: item.simpanLokasi ?? true,
          status: st,
          pekanKe: item.pekanKe || 1,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
      pagination: {
        total: totalMatching,
        page,
        limit,
        totalPages,
      },
    };
  },

  createDplActivityLog: async (
    dplUserId: string,
    role: any,
    data: {
      kelompokId: string;
      tanggal: string;
      waktuMulai?: string;
      waktuSelesai?: string;
      kategori?: string;
      tempat?: string;
      lokasi?: string;
      programKerjaId?: string;
      deskripsi: string;
      hasilTindakLanjut?: string;
      arahanEvaluasi?: string;
      fotoBuktiUrl?: string;
      simpanLokasi?: boolean;
      status?: "DRAF" | "TERKIRIM" | "TERVERIFIKASI";
      pekanKe?: number;
    }
  ) => {
    if (!data.kelompokId) throw new Error("Pilih kelompok dampingan");
    if (!data.tanggal) throw new Error("Tanggal kegiatan wajib diisi");
    if (!data.deskripsi || data.deskripsi.trim() === "")
      throw new Error("Uraian aktivitas wajib diisi");

    const requestedStatus = data.status || "TERKIRIM";
    const isSuper = isDplSuperUser(role);
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: data.kelompokId },
    });

    if (!kelompok) throw new Error("Kelompok KKN tidak ditemukan");
    if (!isSuper) {
      const allowedGroups = await prisma.kelompokKkn.findMany({
        where: await getKelompokWhere(dplUserId, role),
        select: { id: true },
      });
      const allowedGroupIds = allowedGroups.map((g) => g.id);
      if (
        kelompok.dplId &&
        kelompok.dplId !== dplUserId &&
        !allowedGroupIds.includes(kelompok.id)
      ) {
        throw new Error(
          "Akses ditolak: Anda hanya dapat mencatat aktivitas untuk kelompok dampingan Anda."
        );
      }
    }

    // Auto-link kelompok to DPL if unlinked
    if (!kelompok.dplId) {
      await prisma.kelompokKkn.update({
        where: { id: kelompok.id },
        data: { dplId: dplUserId },
      });
    }

    const logDate = new Date(data.tanggal);
    if (isNaN(logDate.getTime())) throw new Error("Format tanggal tidak valid");

    const lokasiVal = data.lokasi || data.tempat || "RW Dampingan";

    // Calculate duration minutes
    let durasiMenit = 120;
    if (data.waktuMulai && data.waktuSelesai) {
      const parseM = (t: string) => {
        const p = t.replace(".", ":").split(":");
        return parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10);
      };
      const s = parseM(data.waktuMulai);
      const e = parseM(data.waktuSelesai);
      if (e <= s) {
        throw new Error("Waktu selesai harus lebih besar dari waktu mulai");
      }
      durasiMenit = e - s;
    }

    let cleanFotoBukti: string | null = null;
    if (
      data.fotoBuktiUrl &&
      typeof data.fotoBuktiUrl === "string" &&
      data.fotoBuktiUrl.trim() !== "" &&
      data.fotoBuktiUrl !== "null"
    ) {
      const uniqueUrls = Array.from(
        new Set(
          data.fotoBuktiUrl
            .split(/[,;]/)
            .map((u) => u.trim())
            .filter(Boolean)
        )
      );
      cleanFotoBukti = uniqueUrls.length > 0 ? uniqueUrls.join(",") : null;
    }

    const created = await prisma.logbookDpl.create({
      data: {
        dplId: dplUserId,
        kelompokId: data.kelompokId,
        tanggal: logDate,
        waktuMulai: data.waktuMulai || "09.00",
        waktuSelesai: data.waktuSelesai || "11.00",
        kategori: data.kategori || "Kunjungan Lapangan",
        pekanKe: data.pekanKe ? Number(data.pekanKe) : 1,
        tempat: lokasiVal,
        programKerjaId: data.programKerjaId || null,
        deskripsi: data.deskripsi.trim(),
        arahanEvaluasi: data.arahanEvaluasi?.trim() || data.hasilTindakLanjut?.trim() || null,
        fotoBuktiUrl: cleanFotoBukti,
        status: requestedStatus,
        durasiMenit,
        simpanLokasi: data.simpanLokasi ?? true,
      },
      include: {
        kelompok: { select: { name: true } },
      },
    });

    return created;
  },

  updateDplActivityLog: async (
    id: string,
    dplUserId: string,
    role: any,
    data: {
      kelompokId?: string;
      tanggal?: string;
      waktuMulai?: string;
      waktuSelesai?: string;
      kategori?: string;
      tempat?: string;
      lokasi?: string;
      programKerjaId?: string;
      deskripsi?: string;
      hasilTindakLanjut?: string;
      arahanEvaluasi?: string;
      fotoBuktiUrl?: string;
      simpanLokasi?: boolean;
      status?: "DRAF" | "TERKIRIM" | "TERVERIFIKASI";
      pekanKe?: number;
    }
  ) => {
    const isSuper = isDplSuperUser(role);
    const existing = await prisma.logbookDpl.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Aktivitas DPL tidak ditemukan");
    if (!isSuper && existing.dplId !== dplUserId) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin mengedit aktivitas ini.");
    }

    const updateData: any = {};

    if (data.kelompokId) updateData.kelompokId = data.kelompokId;
    if (data.tanggal) updateData.tanggal = new Date(data.tanggal);
    if (data.waktuMulai !== undefined) updateData.waktuMulai = data.waktuMulai;
    if (data.waktuSelesai !== undefined) updateData.waktuSelesai = data.waktuSelesai;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.programKerjaId !== undefined) updateData.programKerjaId = data.programKerjaId || null;
    if (data.pekanKe !== undefined) updateData.pekanKe = Number(data.pekanKe);
    if (data.lokasi !== undefined || data.tempat !== undefined) {
      const loc = data.lokasi || data.tempat || existing.tempat;
      updateData.tempat = loc;
    }
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi.trim();
    if (data.arahanEvaluasi !== undefined || data.hasilTindakLanjut !== undefined) {
      updateData.arahanEvaluasi =
        data.arahanEvaluasi?.trim() || data.hasilTindakLanjut?.trim() || null;
    }
    if (data.fotoBuktiUrl !== undefined) {
      if (
        typeof data.fotoBuktiUrl === "string" &&
        data.fotoBuktiUrl.trim() !== "" &&
        data.fotoBuktiUrl !== "null"
      ) {
        const uniqueUrls = Array.from(
          new Set(
            data.fotoBuktiUrl
              .split(/[,;]/)
              .map((u) => u.trim())
              .filter(Boolean)
          )
        );
        updateData.fotoBuktiUrl = uniqueUrls.length > 0 ? uniqueUrls.join(",") : null;
      } else {
        updateData.fotoBuktiUrl = null;
      }
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.simpanLokasi !== undefined) updateData.simpanLokasi = Boolean(data.simpanLokasi);

    const startT = data.waktuMulai || existing.waktuMulai;
    const endT = data.waktuSelesai || existing.waktuSelesai;
    if (startT && endT) {
      const parseM = (t: string) => {
        const p = t.replace(".", ":").split(":");
        return parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10);
      };
      const s = parseM(startT);
      const e = parseM(endT);
      if (e <= s) {
        throw new Error("Waktu selesai harus lebih besar dari waktu mulai");
      }
      updateData.durasiMenit = e - s;
    }

    const updated = await prisma.logbookDpl.update({
      where: { id },
      data: updateData,
      include: {
        kelompok: { select: { name: true } },
      },
    });

    return updated;
  },

  deleteDplActivityLog: async (id: string, dplUserId: string, role: any) => {
    const isSuper = isDplSuperUser(role);
    const existing = await prisma.logbookDpl.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Aktivitas DPL tidak ditemukan");
    if (!isSuper && existing.dplId !== dplUserId) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin menghapus aktivitas ini.");
    }

    await prisma.logbookDpl.delete({
      where: { id },
    });

    return { success: true, message: "Aktivitas DPL berhasil dihapus" };
  },
};
