import { dashboardService } from "../services/dashboardService.js";
export const dashboardController = {
    getKpi: async (req, res) => {
        try {
            const kpi = await dashboardService.getKpi();
            res.status(200).json({
                success: true,
                data: kpi
            });
        }
        catch (error) {
            console.error("[DashboardController] getKpi error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getTransactions: async (req, res) => {
        try {
            const transactions = await dashboardService.getRecentTransactions();
            res.status(200).json({
                success: true,
                data: transactions
            });
        }
        catch (error) {
            console.error("[DashboardController] getTransactions error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
};
