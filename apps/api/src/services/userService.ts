/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { userRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../utils/hashUtils.js";
import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { getRandomDefaultAvatar } from "../utils/avatarUtils.js";
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
      if (roleName === "PENGURUS_RW_RT") {
        // Tab "Pengurus RW/RT" → tampilkan RW dan RT
        whereClause.role = { name: { in: ["RW", "RT"] } };
      } else if (roleName === "EKSEKUTIF") {
        // Tab umbrella eksekutif → tampilkan semua admin
        whereClause.role = { name: { in: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"] } };
      } else {
        // Tab spesifik (CAMAT, LURAH, ADMIN_DLH, SUPER_USER, dll) → query persis
        whereClause.role = { name: roleName };
      }
    }

    if (status && !["Sudah Teraktivasi", "Belum Teraktivasi", "Semua"].includes(status)) {
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
        { rw: { AND: conditions } },
        { households: { some: { rw: { AND: conditions } } } },
      ];
    }

    const users = await userRepository.findMany(whereClause);

    let mapped = users.map((u: any) => {
      let wilayah = "-";
      if (u.rw) {
        const rtText = u.rt?.name ? `${u.rt.name}, ` : "";
        wilayah = `${rtText}${u.rw.name} (Kel. ${u.rw.kelurahan?.name || "-"})`;
      } else if (u.households && u.households.length > 0 && u.households[0].rw) {
        const hRw = u.households[0].rw;
        wilayah = `${hRw.name} (Kel. ${hRw.kelurahan?.name || "-"})`;
      }

      let totalSetoranKg = 0;
      if (u.setoranOtomatis) {
        u.setoranOtomatis.forEach((s: any) => {
          totalSetoranKg += Number(s.berat);
        });
      }

      const totalPoin = u.pointHistory.reduce((sum: number, p: any) => sum + p.points, 0);

      let pendampingKkn = null;
      if (u.bins && u.bins.length > 0) {
        const boundBin = u.bins.find((b: any) => b.registeredByStudent);
        if (boundBin && boundBin.registeredByStudent) {
          pendampingKkn = {
            id: boundBin.registeredByStudent.id,
            name: boundBin.registeredByStudent.name,
            phone: boundBin.registeredByStudent.phone,
          };
        }
      }

      const rwObj = u.rw || u.rt?.rw || u.households?.[0]?.rw || u.studentProfile?.assignedRw || u.rwOwned;
      let kelurahanName = rwObj?.kelurahan?.name || "-";
      let kecamatanName = rwObj?.kelurahan?.kecamatan?.name || (kelurahanName !== "-" ? "Kec. Coblong" : "-");
      let rwName = rwObj?.name || "-";
      let rtName = u.rt?.name || "-";

      if (u.role?.name === "CAMAT") {
        kecamatanName = "Kec. Coblong";
        if (kelurahanName === "-") kelurahanName = "Semua Kelurahan";
      } else if (u.role?.name === "ADMIN_DLH" || u.role?.name === "SUPER_USER") {
        kecamatanName = "Kec. Coblong";
        if (kelurahanName === "-") kelurahanName = "Seluruh Kota";
      }

      if (kelurahanName === "-" && u.address) {
        const kelMatch = u.address.match(/(?:Kel\.?|Kelurahan)\s*([A-Za-z\s]+?)(?:,|$|\s+Kec|\s+RW)/i);
        if (kelMatch && kelMatch[1]) {
          kelurahanName = kelMatch[1].trim();
          kecamatanName = "Kec. Coblong";
        }
      }
      if (rwName === "-" && u.address) {
        const rwMatch = u.address.match(/RW\s*(\d+)/i);
        if (rwMatch) {
          rwName = `RW ${rwMatch[1].padStart(2, "0")}`;
        }
      }
      if (rtName === "-" && u.address) {
        const rtMatch = u.address.match(/RT\s*(\d+)/i);
        if (rtMatch) {
          rtName = `RT ${rtMatch[1].padStart(2, "0")}`;
        }
      }

      if (rwName === "-" && u.studentProfile?.kelompok) {
        const kel = u.studentProfile.kelompok;
        const cakupan = Array.isArray(kel.cakupanRw)
          ? kel.cakupanRw.join(", ")
          : typeof kel.cakupanRw === "string"
          ? kel.cakupanRw
          : "";
        if (cakupan) {
          rwName = cakupan;
        }
        if (kelurahanName === "-" && kel.kelurahan) {
          kelurahanName = kel.kelurahan;
          kecamatanName = "Kec. Coblong";
        }
      }

      const activeBinsCount = (u.bins || []).filter(
        (b: any) => b.status === "ACTIVE_BOUND" || b.status === "ACTIVE"
      ).length + (u.binOwnerships || []).filter(
        (bo: any) => bo.status === "ACTIVE_BOUND" || bo.status === "ACTIVE"
      ).length;
      const binStatus = activeBinsCount > 0 ? "Sudah Teraktivasi" : "Belum Teraktivasi";

      const wilayahParts = [rwName, kelurahanName, kecamatanName].filter((p) => p && p !== "-");
      if (wilayahParts.length > 0) {
        wilayah = wilayahParts.join(", ");
      }

      return {
        id: u.id,
        name: u.name,
        email: u.phone,
        phone: u.phone,
        nim: u.studentProfile?.nim || null,
        role: u.role.name,
        status: u.status,
        binStatus,
        activeBinsCount,
        address: u.address || "",
        kecamatan: kecamatanName,
        kelurahan: kelurahanName,
        rw: rwName,
        rt: rtName,
        wilayah,
        setoran: parseFloat(totalSetoranKg.toFixed(1)),
        totalPoin,
        pendampingKkn,
        createdAt: u.createdAt,
        studentProfile: u.studentProfile
          ? {
              nim: u.studentProfile.nim,
              jurusan: u.studentProfile.jurusan,
              fakultas: u.studentProfile.fakultas,
              noWa: u.studentProfile.noWa,
              startDate: u.studentProfile.startDate,
              endDate: u.studentProfile.endDate,
              assignedRwId: u.studentProfile.assignedRwId,
              assignedPolygonName: u.studentProfile.assignedPolygon?.name,
              whitelistStatus: u.studentProfile.whitelistStatus,
              kelompok: u.studentProfile.kelompok
                ? {
                    id: u.studentProfile.kelompok.id,
                    name: u.studentProfile.kelompok.name,
                    kelurahan: u.studentProfile.kelompok.kelurahan,
                    cakupanRw: u.studentProfile.kelompok.cakupanRw,
                    dplId: u.studentProfile.kelompok.dplId,
                    dplName: u.studentProfile.kelompok.dpl?.name || u.studentProfile.kelompok.dplNamaMentah || null,
                    dplPhone: u.studentProfile.kelompok.dpl?.phone || null,
                    wilayahPenugasan: u.studentProfile.kelompok.cakupanRw
                      ? `${u.studentProfile.kelompok.cakupanRw}${u.studentProfile.kelompok.kelurahan ? ` (${u.studentProfile.kelompok.kelurahan})` : ""}`
                      : u.studentProfile.kelompok.kelurahan || null,
                  }
                : null,
            }
          : null,
      };
    });

    if (status === "Sudah Teraktivasi") {
      mapped = mapped.filter((u: any) => u.binStatus === "Sudah Teraktivasi");
    } else if (status === "Belum Teraktivasi") {
      mapped = mapped.filter((u: any) => u.binStatus === "Belum Teraktivasi");
    }

    return mapped;
  }

  async createUser(data: any, currentUser?: { userId: string; role: string }) {
    const { name, password, phone, roleName, status, rwId, rtRwId, address, nim, studentProfile } = data;
    const effectiveRwId = rwId !== undefined && rwId !== null ? rwId : rtRwId;

    if (!phone) {
      throw new Error("PHONE_REQUIRED");
    }
    const formattedPhone = formatPhoneNumber(phone);

    const existingPhone = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    if (existingPhone) {
      throw new Error("PHONE_CONFLICT");
    }

    if (["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName) && currentUser?.role !== "SUPER_USER") {
      throw new Error("FORBIDDEN_ROLE_CREATION");
    }

    const role = await userRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }

    if (roleName === "PETUGAS_RESIDU" && rwId) {
      const area = await prisma.rw.findUnique({ where: { id: parseInt(rwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              role: { name: "PETUGAS_RESIDU" },
              rw: { name: { contains: `RW ${rwNumber}` } },
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
          phone: formattedPhone,
          roleId: role.id,
          status: status || "Aktif",
          rwId: effectiveRwId ? parseInt(effectiveRwId) : null,
          address: address || null,
          fotoProfil: data.fotoProfil || getRandomDefaultAvatar(name),
        },
        include: { role: { select: { name: true } } },
      });

      if (roleName === "MAHASISWA_KKN") {
        const targetNim = studentProfile?.nim || nim;
        if (targetNim || studentProfile) {
          await tx.studentKkn.create({
            data: {
              userId: u.id,
              nim: targetNim || "-",
              jurusan: studentProfile?.jurusan || "-",
              fakultas: studentProfile?.fakultas || "-",
              noWa: studentProfile?.noWa || u.phone || "",
              startDate: studentProfile?.startDate ? new Date(studentProfile.startDate) : new Date(),
              endDate: studentProfile?.endDate
                ? new Date(studentProfile.endDate)
                : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              assignedRwId: studentProfile?.assignedRwId
                ? parseInt(studentProfile.assignedRwId)
                : u.rwId,
              whitelistStatus: "APPROVED",
            },
          });
        }
      }

      return u;
    });

    return {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      role: (newUser as any).role.name,
    };
  }

  async updateUser(id: string, data: any, currentUser?: { userId: string; role: string }) {
    const { name, phone, email, password, roleName, status, rwId: inputRwId, rtRwId, address, nim, studentProfile } = data;
    const targetRwId = inputRwId !== undefined && inputRwId !== null ? inputRwId : rtRwId;

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Check if target user has a restricted role or if trying to change to a restricted role
    const isRestrictedRole =
      ["ADMIN_DLH", "CAMAT", "LURAH"].includes(user.role.name) ||
      (roleName && ["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName));
    if (isRestrictedRole && currentUser?.role !== "SUPER_USER") {
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
    const checkRtRwId = inputRwId !== undefined ? inputRwId : user.rwId;

    if (checkRoleName === "PETUGAS_RESIDU" && checkRtRwId) {
      const area = await prisma.rw.findUnique({ where: { id: parseInt(checkRtRwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              id: { not: user.id },
              role: { name: "PETUGAS_RESIDU" },
              rw: { name: { contains: `RW ${rwNumber}` } },
            },
          });
          if (existingPetugas) {
            throw new Error("RW_ALREADY_HAS_PETUGAS_RESIDU");
          }
        }
      }
    }

    const updateData: any = { name, roleId };
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          id: { not: id },
        },
      });
      if (existingUserWithPhone) {
        throw new Error("PHONE_CONFLICT");
      }
      updateData.phone = formattedPhone;
    }
    if (password) {
      updateData.password = await hashPassword(password);
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (targetRwId !== undefined) {
      updateData.rwId = targetRwId ? parseInt(targetRwId) : null;
    }
    if (address !== undefined) {
      updateData.address = address || null;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        include: { role: { select: { name: true } } },
      });

      if ((roleName === "MAHASISWA_KKN" || u.role.name === "MAHASISWA_KKN") && (studentProfile || nim)) {
        const targetNim = studentProfile?.nim || nim;
        await tx.studentKkn.upsert({
          where: { userId: id },
          create: {
            userId: id,
            nim: targetNim || "-",
            jurusan: studentProfile?.jurusan || "-",
            fakultas: studentProfile?.fakultas || "-",
            noWa: studentProfile?.noWa || u.phone || "",
            startDate: studentProfile?.startDate ? new Date(studentProfile.startDate) : new Date(),
            endDate: studentProfile?.endDate
              ? new Date(studentProfile.endDate)
              : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            assignedRwId: studentProfile?.assignedRwId
              ? parseInt(studentProfile.assignedRwId)
              : (updateData.rwId || u.rwId),
            whitelistStatus: "APPROVED",
          },
          update: {
            ...(targetNim && { nim: targetNim }),
            ...(studentProfile?.jurusan && { jurusan: studentProfile.jurusan }),
            ...(studentProfile?.fakultas && { fakultas: studentProfile.fakultas }),
            ...(studentProfile?.noWa && { noWa: studentProfile.noWa }),
          },
        });
      }

      if ((u.role.name === "PETUGAS_RESIDU" || roleName === "PETUGAS_RESIDU") && status) {
        const pStatus = status === "Aktif" || status === "ACTIVE" ? "APPROVED" : "REJECTED";
        await tx.petugasResidu.updateMany({
          where: { userId: id },
          data: { whitelistStatus: pStatus },
        });
      }

      return u;
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
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


