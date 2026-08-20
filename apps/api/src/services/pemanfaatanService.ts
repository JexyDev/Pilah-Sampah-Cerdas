import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */



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
    return prisma.pemanfaatan.create({
      data: {
        ...data,
        volumeBahanBaku: data.volumeBahanBaku,
        hasil: data.hasil,
      },
    });
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

    return prisma.pemanfaatan.findMany({
      where: whereClause,
      include: {
        rw: { include: { kelurahan: true } },
      },
      orderBy: { createdAt: "desc" },
    });
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
    return item;
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

    return prisma.pemanfaatan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const item = await prisma.pemanfaatan.findUnique({ where: { id } });
    if (!item) throw new Error("PEMANFAATAN_NOT_FOUND");

    return prisma.pemanfaatan.delete({
      where: { id },
    });
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
    try {
      if ((prisma as any).kritikSaranPemanfaatan?.create) {
        return await (prisma as any).kritikSaranPemanfaatan.create({
          data: {
            userId: data.userId,
            wargaNama: data.wargaNama,
            kategori: data.kategori || "Pemanfaatan Sampah",
            judul: data.judul,
            isiKritikSaran: data.isiKritikSaran,
            rating: data.rating || 5,
            rwId: data.rwId || null,
            fotoBuktiUrl: data.fotoBuktiUrl || null,
            status: "MENUNGGU",
          },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma create failed, using SQL fallback:", err);
    }

    const id = crypto.randomUUID();
    const userId = (data.userId || "").replace(/'/g, "''");
    const wargaNama = (data.wargaNama || "Warga BERSEKA").replace(/'/g, "''");
    const kategori = (data.kategori || "Pemanfaatan Sampah").replace(/'/g, "''");
    const judul = (data.judul || "").replace(/'/g, "''");
    const isiKritikSaran = (data.isiKritikSaran || "").replace(/'/g, "''");
    const rating = data.rating || 5;
    const rwIdVal = data.rwId ? data.rwId : "NULL";
    const fotoVal = data.fotoBuktiUrl ? `'${data.fotoBuktiUrl.replace(/'/g, "''")}'` : "NULL";

    await prisma.$executeRawUnsafe(`
      INSERT INTO "kritik_saran_pemanfaatan" (
        "id", "id_pengguna", "warga_nama", "kategori", "judul", "isi_kritik_saran", "rating", "status", "foto_bukti_url", "id_rw", "dibuat_pada", "diperbarui_pada"
      ) VALUES (
        '${id}', '${userId}', '${wargaNama}', '${kategori}', '${judul}', '${isiKritikSaran}', ${rating}, 'MENUNGGU', ${fotoVal}, ${rwIdVal}, NOW(), NOW()
      )
    `);

    return { id, ...data, status: "MENUNGGU", createdAt: new Date() };
  }

  async respondFeedback(
    id: string,
    data: {
      tanggapan: string;
      ditanggapiOleh: string;
      status?: string;
    }
  ) {
    try {
      if ((prisma as any).kritikSaranPemanfaatan?.update) {
        return await (prisma as any).kritikSaranPemanfaatan.update({
          where: { id },
          data: {
            tanggapan: data.tanggapan,
            ditanggapiOleh: data.ditanggapiOleh,
            ditanggapiPada: new Date(),
            status: data.status || "SELESAI",
          },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma update failed, using SQL fallback:", err);
    }

    const safeId = id.replace(/'/g, "''");
    const safeTanggapan = (data.tanggapan || "").replace(/'/g, "''");
    const safePenanggap = (data.ditanggapiOleh || "").replace(/'/g, "''");
    const safeStatus = (data.status || "SELESAI").replace(/'/g, "''");

    await prisma.$executeRawUnsafe(`
      UPDATE "kritik_saran_pemanfaatan"
      SET "tanggapan" = '${safeTanggapan}',
          "ditanggapi_oleh" = '${safePenanggap}',
          "ditanggapi_pada" = NOW(),
          "status" = '${safeStatus}',
          "diperbarui_pada" = NOW()
      WHERE "id" = '${safeId}'
    `);

    return { id, ...data, ditanggapiPada: new Date() };
  }

  async deleteFeedback(id: string) {
    try {
      if ((prisma as any).kritikSaranPemanfaatan?.delete) {
        return await (prisma as any).kritikSaranPemanfaatan.delete({
          where: { id },
        });
      }
    } catch (err) {
      console.warn("[PemanfaatanService] Prisma delete failed, using SQL fallback:", err);
    }

    const safeId = id.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`
      DELETE FROM "kritik_saran_pemanfaatan" WHERE "id" = '${safeId}'
    `);
    return { success: true };
  }
}

export const pemanfaatanService = new PemanfaatanService();
