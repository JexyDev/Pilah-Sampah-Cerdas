import { prisma } from "../lib/prisma.js";
import { websocketService } from "./websocketService.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

function sanitizeString(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/<[^>]*>?/gm, "") // strip HTML/Script tags
    .trim();
}

function calculateNilaiEkonomi(program: string, teknologi: string, hasil: number, _unitHasil: string): number {
  const h = Number(hasil) || 0;
  if (h <= 0) return 0;
  const t = (teknologi || "").toLowerCase();
  const p = (program || "").toLowerCase();

  if (t.includes("maggot") || p.includes("maggot")) {
    return Math.round(h * 8000); // Rp 8.000 / Kg
  }
  if (t.includes("poc") || t.includes("cair") || p.includes("poc")) {
    return Math.round(h * 15000); // Rp 15.000 / Liter
  }
  if (t.includes("bank") || p.includes("bank")) {
    return Math.round(h * 3000); // Rp 3.000 / Kg
  }
  return Math.round(h * 2500); // Rp 2.500 / Kg default kompos
}

function formatPemanfaatanRecord(item: any) {
  const bahanMasuk = Number(item.volumeBahanBaku || 0);
  const hasil = Number(item.hasil || 0);
  const nilaiEkonomi = calculateNilaiEkonomi(item.program, item.teknologi, hasil, item.unitHasil);

  const rwName = item.rw?.name || (item.rwId ? `RW ${item.rwId}` : "RW 01");

  const rawProgram = item.program || "Program Pengolahan Mandiri";
  let cleanProgramName = rawProgram.split("\n")[0].trim();
  if (cleanProgramName.includes(" - ")) {
    cleanProgramName = cleanProgramName.split(" - ")[0].trim();
  } else if (cleanProgramName.includes(" : ")) {
    cleanProgramName = cleanProgramName.split(" : ")[0].trim();
  } else if (cleanProgramName.includes(" – ")) {
    cleanProgramName = cleanProgramName.split(" – ")[0].trim();
  }

  return {
    ...item,
    // Standard UI / Mobile mapped keys
    namaProgram: cleanProgramName || "Program Pengolahan Mandiri",
    jenisProgram: item.teknologi || "Kompos Organik",
    kategoriBahan: (item.bahanBaku || "").toLowerCase().includes("anorganik") ? "ANORGANIK" : "ORGANIK",
    jumlahBahanMasukKg: bahanMasuk,
    jumlahHasilKg: hasil,
    unitHasil: item.unitHasil || "Kg",
    lokasiFasilitas: `Fasilitas ${item.teknologi || "Komunal"} (${rwName})`,
    penanggungJawab: "Pengelola RW & Mahasiswa KKN",
    targetPenerimaManfaat: item.jenisKomoditas
      ? `Kelompok Tani / Buruan Sae (${item.jenisKomoditas})`
      : "Warga Sekitar RW",
    nilaiEkonomiRp: nilaiEkonomi,
    status: hasil > 0 ? "PANEN" : "PROSES",
    tanggalPencatatan: item.tanggalPencatatan
      ? new Date(item.tanggalPencatatan).toISOString()
      : new Date().toISOString(),
  };
}

export class PemanfaatanService {
  async create(data: {
    rwId: number;
    nomorCaraPemanfaatan: string;
    program: string;
    teknologi: string;
    bahanBaku: string;
    volumeBahanBaku: number;
    unitBahanBaku: string;
    hasil: number;
    unitHasil: string;
    fotoDokumentasiUrl: string;
    tanggalPencatatan: Date;
    jenisKomoditas?: string;
    luasLahanM2?: number;
    volumePupukDipakaiKg?: number;
    bibitTelurGram?: number;
    hasilKasgotKg?: number;
    volumeBioaktivatorLiter?: number;
    masaFermentasiHari?: number;
  }) {
    const sanitizedData = {
      ...data,
      program: sanitizeString(data.program),
      teknologi: sanitizeString(data.teknologi),
      bahanBaku: sanitizeString(data.bahanBaku),
      jenisKomoditas: data.jenisKomoditas ? sanitizeString(data.jenisKomoditas) : undefined,
    };

    const created = await prisma.pemanfaatan.create({
      data: {
        ...sanitizedData,
        volumeBahanBaku: sanitizedData.volumeBahanBaku,
        hasil: sanitizedData.hasil,
      },
      include: {
        rw: { include: { kelurahan: true } },
      },
    });

    const formatted = formatPemanfaatanRecord(created);
    try {
      websocketService.broadcastPemanfaatanUpdate({ action: "CREATE", data: formatted });
    } catch (_e) {}

    return formatted;
  }

