import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { dashboardService } from "../services/dashboardService.js";


export const dashboardController = {
  getKpi: async (req: Request, res: Response) => {
    try {
      let { wilayah, period, startDate, endDate } = req.query;
      const user = req.user;

      const isAllWilayah = (w: any) =>
        !w ||
        w === "ALL" ||
        w === "Semua Kelurahan" ||
        w === "Kecamatan Coblong" ||
        w === "semua" ||
        w === "all";

      if (user && (user.role === "DPL" || user.role === "DOSEN_PEMBIMBING")) {

        const dplGroups = await prisma.kelompokKkn.findMany({
          where: { dplId: user.userId || (user as any).id },
          select: { kelurahan: true },
        });
        const dplKelurahans = Array.from(
          new Set(dplGroups.map((g) => g.kelurahan).filter(Boolean))
        ) as string[];

        if (dplKelurahans.length === 0 && user.rwId) {
          const userArea = await prisma.rw.findUnique({
            where: { id: user.rwId },
            include: { kelurahan: true },
          });
          if (userArea?.kelurahan?.name) dplKelurahans.push(userArea.kelurahan.name);
        }

        if (isAllWilayah(wilayah)) {
          if (dplKelurahans.length > 0) {
            wilayah = dplKelurahans.join(",");
          }
        } else if (dplKelurahans.length > 0) {
          // If specific wilayah requested, ensure it's allowed for DPL
          const reqStr = String(wilayah).toLowerCase();
          const isAllowed = dplKelurahans.some((k) => reqStr.includes(k.toLowerCase()));
          if (!isAllowed) {
            wilayah = dplKelurahans.join(",");
          }
        }
      } else if (user && (user.role === "RW" || user.role === "RT") && user.rwId) {

        const rwArea = await prisma.rw.findUnique({
          where: { id: user.rwId },
          include: { kelurahan: true },
        });
        if (rwArea) {
          wilayah = `${rwArea.name} ${rwArea.kelurahan?.name || ""}`.trim();
        }
      } else if (!wilayah && user && (user.role === "LURAH" || user.role === "CAMAT")) {

        if (user.rwId) {
          const userArea = await prisma.rw.findUnique({
            where: { id: user.rwId },
            include: { kelurahan: { include: { kecamatan: true } } },
          });
          if (user.role === "LURAH" && userArea?.kelurahan) {
            wilayah = userArea.kelurahan.name;
          } else if (user.role === "CAMAT" && userArea?.kelurahan?.kecamatan) {
            wilayah = userArea.kelurahan.kecamatan.name;
          }
        } else {
          const dbU = await prisma.user.findUnique({
            where: { id: user.userId },
            include: { rw: { include: { kelurahan: { include: { kecamatan: true } } } } },
          });
          if (user.role === "LURAH" && dbU?.rw?.kelurahan) {
            wilayah = dbU.rw.kelurahan.name;
          } else if (user.role === "CAMAT" && dbU?.rw?.kelurahan?.kecamatan) {
            wilayah = dbU.rw.kelurahan.kecamatan.name;
          } else if (user.role === "LURAH" && dbU?.address) {
            const match = await prisma.kelurahan.findFirst({
              where: { name: { contains: dbU.address, mode: "insensitive" } },
            });
            if (match) wilayah = match.name;
          }
        }
      }

      const kpi = await dashboardService.getKpi(
        wilayah as string,
        period as string,
        startDate as string,
        endDate as string
      );
      res.status(200).json({
        success: true,
        data: kpi,
      });
    } catch (error) {
      console.error("[DashboardController] getKpi error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getTransactions: async (req: Request, res: Response) => {
    try {
      let { wilayah } = req.query;
      const user = req.user;

      if (user && (user.role === "DPL" || user.role === "DOSEN_PEMBIMBING")) {

        const dplGroups = await prisma.kelompokKkn.findMany({
          where: { dplId: user.userId || (user as any).id },
          select: { kelurahan: true },
        });
        const dplKelurahans = Array.from(
          new Set(dplGroups.map((g) => g.kelurahan).filter(Boolean))
        ) as string[];

        if (!wilayah || wilayah === "ALL" || wilayah === "Semua Kelurahan" || wilayah === "Kecamatan Coblong") {
          if (dplKelurahans.length > 0) {
            wilayah = dplKelurahans.join(",");
          }
        }
      } else if (!wilayah && user && user.role === "LURAH" && user.rwId) {

        const userArea = await prisma.rw.findUnique({
          where: { id: user.rwId },
          include: { kelurahan: true },
        });
        if (userArea?.kelurahan?.name) {
          wilayah = userArea.kelurahan.name;
        }
      }

      const transactions = await dashboardService.getRecentTransactions(wilayah as string);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error("[DashboardController] getTransactions error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getTrend: async (req: Request, res: Response) => {
    try {
      let { weeks, wilayah } = req.query;
      const user = req.user;

      const isAllWilayah = (w: any) =>
        !w ||
        w === "ALL" ||
        w === "Semua Kelurahan" ||
        w === "Kecamatan Coblong" ||
        w === "semua" ||
        w === "all";

      if (user && (user.role === "DPL" || user.role === "DOSEN_PEMBIMBING")) {

        const dplGroups = await prisma.kelompokKkn.findMany({
          where: { dplId: user.userId || (user as any).id },
          select: { kelurahan: true },
        });
        const dplKelurahans = Array.from(
          new Set(dplGroups.map((g) => g.kelurahan).filter(Boolean))
        ) as string[];

        if (isAllWilayah(wilayah) && dplKelurahans.length > 0) {
          wilayah = dplKelurahans.join(",");
        }
      } else if (!wilayah && user && user.role === "LURAH" && user.rwId) {

        const userArea = await prisma.rw.findUnique({
          where: { id: user.rwId },
          include: { kelurahan: true },
        });
        if (userArea?.kelurahan?.name) {
          wilayah = userArea.kelurahan.name;
        }
      }

      const parsedWeeks = weeks ? parseInt(weeks as string) : 8;
      const trend = await dashboardService.getTrend(parsedWeeks, wilayah as string);
      res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      console.error("[DashboardController] getTrend error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getSummary: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      if (role === "WARGA") {
        const summary = await dashboardService.getWargaSummary(userId);
        res.status(200).json({ success: true, data: summary });
      } else {
        const kpi = await dashboardService.getKpi();
        res.status(200).json({ success: true, data: kpi });
      }
    } catch (error) {
      console.error("[DashboardController] getSummary error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getAnalytics: async (req: Request, res: Response) => {
    try {
      const analytics = await dashboardService.getAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("[DashboardController] getAnalytics error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getRegions: async (req: Request, res: Response) => {
    try {
      const regions = await dashboardService.getRegions();
      res.status(200).json({
        success: true,
        data: regions,
      });
    } catch (error) {
      console.error("[DashboardController] getRegions error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  exportDataset: async (req: Request, res: Response) => {
    try {
      const csvData = await dashboardService.exportDataset();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=waste_dataset.csv");
      res.status(200).send(csvData);
    } catch (error) {
      console.error("[DashboardController] exportDataset error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
};
