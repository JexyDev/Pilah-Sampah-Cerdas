/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { userRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../utils/hashUtils.js";

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
        { email: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
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

    return users.map((u) => {
      let wilayah = "-";
      if (u.rtRw) {
        wilayah = `${u.rtRw.name} (Kel. ${u.rtRw.kelurahan.name})`;
      } else if (u.households.length > 0 && u.households[0].rtRw) {
        wilayah = `${u.households[0].rtRw.name} (Kel. ${u.households[0].rtRw.kelurahan.name})`;
      }

      let totalSetoranKg = 0;
      u.households.forEach((h) => {
        h.wasteLogs.forEach((w) => {
          totalSetoranKg += Number(w.weightKg);
        });
      });

      const totalPoin = u.pointHistory.reduce((sum, p) => sum + p.points, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        nik: u.nik ?? "-",
        status: u.status,
        wilayah,
        setoran: parseFloat(totalSetoranKg.toFixed(1)),
        totalPoin,
        createdAt: u.createdAt,
      };
    });
  }

  async createUser(data: any) {
    const { name, email, password, roleName, nik, status, rtRwId } = data;

    const role = await userRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error("EMAIL_CONFLICT");
    }

    if (nik) {
      const existingNik = await userRepository.findByNik(nik);
      if (existingNik) {
        throw new Error("NIK_CONFLICT");
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await userRepository.create({
      name,
      email,
      password: passwordHash,
      roleId: role.id,
      nik: nik || null,
      status: status || "Aktif",
      rtRwId: rtRwId ? parseInt(rtRwId) : null,
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.name,
    };
  }

  async updateUser(id: string, data: any) {
    const { name, email, password, roleName, nik, status, rtRwId } = data;

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    let roleId = user.roleId;
    if (roleName) {
      const role = await userRepository.findRoleByName(roleName);
      if (!role) {
        throw new Error("ROLE_NOT_FOUND");
      }
      roleId = role.id;
    }

    const updateData: any = { name, email, roleId };
    if (password) {
      updateData.password = await hashPassword(password);
    }
    if (nik !== undefined) {
      updateData.nik = nik || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (rtRwId !== undefined) {
      updateData.rtRwId = rtRwId ? parseInt(rtRwId) : null;
    }

    const updatedUser = await userRepository.update(id, updateData);

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
}

export const userService = new UserService();
