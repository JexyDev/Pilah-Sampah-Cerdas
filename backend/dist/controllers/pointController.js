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
                data: ledger
            });
        }
        catch (error) {
            console.error("Point Ledger Error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin" });
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
                data: ledger
            });
        }
        catch (error) {
            console.error("Point Ledger Error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin user" });
        }
    }
}
export const pointController = new PointController();
