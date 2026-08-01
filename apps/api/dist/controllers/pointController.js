/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { pointService } from "../services/pointService.js";
export class PointController {
    /**
     * Get point ledger for the current user
     */
    async getMyLedger(req, res) {
        try {
            const userId = req.user.userId;
            const ledger = await pointService.getLedger(userId);
            res.status(200).json({
                success: true,
                data: ledger,
            });
        }
        catch (error) {
            console.error("Point Ledger Error:", error);
            res
                .status(500)
                .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin" });
        }
    }
    /**
     * Get point ledger for a specific user (Admin only)
     */
    async getUserLedger(req, res) {
        try {
            const { userId } = req.params;
            const ledger = await pointService.getLedger(userId);
            res.status(200).json({
                success: true,
                data: ledger,
            });
        }
        catch (error) {
            console.error("Point Ledger Error:", error);
            res
                .status(500)
                .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin user" });
        }
    }
    /**
     * Get leaderboard
     */
    async getLeaderboard(req, res) {
        try {
            const leaderboard = await pointService.getLeaderboard();
            res.status(200).json({
                success: true,
                data: leaderboard,
            });
        }
        catch (error) {
            console.error("Point Leaderboard Error:", error);
            res
                .status(500)
                .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil leaderboard" });
        }
    }
    /**
     * Convert user points to cash (Saldo E-Wallet)
     */
    async convertPoints(req, res) {
        res.status(501).json({
            error: "NOT_IMPLEMENTED",
            message: "Fitur penukaran poin belum tersedia (ditangguhkan sesuai arahan dinas).",
        });
    }
}
export const pointController = new PointController();
