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
  pemanfaatanFilter?: any;
  facilityFilter?: any;
  kelompokKknFilter?: any;
  studentKknFilter?: any;
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
    if (["PIMPINAN", "Pimpinan", "PEMIMPIN", "Pemimpin"].includes(r)) return "PEMIMPIN";
    if (
      [
        "MPL",
        "MITRA_PENDAMPING_LAPANGAN",
        "MITRA PENDAMPING LAPANGAN",
        "MITRA_PEMBIMBING_LAPANGAN",
        "MITRA PEMBIMBING LAPANGAN",
        "MITRA",
      ].includes(r)
    )
      return "MPL";
    return r;
  };
  const role = normalizeRole(user.role);

  // 1. DEVELOPER, SUPER_USER, ADMIN_DLH, PEMIMPIN/PIMPINAN, and PANITIA_TASKFORCE see all data
  if (
    ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PIMPINAN", "PANITIA_TASKFORCE"].includes(
      role
    )
  ) {
    return {};
  }

  // 1b. DPL (Dosen Pembimbing Lapangan) is strictly scoped to their assigned Kelompok KKN Kelurahan
  if (
    role === "DPL" ||
    role === "DOSEN_PEMBIMBING" ||
    role === "DOSEN_PENDAMPING" ||
    role === "DOSEN_PENDAMPING_LAPANGAN"
  ) {
    const dplOr: any[] = [{ dplId: dbUser.id }, { dpl: { id: dbUser.id } }];
    if (dbUser.name)
      dplOr.push({ dplNamaMentah: { equals: dbUser.name.trim(), mode: "insensitive" } });
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
        pemanfaatanFilter: { id: "none" },
        facilityFilter: { id: "none" },
        kelompokKknFilter: { id: "none" },
        studentKknFilter: { userId: "none" },
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
          {
            rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } },
            role: { name: "WARGA" },
          },
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
          {
            warga: { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } },
          },
        ],
      },
      pemanfaatanFilter: {
        OR: [
          { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } },
          { rw: { kelurahanId: { in: kelurahanIds } } },
        ],
      },
      facilityFilter: {
        OR: [
          { rw: { kelurahan: { name: { in: allKelurahanNames, mode: "insensitive" } } } },
          { kelompok: { dplId: dbUser.id } },
        ],
      },
      kelompokKknFilter: { OR: dplOr },
      studentKknFilter: { kelompok: { OR: dplOr } },
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
        pemanfaatanFilter: { id: "none" },
        facilityFilter: { id: "none" },
        kelompokKknFilter: { id: "none" },
        studentKknFilter: { userId: "none" },
      };
    }
    return {
      userFilter: { rw: { kelurahan: { kecamatanId } } },
      binFilter: {
        OR: [{ kelurahan: { kecamatanId } }, { rw: { kelurahan: { kecamatanId } } }],
      },
      householdFilter: { rw: { kelurahan: { kecamatanId } } },
      wasteLogFilter: {
        OR: [
          { bin: { kelurahan: { kecamatanId } } },
          { bin: { rw: { kelurahan: { kecamatanId } } } },
          { warga: { rw: { kelurahan: { kecamatanId } } } },
        ],
      },
      pemanfaatanFilter: { rw: { kelurahan: { kecamatanId } } },
      facilityFilter: { rw: { kelurahan: { kecamatanId } } },
      kelompokKknFilter: { id: "none" }, // Unlikely to be used by Camat directly
      studentKknFilter: { userId: "none" },
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
        pemanfaatanFilter: { id: "none" },
        facilityFilter: { id: "none" },
        kelompokKknFilter: { id: "none" },
        studentKknFilter: { userId: "none" },
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
      householdOr.push({
        rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } },
      });
      wasteLogOr.push({
        bin: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } },
      });
      wasteLogOr.push({
        bin: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } },
      });
      wasteLogOr.push({
        warga: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } },
      });
    }

    return {
      userFilter: { OR: userOr },
      binFilter: { OR: binOr },
      householdFilter: { OR: householdOr },
      wasteLogFilter: { OR: wasteLogOr },
      pemanfaatanFilter: {
        OR: [
          { rw: { kelurahanId } },
          { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } },
        ],
      },
      facilityFilter: {
        OR: [
          { rw: { kelurahanId } },
          { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } },
        ],
      },
      kelompokKknFilter: { OR: [{ kelurahan: { equals: kelurahanName, mode: "insensitive" } }] },
      studentKknFilter: {
        kelompok: { OR: [{ kelurahan: { equals: kelurahanName, mode: "insensitive" } }] },
      },
    };
  }

  // 3b. MPL (Mitra Pembimbing Lapangan) is strictly scoped by their Kelurahan and assigned KKN groups
  if (role === "MPL") {
    let kelurahanId = dbUser.rw?.kelurahanId;
    let kelurahanName = dbUser.rw?.kelurahan?.name;

    if (!kelurahanId && (dbUser.address || dbUser.name)) {
      const allKelurahans = await prisma.kelurahan.findMany({
        select: { id: true, name: true },
      });
      if (dbUser.address) {
        const cleanAddress = dbUser.address.replace(/^Kel\.\s*/i, "").trim();
        const match = allKelurahans.find(
          (k) =>
            cleanAddress.toLowerCase().includes(k.name.toLowerCase()) ||
            k.name.toLowerCase().includes(cleanAddress.toLowerCase())
        );
        if (match) {
          kelurahanId = match.id;
          kelurahanName = match.name;
        } else {
          kelurahanName = cleanAddress;
        }
      }
      if (!kelurahanId && !kelurahanName && dbUser.name) {
        const match = allKelurahans.find((k) =>
          dbUser.name.toLowerCase().includes(k.name.toLowerCase())
        );
        if (match) {
          kelurahanId = match.id;
          kelurahanName = match.name;
        }
      }
    }

    const mplConditions: any[] = [{ mplId: dbUser.id }, { mpl: { id: dbUser.id } }];
    if (kelurahanName) {
      mplConditions.push({ kelurahan: { equals: kelurahanName, mode: "insensitive" } });
      mplConditions.push({ kelurahan: { contains: kelurahanName, mode: "insensitive" } });
    }

    const studentMplConditions: any[] = [
      { mplId: dbUser.id },
      { mpl: { id: dbUser.id } },
      { kelompok: { OR: mplConditions } },
    ];
    if (kelurahanName) {
      studentMplConditions.push({
        assignedRw: {
          kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } },
        },
      });
    }

    if (!kelurahanId && !kelurahanName) {
      return {
        userFilter: { OR: [{ studentProfile: { OR: studentMplConditions } }] },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
        pemanfaatanFilter: { id: "none" },
        facilityFilter: { id: "none" },
        kelompokKknFilter: { OR: mplConditions },
        studentKknFilter: { OR: studentMplConditions },
      };
    }

    const userOr: any[] = [{ studentProfile: { OR: studentMplConditions } }];
    if (kelurahanId) userOr.push({ rw: { kelurahanId } });
    if (kelurahanName) {
      userOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
    }

    const binOr: any[] = [];
    if (kelurahanId) {
      binOr.push({ kelurahanId });
      binOr.push({ rw: { kelurahanId } });
    }
    if (kelurahanName) {
      binOr.push({ kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } });
      binOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
    }

    const householdOr: any[] = [];
    if (kelurahanId) householdOr.push({ rw: { kelurahanId } });
    if (kelurahanName) {
      householdOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
    }

    const wasteLogOr: any[] = [];
    if (kelurahanId) {
      wasteLogOr.push({ bin: { kelurahanId } });
      wasteLogOr.push({ bin: { rw: { kelurahanId } } });
      wasteLogOr.push({ warga: { rw: { kelurahanId } } });
    }
    if (kelurahanName) {
      wasteLogOr.push({ bin: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
      wasteLogOr.push({ bin: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } } });
      wasteLogOr.push({ warga: { rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } } });
    }

    const pemanfaatanOr: any[] = [];
    if (kelurahanId) pemanfaatanOr.push({ rw: { kelurahanId } });
    if (kelurahanName) {
      pemanfaatanOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
    }

    const facilityOr: any[] = [{ kelompok: { OR: mplConditions } }];
    if (kelurahanId) facilityOr.push({ rw: { kelurahanId } });
    if (kelurahanName) {
      facilityOr.push({ rw: { kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } } } });
    }

    return {
      userFilter: { OR: userOr },
      binFilter: binOr.length > 0 ? { OR: binOr } : { id: "none" },
      householdFilter: householdOr.length > 0 ? { OR: householdOr } : { id: "none" },
      wasteLogFilter: wasteLogOr.length > 0 ? { OR: wasteLogOr } : { id: "none" },
      pemanfaatanFilter: pemanfaatanOr.length > 0 ? { OR: pemanfaatanOr } : { id: "none" },
      facilityFilter: { OR: facilityOr },
      kelompokKknFilter: { OR: mplConditions },
      studentKknFilter: { OR: studentMplConditions },
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
        pemanfaatanFilter: { id: "none" },
        facilityFilter: { id: "none" },
        kelompokKknFilter: { id: "none" },
        studentKknFilter: { userId: "none" },
      };
    }
    return {
      userFilter: { rwId },
      binFilter: { rwId },
      householdFilter: { rwId },
      wasteLogFilter: { bin: { rwId } },
      pemanfaatanFilter: { rwId },
      facilityFilter: { rwId },
      kelompokKknFilter: { id: "none" },
      studentKknFilter: { assignedRwId: rwId },
    };
  }

  // 5. MAHASISWA_KKN is scoped by their assigned RW area or kelompok kelurahan
  if (role === "MAHASISWA_KKN") {
    const student = await prisma.studentKkn.findUnique({
      where: { userId: user.userId },
      include: { kelompok: true },
    });
    if (student && student.assignedRwId) {
      const kel = student.kelompok?.kelurahan;
      return {
        userFilter: {
          OR: [
            { rwId: student.assignedRwId },
            ...(kel ? [{ rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } }] : []),
          ],
        },
        binFilter: {
          OR: [
            { rwId: student.assignedRwId },
            ...(student.kelompokId ? [{ kelompokId: student.kelompokId }] : []),
          ],
        },
        householdFilter: {
          OR: [
            { rwId: student.assignedRwId },
            ...(kel ? [{ rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } }] : []),
          ],
        },
        wasteLogFilter: {
          OR: [
            { bin: { rwId: student.assignedRwId } },
            ...(kel
              ? [{ bin: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } } }]
              : []),
          ],
        },
        pemanfaatanFilter: {
          OR: [
            { rwId: student.assignedRwId },
            ...(kel ? [{ rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } }] : []),
          ],
        },
        facilityFilter: {
          OR: [
            { rwId: student.assignedRwId },
            ...(kel ? [{ rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } }] : []),
            ...(student.kelompokId ? [{ kelompokId: student.kelompokId }] : []),
            { registeredByUserId: user.userId },
          ],
        },
        kelompokKknFilter: { id: student.kelompokId },
        studentKknFilter: { assignedRwId: student.assignedRwId },
      };
    }
    if (student?.kelompok?.kelurahan) {
      const kel = student.kelompok.kelurahan;
      return {
        userFilter: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
        binFilter: {
          OR: [
            ...(student.kelompokId ? [{ kelompokId: student.kelompokId }] : []),
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
        pemanfaatanFilter: { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
        facilityFilter: {
          OR: [
            { rw: { kelurahan: { name: { equals: kel, mode: "insensitive" } } } },
            ...(student.kelompokId ? [{ kelompokId: student.kelompokId }] : []),
            { registeredByUserId: user.userId },
          ],
        },
        kelompokKknFilter: { kelurahan: { equals: kel, mode: "insensitive" } },
        studentKknFilter: { kelompok: { kelurahan: { equals: kel, mode: "insensitive" } } },
      };
    }
  }

  // 5b. PETUGAS_RESIDU can see WARGA users for manual deposits and bin requests scoped by their RW
  if (role === "PETUGAS_RESIDU") {
    const userRwId = dbUser.rwId;
    return {
      userFilter: userRwId
        ? { role: { name: "WARGA" }, rwId: userRwId }
        : { role: { name: "WARGA" } },
      binFilter: userRwId ? { rwId: userRwId } : {},
      householdFilter: userRwId ? { rwId: userRwId } : {},
      wasteLogFilter: userRwId ? { bin: { rwId: userRwId } } : {},
      pemanfaatanFilter: { id: "none" },
      facilityFilter: { id: "none" },
      kelompokKknFilter: { id: "none" },
      studentKknFilter: { userId: "none" },
    };
  }

  // 6. WARGA sees only their own data
  if (role === "WARGA") {
    return {
      userFilter: { id: user.userId },
      binFilter: { binOwnerships: { some: { userId: user.userId } } },
      householdFilter: { userId: user.userId },
      wasteLogFilter: { household: { userId: user.userId } },
      pemanfaatanFilter: { id: "none" },
      facilityFilter: { id: "none" },
      kelompokKknFilter: { id: "none" },
      studentKknFilter: { userId: "none" },
    };
  }

  // Default fallback: match nothing
  return {
    userFilter: { id: "none" },
    binFilter: { id: "none" },
    householdFilter: { id: "none" },
    wasteLogFilter: { id: "none" },
    pemanfaatanFilter: { id: "none" },
    facilityFilter: { id: "none" },
    kelompokKknFilter: { id: "none" },
    studentKknFilter: { userId: "none" },
  };
}
