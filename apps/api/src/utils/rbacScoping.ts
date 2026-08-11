/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ScopingFilters {
  userFilter?: any;
  binFilter?: any;
  householdFilter?: any;
  wasteLogFilter?: any;
}

/**
 * Determine dynamic query filters based on User role and area-scoping.
 * Hierarki: SUPER_USER/ADMIN_DLH/CAMAT = all data; LURAH = per Kelurahan; RW = per RW; RT = per RW juga (scope RW).
 */
export async function getScopingFilters(user: {
  userId: string;
  role: string;
}): Promise<ScopingFilters> {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: { rw: { include: { kelurahan: true } } },
  });

  if (!dbUser) return {};

  const normalizeRole = (r: string) => {
    if (["DLH", "DLH_ADMIN", "Admin DLH"].includes(r)) return "ADMIN_DLH";
    if (["ADMIN_KECAMATAN", "Camat", "CAMAT_ADMIN"].includes(r)) return "CAMAT";
    if (["ADMIN_KELURAH", "Lurah", "LURAH_ADMIN"].includes(r)) return "LURAH";
    return r;
  };
  const role = normalizeRole(user.role);

  // 1. DEVELOPER, SUPER_USER, ADMIN_DLH, CAMAT, PEMIMPIN, PANITIA_TASKFORCE, and DPL see all data
  if (["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "CAMAT", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL"].includes(role)) {
    return {};
  }

  // 2. LURAH is scoped by Kelurahan
  if (role === "LURAH") {
    const kelurahanId = dbUser.rw?.kelurahanId;
    if (!kelurahanId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    return {
      userFilter: { rw: { kelurahanId } },
      binFilter: { kelurahanId },
      householdFilter: { rw: { kelurahanId } },
      wasteLogFilter: { bin: { kelurahanId } },
    };
  }

  // 3. RW & RT scoped by their rwId
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

  // 4. MAHASISWA_KKN is scoped by their assigned RW area
  if (role === "MAHASISWA_KKN") {
    const student = await prisma.studentKkn.findUnique({
      where: { userId: user.userId },
    });
    if (student && student.assignedRwId) {
      return {
        userFilter: { rwId: student.assignedRwId },
        binFilter: { rwId: student.assignedRwId },
        householdFilter: { rwId: student.assignedRwId },
        wasteLogFilter: { bin: { rwId: student.assignedRwId } },
      };
    }
  }

  // 4b. PETUGAS_RESIDU can see WARGA users for manual deposits
  if (role === "PETUGAS_RESIDU") {
    return {
      userFilter: { role: { name: "WARGA" } },
      binFilter: {},
      householdFilter: {},
      wasteLogFilter: {},
    };
  }

  // 5. WARGA sees only their own data
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
