/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { systemService } from "../services/systemService.js";
export class SystemController {
    /**
     * Get all audit trails (SUPER USER only)
     */
    async getAuditTrails(req, res) {
        try {
            const logs = await systemService.getAuditTrails();
            res.status(200).json({ success: true, data: logs });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    /**
     * Create a new social feed entry
     */
    async createSocialFeed(req, res) {
        try {
            const { tipe, deskripsi, entityId } = req.body;
            if (!tipe || !deskripsi) {
                res
                    .status(400)
                    .json({ success: false, code: "BAD_REQUEST", message: "tipe dan deskripsi wajib diisi" });
                return;
            }
            const userId = req.user.userId;
            const entry = await systemService.createSocialFeed(userId, tipe, deskripsi, entityId);
            res.status(201).json({
                success: true,
                message: "Aktivitas berhasil ditambahkan ke feed sosial",
                data: entry,
            });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    /**
     * Get public social feed list
     */
    async getSocialFeed(req, res) {
        try {
            const list = await systemService.getSocialFeed();
            res.status(200).json({ success: true, data: list });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
}
export const systemController = new SystemController();
