/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { authService } from "./authService.js";
import { systemService } from "./systemService.js";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("E2E & Security Validation for All 8 Roles", () => {
  beforeAll(async () => {
    const roleWarga = await prisma.role.findFirst({ where: { name: "WARGA" } });
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.upsert({
      where: { phone: "+6282100000001" },
      update: {},
      create: {
        phone: "+6282100000001",
        email: "warga.test@psc.id",
        name: "Test Warga E2E",
        roleId: roleWarga!.id,
        nik: "3273010000000099",
        password: passwordHash,
        status: "Aktif",
      }
    });
  });

  const roles = [
    { phone: "+628111111111", role: "SUPER_ADMIN" },
    { phone: "+628111111112", role: "ADMIN_DLH" },
    { phone: "+628111111113", role: "CAMAT" },
    { phone: "+628111111114", role: "LURAH" },
    { phone: "+628111111115", role: "RW" },
    { phone: "+628111111117", role: "PETUGAS_RESIDU" },
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
