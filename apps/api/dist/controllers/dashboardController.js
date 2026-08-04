/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { dashboardService } from "../services/dashboardService.js";
export const dashboardController = {
    getKpi: async (req, res) => {
        try {
            const { wilayah, period } = req.query;
            const kpi = await dashboardService.getKpi(wilayah, period);
            res.status(200).json({
                success: true,
                data: kpi,
            });
        }
        catch (error) {
            console.error("[DashboardController] getKpi error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getTransactions: async (req, res) => {
        try {
            const { wilayah } = req.query;
            const transactions = await dashboardService.getRecentTransactions(wilayah);
            res.status(200).json({
                success: true,
                data: transactions,
            });
        }
        catch (error) {
            console.error("[DashboardController] getTransactions error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getTrend: async (req, res) => {
        try {
            const { weeks, wilayah } = req.query;
            const parsedWeeks = weeks ? parseInt(weeks) : 8;
            const trend = await dashboardService.getTrend(parsedWeeks, wilayah);
            res.status(200).json({
                success: true,
                data: trend,
            });
        }
        catch (error) {
            console.error("[DashboardController] getTrend error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getSummary: async (req, res) => {
        try {
            const userId = req.user.userId;
            const role = req.user.role;
            if (role === "WARGA") {
                const summary = await dashboardService.getWargaSummary(userId);
                res.status(200).json({ success: true, data: summary });
            }
            else {
                const kpi = await dashboardService.getKpi();
                res.status(200).json({ success: true, data: kpi });
            }
        }
        catch (error) {
            console.error("[DashboardController] getSummary error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getAnalytics: async (req, res) => {
        try {
            const analytics = await dashboardService.getAnalytics();
            res.status(200).json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            console.error("[DashboardController] getAnalytics error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    getRegions: async (req, res) => {
        try {
            const regions = await dashboardService.getRegions();
            res.status(200).json({
                success: true,
                data: regions,
            });
        }
        catch (error) {
            console.error("[DashboardController] getRegions error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
    exportDataset: async (req, res) => {
        try {
            const csvData = await dashboardService.exportDataset();
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=waste_dataset.csv");
            res.status(200).send(csvData);
        }
        catch (error) {
            console.error("[DashboardController] exportDataset error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },
};
