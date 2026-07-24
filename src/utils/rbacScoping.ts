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
 */
export async function getScopingFilters(user: {
  userId: string;
  role: string;
}): Promise<ScopingFilters> {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: { rtRw: { include: { kelurahan: true } } },
  });

  if (!dbUser) return {};

  const role = user.role;

  // 1. SUPER_ADMIN, ADMIN_DLH, and CAMAT see all data (CAMAT is read-only checked at route level)
  if (role === "SUPER_ADMIN" || role === "ADMIN_DLH" || role === "CAMAT") {
    return {};
  }

  // 2. LURAH is scoped by Kelurahan
  if (role === "LURAH") {
    const kelurahanId = dbUser.rtRw?.kelurahanId;
    if (!kelurahanId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    return {
      userFilter: { rtRw: { kelurahanId } },
      binFilter: { kelurahanId },
      householdFilter: { rtRw: { kelurahanId } },
      wasteLogFilter: { bin: { kelurahanId } },
    };
  }

  // 3. RW is scoped by RW
  if (role === "RW") {
    const areaName = dbUser.rtRw?.name; // e.g. "RT 02 / RW 06"
    if (!areaName || !areaName.includes("RW")) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    const rwPart = areaName
      .split("/")
      .map((s) => s.trim())
      .find((s) => s.startsWith("RW"));
    if (!rwPart) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }

    return {
      userFilter: { rtRw: { name: { contains: rwPart } } },
      binFilter: { rtRw: { name: { contains: rwPart } } },
      householdFilter: { rtRw: { name: { contains: rwPart } } },
      wasteLogFilter: { bin: { rtRw: { name: { contains: rwPart } } } },
    };
  }

  // 3b. RT is scoped by their exact RT/RW area
  if (role === "RT") {
    const rtRwId = dbUser.rtRwId;
    if (!rtRwId) {
      return {
        userFilter: { id: "none" },
        binFilter: { id: "none" },
        householdFilter: { id: "none" },
        wasteLogFilter: { id: "none" },
      };
    }
    return {
      userFilter: { rtRwId },
      binFilter: { rtRwId },
      householdFilter: { rtRwId },
      wasteLogFilter: { bin: { rtRwId } },
    };
  }

  // 4. MAHASISWA_KKN is scoped by their assigned RT/RW area polygon
  if (role === "MAHASISWA_KKN") {
    const student = await prisma.studentKkn.findUnique({
      where: { userId: user.userId },
    });
    if (student && student.assignedPolygonId) {
      return {
        userFilter: { rtRwId: student.assignedPolygonId },
        binFilter: { rtRwId: student.assignedPolygonId },
        householdFilter: { rtRwId: student.assignedPolygonId },
        wasteLogFilter: { bin: { rtRwId: student.assignedPolygonId } },
      };
    }
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
