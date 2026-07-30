/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { userRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../utils/hashUtils.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UserService {
  async getAllUsers(
    filters: {
      search?: string;
      roleName?: string;
      status?: string;
      rw?: string;
      rt?: string;
    },
    currentUser: { userId: string; role: string }
  ) {
    const { search, roleName, status, rw, rt } = filters;
    const { getScopingFilters } = await import("../utils/rbacScoping.js");
    const scoping = await getScopingFilters(currentUser);
    const whereClause: any = { ...scoping.userFilter };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleName) {
      whereClause.role = { name: roleName };
    }

    if (status) {
      whereClause.status = status;
    }

    if (rw || rt) {
      const conditions: any[] = [];
      if (rw) {
        conditions.push({ name: { contains: `RW ${rw}`, mode: "insensitive" } });
      }
      if (rt) {
        conditions.push({ name: { contains: `RT ${rt}`, mode: "insensitive" } });
      }
      whereClause.OR = [
        { rtRw: { AND: conditions } },
        { households: { some: { rtRw: { AND: conditions } } } },
      ];
    }

    const users = await userRepository.findMany(whereClause);

    return users.map((u: any) => {
      let wilayah = "-";
      if (u.rtRw) {
        wilayah = `${u.rtRw.name} (Kel. ${u.rtRw.kelurahan.name})`;
      } else if (u.households.length > 0 && u.households[0].rtRw) {
        wilayah = `${u.households[0].rtRw.name} (Kel. ${u.households[0].rtRw.kelurahan.name})`;
      }

      let totalSetoranKg = 0;
      if (u.setoranOtomatis) {
        u.setoranOtomatis.forEach((s: any) => {
          totalSetoranKg += Number(s.berat);
        });
      }

      const totalPoin = u.pointHistory.reduce((sum: number, p: any) => sum + p.points, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.phone,
        phone: u.phone,
        role: u.role.name,
        nik: "-",
        status: u.status,
        wilayah,
        setoran: parseFloat(totalSetoranKg.toFixed(1)),
        totalPoin,
        createdAt: u.createdAt,
        studentProfile: u.studentProfile
          ? {
              nim: u.studentProfile.nim,
              jurusan: u.studentProfile.jurusan,
              fakultas: u.studentProfile.fakultas,
              noWa: u.studentProfile.noWa,
              startDate: u.studentProfile.startDate,
              endDate: u.studentProfile.endDate,
              assignedPolygonId: u.studentProfile.assignedPolygonId,
              assignedPolygonName: u.studentProfile.assignedPolygon?.name,
              whitelistStatus: u.studentProfile.whitelistStatus,
            }
          : null,
      };
    });
  }

  async createUser(data: any, currentUser?: { userId: string; role: string }) {
    const { name, password, phone, roleName, status, rtRwId, studentProfile } = data;

    if (!phone) {
      throw new Error("PHONE_REQUIRED");
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new Error("PHONE_CONFLICT");
    }

    if (["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName) && currentUser?.role !== "SUPER_ADMIN") {
      throw new Error("FORBIDDEN_ROLE_CREATION");
    }

    const role = await userRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }

    if (roleName === "PETUGAS_RESIDU" && rtRwId) {
      const area = await prisma.rtRwArea.findUnique({ where: { id: parseInt(rtRwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              role: { name: "PETUGAS_RESIDU" },
              rtRw: { name: { contains: `RW ${rwNumber}` } },
            },
          });
          if (existingPetugas) {
            throw new Error("RW_ALREADY_HAS_PETUGAS_RESIDU");
          }
        }
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          password: passwordHash,
          phone,
          roleId: role.id,
          status: status || "Aktif",
          rtRwId: rtRwId ? parseInt(rtRwId) : null,
        },
        include: { role: { select: { name: true } } },
      });

      if (roleName === "MAHASISWA_KKN" && studentProfile) {
        await tx.studentKkn.create({
          data: {
            userId: u.id,
            nim: studentProfile.nim,
            jurusan: studentProfile.jurusan,
            fakultas: studentProfile.fakultas,
            noWa: studentProfile.noWa || "",
            startDate: new Date(studentProfile.startDate),
            endDate: new Date(studentProfile.endDate),
            assignedPolygonId: studentProfile.assignedPolygonId
              ? parseInt(studentProfile.assignedPolygonId)
              : null,
            whitelistStatus: "APPROVED",
          },
        });
      }

      return u;
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: (newUser as any).role.name,
    };
  }

  async updateUser(id: string, data: any, currentUser?: { userId: string; role: string }) {
    const { name, email, password, roleName, nik, status, rtRwId, studentProfile } = data;

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Check if target user has a restricted role or if trying to change to a restricted role
    const isRestrictedRole =
      ["ADMIN_DLH", "CAMAT", "LURAH"].includes(user.role.name) ||
      (roleName && ["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName));
    if (isRestrictedRole && currentUser?.role !== "SUPER_ADMIN") {
      throw new Error("FORBIDDEN_ROLE_UPDATE");
    }

    let roleId = user.roleId;
    if (roleName) {
      const role = await userRepository.findRoleByName(roleName);
      if (!role) {
        throw new Error("ROLE_NOT_FOUND");
      }
      roleId = role.id;
    }

    const checkRoleName = roleName || user.role.name;
    const checkRtRwId = rtRwId !== undefined ? rtRwId : user.rtRwId;

    if (checkRoleName === "PETUGAS_RESIDU" && checkRtRwId) {
      const area = await prisma.rtRwArea.findUnique({ where: { id: parseInt(checkRtRwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              id: { not: user.id },
              role: { name: "PETUGAS_RESIDU" },
              rtRw: { name: { contains: `RW ${rwNumber}` } },
            },
          });
          if (existingPetugas) {
            throw new Error("RW_ALREADY_HAS_PETUGAS_RESIDU");
          }
        }
      }
    }

    const updateData: any = { name, roleId };
    if (password) {
      updateData.password = await hashPassword(password);
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (rtRwId !== undefined) {
      updateData.rtRwId = rtRwId ? parseInt(rtRwId) : null;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        include: { role: { select: { name: true } } },
      });

      if ((roleName === "MAHASISWA_KKN" || u.role.name === "MAHASISWA_KKN") && studentProfile) {
        await tx.studentKkn.upsert({
          where: { userId: id },
          create: {
            userId: id,
            nim: studentProfile.nim,
            jurusan: studentProfile.jurusan,
            fakultas: studentProfile.fakultas,
            noWa: studentProfile.noWa || "",
            startDate: new Date(studentProfile.startDate),
            endDate: new Date(studentProfile.endDate),
            assignedPolygonId: studentProfile.assignedPolygonId
              ? parseInt(studentProfile.assignedPolygonId)
              : null,
            whitelistStatus: "APPROVED",
          },
          update: {
            nim: studentProfile.nim,
            jurusan: studentProfile.jurusan,
            fakultas: studentProfile.fakultas,
            noWa: studentProfile.noWa,
            startDate: new Date(studentProfile.startDate),
            endDate: new Date(studentProfile.endDate),
            assignedPolygonId: studentProfile.assignedPolygonId
              ? parseInt(studentProfile.assignedPolygonId)
              : null,
          },
        });
      }

      return u;
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.name,
    };
  }

  async deleteUser(id: string, currentUserId?: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (currentUserId === id) {
      throw new Error("DELETE_SELF");
    }

    await userRepository.delete(id);
  }

  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { households: true },
    });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const bins = await prisma.bin.findMany({
      where: {
        OR: [{ userId }, { binOwnerships: { some: { userId } } }],
        status: "ACTIVE_BOUND",
      },
      include: { category: true },
    });

    const hasOrganik = bins.some((b) => b.category?.name === "ORGANIC");
    const hasNonOrganik = bins.some((b) => b.category?.name === "NON_ORGANIC");
    const onboardingComplete = hasOrganik && hasNonOrganik;

    return {
      hasOrganik,
      hasNonOrganik,
      onboardingComplete,
    };
  }
}

export const userService = new UserService();
