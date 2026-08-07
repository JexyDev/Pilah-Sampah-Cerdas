/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { describe, it, expect, vi } from "vitest";
import { readOnlyGuard } from "./readOnlyGuard.js";
import { generateAccessToken } from "../utils/jwtUtils.js";
describe("readOnlyGuard middleware tests", () => {
    const mockResponse = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };
    it("should block write operations (POST) for CAMAT", () => {
        const token = generateAccessToken({ userId: "camat-1", role: "CAMAT" });
        const req = {
            method: "POST",
            originalUrl: "/api/v1/users",
            headers: { authorization: `Bearer ${token}` },
            cookies: {},
        };
        const res = mockResponse();
        const next = vi.fn();
        readOnlyGuard(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: "FORBIDDEN",
        }));
        expect(next).not.toHaveBeenCalled();
    });
    it("should block write operations (PUT) for LURAH", () => {
        const token = generateAccessToken({ userId: "lurah-1", role: "LURAH" });
        const req = {
            method: "PUT",
            originalUrl: "/api/v1/bins/bin-uuid",
            headers: { authorization: `Bearer ${token}` },
            cookies: {},
        };
        const res = mockResponse();
        const next = vi.fn();
        readOnlyGuard(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    it("should block write operations (POST) for ADMIN_DLH", () => {
        const token = generateAccessToken({ userId: "dlh-1", role: "ADMIN_DLH" });
        const req = {
            method: "POST",
            originalUrl: "/api/v1/users",
            headers: { authorization: `Bearer ${token}` },
            cookies: {},
        };
        const res = mockResponse();
        const next = vi.fn();
        readOnlyGuard(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    it("should allow resolution endpoint (PUT /api/v1/waste/logs/:id/resolve) for ADMIN_DLH", () => {
        const token = generateAccessToken({ userId: "dlh-1", role: "ADMIN_DLH" });
        const req = {
            method: "PUT",
            originalUrl: "/api/v1/waste/logs/some-uuid/resolve",
            headers: { authorization: `Bearer ${token}` },
            cookies: {},
        };
        const res = mockResponse();
        const next = vi.fn();
        readOnlyGuard(req, res, next);
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
    it("should allow any operations for SUPER_USER", () => {
        const token = generateAccessToken({ userId: "sa-1", role: "SUPER_USER" });
        const req = {
            method: "POST",
            originalUrl: "/api/v1/users",
            headers: { authorization: `Bearer ${token}` },
            cookies: {},
        };
        const res = mockResponse();
        const next = vi.fn();
        readOnlyGuard(req, res, next);
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});
