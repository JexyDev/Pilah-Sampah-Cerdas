import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */



export interface ScopingFilters {
  userFilter?: any;
  binFilter?: any;
  householdFilter?: any;
  wasteLogFilter?: any;
}

/**
 * Determine dynamic query filters based on User role and area-scoping.
 * Hierarki: SUPER_USER/ADMIN_DLH = all data; CAMAT = per Kecamatan; LURAH = per Kelurahan; RW/RT = per RW.
 */
export async function getScopingFilters(user: {
  userId: string;
  role: string;
}): Promise<ScopingFilters> {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: { rw: { include: { kelurahan: { include: { kecamatan: true } } } } },
  });

  if (!dbUser) return {};

  const normalizeRole = (r: string) => {
    if (["DLH", "DLH_ADMIN", "Admin DLH"].includes(r)) return "ADMIN_DLH";
    if (["ADMIN_KECAMATAN", "Camat", "CAMAT_ADMIN"].includes(r)) return "CAMAT";
    if (["ADMIN_KELURAH", "Lurah", "LURAH_ADMIN"].includes(r)) return "LURAH";
    return r;
  };
  const role = normalizeRole(user.role);

  // 1. DEVELOPER, SUPER_USER, ADMIN_DLH, PEMIMPIN, and PANITIA_TASKFORCE see all data
  if (
    ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(role)
  ) {
    return {};
  }

  // 1b. DPL (Dosen Pembimbing Lapangan) is strictly scoped to their assigned Kelompok KKN Kelurahan
  if (role === "DPL" || role === "DOSEN_PEMBIMBING") {
    const dplOr: any[] = [
      { dplId: dbUser.id },
      { dpl: { id: dbUser.id } },
    ];
    if (dbUser.name) dplOr.push({ dplNamaMentah: { equals: dbUser.name.trim(), mode: "insensitive" } });
    if (dbUser.nip) dplOr.push({ dpl: { nip: dbUser.nip } });
    if (dbUser.phone) dplOr.push({ dpl: { phone: dbUser.phone } });

    const dplGroups = await prisma.kelompokKkn.findMany({
      where: {
        OR: dplOr,
      },
      select: { kelurahan: true },
    });
    const dplKelurahans = Array.from(
      new Set(dplGroups.map((g) => g.kelurahan).filter(Boolean))
    ) as string[];

    if (dplKelurahans.length === 0) {
      // Fallback: check if user.rw has a kelurahan
      const userKel = dbUser.rw?.kelurahan?.name;
      if (userKel) dplKelurahans.push(userKel);
    }

    if (dplKelurahans.length === 0) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }

    const kelurahanRecords = await prisma.kelurahan.findMany({
      where: {
        name: { in: dplKelurahans, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });
    const kelurahanIds = kelurahanRecords.map((k) => k.id);
    const kelurahanNames = kelurahanRecords.map((k) => k.name);
    const allKelurahanNames = Array.from(new Set([...dplKelurahans, ...kelurahanNames]));

    return {
      userFilter: {
        OR: [
          { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } }, role: { name: "WARGA" } },
          { studentProfile: { kelompok: { dplId: dbUser.id } } },
        ],
      },
      binFilter: {
        OR: [
          { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } },
          { kelurahanId: { in: kelurahanIds } },
          { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } },
        ],
      },
      householdFilter: {
        rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } },
      },
      wasteLogFilter: {
        OR: [
          { bin: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } },
          { bin: { kelurahanId: { in: kelurahanIds } } },
          { bin: { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } } },
          { warga: { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } } },
        ],
      },
    };
  }

  // 2. CAMAT is scoped by Kecamatan
  if (role === "CAMAT") {
    const kecamatanId = dbUser.rw?.kelurahan?.kecamatanId;
    if (!kecamatanId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    return {
      userFilter: { rw: { kelurahan: { kecamatanId } } },
      binFilter: {
        OR: [
          { kelurahan: { kecamatanId } },
          { rw: { kelurahan: { kecamatanId } } },
        ],
      },
      householdFilter: { rw: { kelurahan: { kecamatanId } } },
      wasteLogFilter: {
        OR: [
          { bin: { kelurahan: { kecamatanId } } },
          { bin: { rw: { kelurahan: { kecamatanId } } } },
          { warga: { rw: { kelurahan: { kecamatanId } } } },
        ],
      },
    };
  }

  // 3. LURAH is scoped by Kelurahan
  if (role === "LURAH") {
    let kelurahanId = dbUser.rw?.kelurahanId;
    let kelurahanName = dbUser.rw?.kelurahan?.name;

    if (!kelurahanId && dbUser.address) {
      const match = await prisma.kelurahan.findFirst({
        where: {
          name: { contains: dbUser.address, mode: "insensitive" },
        },
      });
      if (match) {
        kelurahanId = match.id;
        kelurahanName = match.name;
      }
    }

    if (!kelurahanId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }

    const userOr: any[] = [{ rw: { kelurahanId } }];
    const binOr: any[] = [{ kelurahanId }, { rw: { kelurahanId } }];
    const householdOr: any[] = [{ rw: { kelurahanId } }];
    const wasteLogOr: any[] = [
      { bin: { kelurahanId } },
      { bin: { rw: { kelurahanId } } },
      { warga: { rw: { kelurahanId } } },
    ];

    if (kelurahanName) {
      userOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
      binOr.push({ kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } });
      binOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
      householdOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
      wasteLogOr.push({ bin: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
      wasteLogOr.push({ bin: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } } });
      wasteLogOr.push({ warga: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } } });
    }

    return {
      userFilter: { OR: userOr },
      binFilter: { OR: binOr },
      householdFilter: { OR: householdOr },
      wasteLogFilter: { OR: wasteLogOr },
    };
  }

  // 4. RW & RT scoped by their rwId
  if (role === "RW" || role === "RT") {
    const rwId = dbUser.rwId;
    if (!rwId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    return {
      userFilter: { rwId },
      binFilter: { rwId },
      householdFilter: { rwId },
      wasteLogFilter: { bin: { rwId } },
    };
  }

  // 5. MAHASISWA_KKN is scoped by their assigned RW area or kelompok kelurahan
  if (role === "MAHASISWA_KKN") {
    const student = await prisma.studentKkn.findUnique({
      where: { userId: user.userId },
      include: { kelompok: true },
    });
    if (student && student.assignedRwId) {
      return {
        userFilter: { rwId: student.assignedRwId },
        binFilter: { rwId: student.assignedRwId },
        householdFilter: { rwId: student.assignedRwId },
        wasteLogFilter: { bin: { rwId: student.assignedRwId } },
      };
    }
    if (student?.kelompok?.kelurahan) {
      const kel = student.kelompok.kelurahan;
      return {
        userFilter: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
        binFilter: {
          OR: [
            { kelurahan: { name: { equals: kel, mode: "insensitive" } } },
            { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
          ],
        },
        householdFilter: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
        wasteLogFilter: {
          OR: [
            { bin: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
            { bin: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } } },
            { warga: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } } },
          ],
        },
      };
    }
  }

  // 5b. PETUGAS_RESIDU can see WARGA users for manual deposits
  if (role === "PETUGAS_RESIDU") {
    return {
      userFilter: { role: { name: "WARGA" } },
      binFilter: {},
      householdFilter: {},
      wasteLogFilter: {},
    };
  }

  // 6. WARGA sees only their own data
  if (role === "WARGA") {
    return {
      userFilter: { id: user.userId },
      binFilter: { binOwnerships: { some: { userId: user.userId } } },
      householdFilter: { userId: user.userId },
      wasteLogFilter: { household: { userId: user.userId } },
    };
  }

  // Default fallback: match nothing
  return {
    userFilter: { id: "none" },
    binFilter: { id: "none" },
    householdFilter: { id: "none" },
    wasteLogFilter: { id: "none" },
  };
}
