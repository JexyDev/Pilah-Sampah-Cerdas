/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authService } from "./authService.js";
import { systemService } from "./systemService.js";

const prisma = new PrismaClient();

describe("E2E & Security Validation for All 8 Roles", () => {
  const roles = [
    { email: "superadmin@psc.id", role: "SUPER_ADMIN" },
    { email: "admin@psc.id", role: "ADMIN_DLH" },
    { email: "camat@psc.id", role: "CAMAT" },
    { email: "lurah@psc.id", role: "LURAH" },
    { email: "rw@psc.id", role: "RW" },
    { email: "petugas@psc.id", role: "PETUGAS_RESIDU" },
    { email: "warga@psc.id", role: "WARGA" },
  ];

  it("should verify login and credentials generation for all seeded roles", async () => {
    for (const testUser of roles) {
      const loginResult = await authService.login(testUser.email, "password123");
      expect(loginResult).toHaveProperty("accessToken");
      expect(loginResult).toHaveProperty("refreshToken");
      
      const payload = JSON.parse(Buffer.from(loginResult.accessToken.split(".")[1], "base64").toString());
      expect(payload.role).toBe(testUser.role);
    }
  });

  it("should ensure audit logs can be fetched by systemService", async () => {
    const logs = await systemService.getAuditTrails();
    expect(Array.isArray(logs)).toBe(true);
  });
});
