import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { authService } from "./authService.js";
import { systemService } from "./systemService.js";

import bcrypt from "bcryptjs";


describe("E2E & Security Validation for All 8 Roles", () => {
  beforeAll(async () => {
    const rolesList = [
      "SUPER_USER",
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "MAHASISWA_KKN",
      "WARGA",
    ];
    const roleMap: Record<string, any> = {};
    for (const r of rolesList) {
      roleMap[r] = await prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r },
      });
    }

    const passwordHash = await bcrypt.hash("password123", 10);
    const userSeeds = [
      {
        phone: "+628111111111",
        name: "SUPER USER",
        roleId: roleMap["SUPER_USER"].id,
      },
      {
        phone: "+628111111112",
        name: "ADMIN DLH",
        roleId: roleMap["ADMIN_DLH"].id,
      },
      {
        phone: "+628111111113",
        name: "CAMAT",
        roleId: roleMap["CAMAT"].id,
      },
      {
        phone: "+628111111114",
        name: "LURAH",
        roleId: roleMap["LURAH"].id,
      },
      {
        phone: "+628111111115",
        name: "RW",
        roleId: roleMap["RW"].id,
      },
      {
        phone: "+628111111117",
        name: "PETUGAS RESIDU",
        roleId: roleMap["PETUGAS_RESIDU"].id,
      },
      {
        phone: "+628111111118",
        name: "MAHASISWA KKN",
        roleId: roleMap["MAHASISWA_KKN"].id,
      },
      {
        phone: "+6282100000001",
        name: "Test Warga E2E",
        roleId: roleMap["WARGA"].id,
      },
    ];

    const testPhones = userSeeds.map((u) => u.phone);
    const usersToDelete = await prisma.user.findMany({
      where: { phone: { in: testPhones } },
      select: { id: true },
    });
    const userIds = usersToDelete.map((u) => u.id);
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: testPhones } },
    });

    for (const u of userSeeds) {
      await prisma.user.upsert({
        where: { phone: u.phone },
        update: { status: "Aktif", password: passwordHash },
        create: {
          ...u,
          password: passwordHash,
          status: "Aktif",
        },
      });
    }
  });

  const roles = [
    { phone: "+628111111111", role: "SUPER_USER" },
    { phone: "+628111111112", role: "ADMIN_DLH" },
    { phone: "+628111111113", role: "CAMAT" },
    { phone: "+628111111114", role: "LURAH" },
    { phone: "+628111111115", role: "RW" },
    { phone: "+628111111117", role: "PETUGAS_RESIDU" },
    { phone: "+628111111118", role: "MAHASISWA_KKN" },
    { phone: "+6282100000001", role: "WARGA" },
  ];

  it("should verify login and credentials generation for all seeded roles", async () => {
    for (const testUser of roles) {
      const loginResult = await authService.login(testUser.phone, "password123");
      expect(loginResult).toHaveProperty("accessToken");
      expect(loginResult).toHaveProperty("refreshToken");

      const payload = JSON.parse(
        Buffer.from(loginResult.accessToken.split(".")[1], "base64").toString()
      );
      expect(payload.role).toBe(testUser.role);
    }
  });

  it("should ensure audit logs can be fetched by systemService", async () => {
    const logs = await systemService.getAuditTrails();
    expect(Array.isArray(logs)).toBe(true);
  });
});
