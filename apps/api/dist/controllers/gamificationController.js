/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { gamificationService } from "../services/gamificationService.js";
import { getScopingFilters } from "../utils/rbacScoping.js";
export class GamificationController {
    /**
     * Submit a recycle idea
     */
    async submitIdea(req, res) {
        try {
            const { judul, material, foto } = req.body;
            if (!judul || !material) {
                res
                    .status(400)
                    .json({ success: false, code: "BAD_REQUEST", message: "judul dan material wajib diisi" });
                return;
            }
            const userId = req.user.userId;
            const idea = await gamificationService.submitIdea(userId, judul, material, foto);
            res
                .status(201)
                .json({ success: true, message: "Ide daur ulang berhasil diajukan", data: idea });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    /**
     * Get all recycle ideas based on scoping
     */
    async getIdeas(req, res) {
        try {
            const user = req.user;
            const scoping = await getScopingFilters(user);
            const ideas = await gamificationService.getIdeas(scoping.userFilter);
            res.status(200).json({ success: true, data: ideas });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    /**
     * Approve a recycle idea (RW / Admin DLH)
     */
    async approveIdea(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            const idea = await gamificationService.approveIdea(id, adminUserId);
            res.status(200).json({
                success: true,
                message: "Ide daur ulang disetujui, poin berhasil dikirim",
                data: idea,
            });
        }
        catch (error) {
            res
                .status(400)
                .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
        }
    }
    /**
     * Get gamification leaderboard (citizens and regions)
     */
    async getLeaderboard(req, res) {
        try {
            const leaderboard = await gamificationService.getLeaderboard();
            res.status(200).json({ success: true, data: leaderboard });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getLeaderboardKkn(req, res) {
        try {
            const leaderboard = await gamificationService.getLeaderboardKkn();
            res.status(200).json({ success: true, data: leaderboard });
        }
        catch (error) {
            res
                .status(500)
                .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
}
export const gamificationController = new GamificationController();