  async getAll(user?: any) {
    let whereClause: any = undefined;

    if (user) {
      const roleName = String(user.role || "").toUpperCase();

      if (roleName === "DPL" || roleName === "DOSEN_PEMBIMBING") {
        const userId = user.userId || user.id;
        const kelompoks = await prisma.kelompokKkn.findMany({
          where: { dplId: userId },
        });

        if (kelompoks.length > 0) {
          const kelurahanNames = kelompoks
            .map((k) => k.kelurahan)
            .filter((k): k is string => Boolean(k));

          const allCakupanRw: string[] = [];
          kelompoks.forEach((k) => {
            if (Array.isArray(k.cakupanRw)) {
              (k.cakupanRw as any[]).forEach((r) => {
                const s = String(r).trim();
                if (/^\d+$/.test(s)) {
                  allCakupanRw.push(`RW ${s.length === 1 ? `0${s}` : s}`);
                } else {
                  allCakupanRw.push(s);
                }
              });
            }
          });

          if (kelurahanNames.length > 0) {
            whereClause = {
              rw: {
                kelurahan: {
                  name: { in: kelurahanNames, mode: "insensitive" },
                },
                ...(allCakupanRw.length > 0 ? { name: { in: allCakupanRw } } : {}),
              },
            };
          }
        }
      } else if (roleName === "RW") {
        const rwId = user.rwId || user.rtRwId;
        if (rwId) {
          whereClause = { rwId: Number(rwId) };
        }
      } else if (roleName === "LURAH" && user.kelurahan) {
        whereClause = {
          rw: {
            kelurahan: {
              name: { equals: user.kelurahan, mode: "insensitive" },
            },
          },
        };
      }
    }

    const items = await prisma.pemanfaatan.findMany({
      where: whereClause,
      include: {
        rw: { include: { kelurahan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map(formatPemanfaatanRecord);
  }

  async getById(id: string) {
    if (id === "feedback" || id === "feedbacks" || id === "kritik-saran" || id === "ulasan") {
      return this.getAllFeedback();
    }
    const item = await prisma.pemanfaatan.findUnique({
      where: { id },
      include: {
        rw: { include: { kelurahan: true } },
      },
    });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");
    return formatPemanfaatanRecord(item);
  }

  async update(
    id: string,
    data: {
      rwId?: number;
      nomorCaraPemanfaatan?: string;
      program?: string;
      teknologi?: string;
      bahanBaku?: string;
      volumeBahanBaku?: number;
      unitBahanBaku?: string;
      hasil?: number;
      unitHasil?: string;
      fotoDokumentasiUrl?: string;
      tanggalPencatatan?: Date;
      jenisKomoditas?: string;
      luasLahanM2?: number;
      volumePupukDipakaiKg?: number;
      bibitTelurGram?: number;
      hasilKasgotKg?: number;
      volumeBioaktivatorLiter?: number;
      masaFermentasiHari?: number;
    }
  ) {
    const item = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");

    const sanitizedData = {
      ...data,
      program: data.program ? sanitizeString(data.program) : undefined,
      teknologi: data.teknologi ? sanitizeString(data.teknologi) : undefined,
      bahanBaku: data.bahanBaku ? sanitizeString(data.bahanBaku) : undefined,
      jenisKomoditas: data.jenisKomoditas ? sanitizeString(data.jenisKomoditas) : undefined,
    };

    const updated = await prisma.pemanfaatan.update({
      where: { id },
      data: sanitizedData,
      include: {
        rw: { include: { kelurahan: true } },
      },
    });

    const formatted = formatPemanfaatanRecord(updated);
    try {
      websocketService.broadcastPemanfaatanUpdate({ action: "UPDATE", data: formatted });
    } catch (_e) {}

    return formatted;
  }

  async delete(id: string) {
    const item = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");

    await prisma.pemanfaatan.delete({
      where: { id },
    });

    try {
      websocketService.broadcastPemanfaatanUpdate({ action: "DELETE", id });
    } catch (_e) {}

    return { success: true, id };
  }

  // ─────────────────────────────────────────────
  // KRITIK & SARAN / FEEDBACK METHODS (BULLETPROOF DB QUERY)
  // ─────────────────────────────────────────────

  async getAllFeedback(query?: { status?: string; kategori?: string; search?: string }) {
    try {
      if ((prisma as any).kritikSaranPemanfaatan?.findMany) {
        const where: any = {};
        if (query?.status && query.status !== "ALL") {
          where.status = query.status;
        }
        if (query?.kategori && query.kategori !== "ALL") {
          where.kategori = query.kategori;
        }
        if (query?.search) {
          const q = query.search.toLowerCase();
          where.OR = [
            { judul: { contains: q, mode: "insensitive" } },
            { isiKritikSaran: { contains: q, mode: "insensitive" } },
            { wargaNama: { contains: q, mode: "insensitive" } },
          ];
        }

        return await (prisma as any).kritikSaranPemanfaatan.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, phone: true } },
            rw: { include: { kelurahan: true } },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma delegate failed, using direct query fallback:", err);
    }

    // Direct SQL Fallback
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        f.id,
        f.id_pengguna AS "userId",
        f.warga_nama AS "wargaNama",
        f.kategori,
        f.judul,
        f.isi_kritik_saran AS "isiKritikSaran",
        f.rating,
        f.status,
        f.tanggapan,
        f.ditanggapi_oleh AS "ditanggapiOleh",
        f.ditanggapi_pada AS "ditanggapiPada",
        f.foto_bukti_url AS "fotoBuktiUrl",
        f.id_rw AS "rwId",
        f.dibuat_pada AS "createdAt",
        f.diperbarui_pada AS "updatedAt",
        r.nama AS "rwName",
        k.nama AS "kelurahanName"
      FROM kritik_saran_pemanfaatan f
      LEFT JOIN rw r ON f.id_rw = r.id
      LEFT JOIN kelurahan k ON r.id_kelurahan = k.id
      ORDER BY f.dibuat_pada DESC
    `);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      wargaNama: r.wargaNama,
      kategori: r.kategori,
      judul: r.judul,
      isiKritikSaran: r.isiKritikSaran,
      rating: Number(r.rating || 5),
      status: r.status,
      tanggapan: r.tanggapan,
      ditanggapiOleh: r.ditanggapiOleh,
      ditanggapiPada: r.ditanggapiPada,
      fotoBuktiUrl: r.fotoBuktiUrl,
      rwId: r.rwId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      rw: r.rwName ? { id: r.rwId, name: r.rwName, kelurahan: r.kelurahanName ? { name: r.kelurahanName } : null } : null,
    }));
  }

  async createFeedback(data: {
    userId: string;
    wargaNama: string;
    kategori?: string;
    judul: string;
    isiKritikSaran: string;
    rating?: number;
    rwId?: number;
    fotoBuktiUrl?: string;
  }) {
    const cleanJudul = sanitizeString(data.judul);
    const cleanIsi = sanitizeString(data.isiKritikSaran);
    const cleanKategori = sanitizeString(data.kategori || "Pemanfaatan Sampah");
    const cleanWargaNama = sanitizeString(data.wargaNama || "Warga BERSEKA");
    const rawRating = Number(data.rating || 5);
    const cleanRating = Math.max(1, Math.min(5, isNaN(rawRating) ? 5 : Math.round(rawRating)));

    let createdFeedback: any;

    try {
      if ((prisma as any).kritikSaranPemanfaatan?.create) {
        createdFeedback = await (prisma as any).kritikSaranPemanfaatan.create({
          data: {
            userId: data.userId,
            wargaNama: cleanWargaNama,
            kategori: cleanKategori,
            judul: cleanJudul,
            isiKritikSaran: cleanIsi,
            rating: cleanRating,
            rwId: data.rwId || null,
            fotoBuktiUrl: data.fotoBuktiUrl || null,
            status: "MENUNGGU",
          },
          include: {
            user: { select: { id: true, name: true, phone: true } },
            rw: { include: { kelurahan: true } },
          },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma create failed, using SQL fallback:", err);
    }

    if (!createdFeedback) {
      const id = crypto.randomUUID();
      const userId = (data.userId || "").replace(/'/g, "''");
      const wargaNama = cleanWargaNama.replace(/'/g, "''");
      const kategori = cleanKategori.replace(/'/g, "''");
      const judul = cleanJudul.replace(/'/g, "''");
      const isiKritikSaran = cleanIsi.replace(/'/g, "''");
      const rwIdVal = data.rwId ? data.rwId : "NULL";
      const fotoVal = data.fotoBuktiUrl ? `'${data.fotoBuktiUrl.replace(/'/g, "''")}'` : "NULL";

      await prisma.$executeRawUnsafe(`
        INSERT INTO "kritik_saran_pemanfaatan" (
          "id", "id_pengguna", "warga_nama", "kategori", "judul", "isi_kritik_saran", "rating", "status", "foto_bukti_url", "id_rw", "dibuat_pada", "diperbarui_pada"
        ) VALUES (
          '${id}', '${userId}', '${wargaNama}', '${kategori}', '${judul}', '${isiKritikSaran}', ${cleanRating}, 'MENUNGGU', ${fotoVal}, ${rwIdVal}, NOW(), NOW()
        )
      `);

      createdFeedback = {
        id,
        userId: data.userId,
        wargaNama: cleanWargaNama,
        kategori: cleanKategori,
        judul: cleanJudul,
        isiKritikSaran: cleanIsi,
        rating: cleanRating,
        status: "MENUNGGU",
        fotoBuktiUrl: data.fotoBuktiUrl || null,
        rwId: data.rwId || null,
        createdAt: new Date(),
      };
    }

    try {
      websocketService.broadcastPemanfaatanFeedback({ action: "NEW_FEEDBACK", data: createdFeedback });
    } catch (_e) {}

    return createdFeedback;
  }

  async respondFeedback(
    id: string,
    data: {
      tanggapan: string;
      ditanggapiOleh: string;
      status?: string;
    }
  ) {
    const cleanTanggapan = sanitizeString(data.tanggapan);
    const cleanPenanggap = sanitizeString(data.ditanggapiOleh || "Pengelola BERSEKA");
    const cleanStatus = sanitizeString(data.status || "SELESAI");

    let updatedFeedback: any;

    try {
      if ((prisma as any).kritikSaranPemanfaatan?.update) {
        updatedFeedback = await (prisma as any).kritikSaranPemanfaatan.update({
          where: { id },
          data: {
            tanggapan: cleanTanggapan,
            ditanggapiOleh: cleanPenanggap,
            ditanggapiPada: new Date(),
            status: cleanStatus,
          },
          include: {
            user: { select: { id: true, name: true, phone: true } },
            rw: { include: { kelurahan: true } },
          },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma update failed, using SQL fallback:", err);
    }

    if (!updatedFeedback) {
      const safeId = id.replace(/'/g, "''");
      const safeTanggapan = cleanTanggapan.replace(/'/g, "''");
      const safePenanggap = cleanPenanggap.replace(/'/g, "''");
      const safeStatus = cleanStatus.replace(/'/g, "''");

      await prisma.$executeRawUnsafe(`
        UPDATE "kritik_saran_pemanfaatan"
        SET "tanggapan" = '${safeTanggapan}',
            "ditanggapi_oleh" = '${safePenanggap}',
            "ditanggapi_pada" = NOW(),
            "status" = '${safeStatus}',
            "diperbarui_pada" = NOW()
        WHERE "id" = '${safeId}'
      `);

      updatedFeedback = { id, tanggapan: cleanTanggapan, ditanggapiOleh: cleanPenanggap, status: cleanStatus, ditanggapiPada: new Date() };
    }

    try {
      websocketService.broadcastPemanfaatanFeedback({ action: "RESPOND_FEEDBACK", data: updatedFeedback });
    } catch (_e) {}

    return updatedFeedback;
  }

  async deleteFeedback(id: string, requestUser?: any) {
    // Check ownership or admin permissions
    if (requestUser) {
      const userRole = String(requestUser.role || "").toUpperCase();
      const isAdmin = ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "RW", "PANITIA_TASKFORCE"].includes(userRole);
      
      if (!isAdmin) {
        // If not admin, check if user is the author
        const existing = await prisma.kritikSaranPemanfaatan.findUnique({ where: { id } }).catch(() => null);
        const userId = requestUser.userId || requestUser.id;
        if (existing && existing.userId !== userId) {
          throw new Error("FORBIDDEN_DELETE_FEEDBACK");
        }
      }
    }

    try {
      if ((prisma as any).kritikSaranPemanfaatan?.delete) {
        await (prisma as any).kritikSaranPemanfaatan.delete({
          where: { id },
        });
      } else {
        const safeId = id.replace(/'/g, "''");
        await prisma.$executeRawUnsafe(`
          DELETE FROM "kritik_saran_pemanfaatan" WHERE "id" = '${safeId}'
        `);
      }
    } catch (err: any) {
      if (err.message === "FORBIDDEN_DELETE_FEEDBACK") throw err;
      console.warn("[PemanfaatanService] Prisma delete fallback:", err);
      const safeId = id.replace(/'/g, "''");
      await prisma.$executeRawUnsafe(`
        DELETE FROM "kritik_saran_pemanfaatan" WHERE "id" = '${safeId}'
      `);
    }

    try {
      websocketService.broadcastPemanfaatanFeedback({ action: "DELETE_FEEDBACK", id });
    } catch (_e) {}

    return { success: true, id };
  }
}

export const pemanfaatanService = new PemanfaatanService();

