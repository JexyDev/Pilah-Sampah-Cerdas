/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
        const rolesList = [
            "SUPER_ADMIN",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "WARGA",
        ];
        const roleMap = {};
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
                email: `superadmin.test-${Date.now()}@psc.id`,
                name: "Super Admin",
                roleId: roleMap["SUPER_ADMIN"].id,
                nik: "327301" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+628111111112",
                email: `admin.test-${Date.now()}@psc.id`,
                name: "Admin DLH",
                roleId: roleMap["ADMIN_DLH"].id,
                nik: "327302" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+628111111113",
                email: `camat.test-${Date.now()}@psc.id`,
                name: "Camat Coblong",
                roleId: roleMap["CAMAT"].id,
                nik: "327303" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+628111111114",
                email: `lurah.test-${Date.now()}@psc.id`,
                name: "Lurah Dago",
                roleId: roleMap["LURAH"].id,
                nik: "327304" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+628111111115",
                email: `rw.test-${Date.now()}@psc.id`,
                name: "Asep RW 06",
                roleId: roleMap["RW"].id,
                nik: "327305" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+628111111117",
                email: `petugas.test-${Date.now()}@psc.id`,
                name: "Budi Petugas Residu",
                roleId: roleMap["PETUGAS_RESIDU"].id,
                nik: "327307" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            },
            {
                phone: "+6282100000001",
                email: `warga.test-${Date.now()}@psc.id`,
                name: "Test Warga E2E",
                roleId: roleMap["WARGA"].id,
                nik: "3273" + Math.floor(100000000000 + Math.random() * 900000000000).toString(),
            },
        ];
        for (const u of userSeeds) {
            await prisma.user.upsert({
                where: { phone: u.phone },
                update: {},
                create: {
                    ...u,
                    password: passwordHash,
                    status: "Aktif",
                },
            });
        }
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
            const payload = JSON.parse(Buffer.from(loginResult.accessToken.split(".")[1], "base64").toString());
            expect(payload.role).toBe(testUser.role);
        }
    });
    it("should ensure audit logs can be fetched by systemService", async () => {
        const logs = await systemService.getAuditTrails();
        expect(Array.isArray(logs)).toBe(true);
    });
});
