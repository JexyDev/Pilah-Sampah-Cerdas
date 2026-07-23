/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();
const prisma = new PrismaClient();

// Helper to map DB Notification to Frontend format
const mapNotification = (n: any) => {
  let type = "INFO";
  let icon = "info";
  let iconBg = "bg-blue-100";
  let iconColor = "text-blue-500";

  const titleUpper = n.title.toUpperCase();
  const messageUpper = n.message.toUpperCase();

  if (titleUpper.includes("POIN") || messageUpper.includes("POIN")) {
    type = "POIN_BERTAMBAH";
    icon = "star";
    iconBg = "bg-yellow-100";
    iconColor = "text-yellow-500";
  } else if (
    titleUpper.includes("TONG") ||
    titleUpper.includes("KRITIS") ||
    titleUpper.includes("PENUH") ||
    messageUpper.includes("TONG") ||
    messageUpper.includes("KRITIS") ||
    messageUpper.includes("PENUH")
  ) {
    type = "TONG_PENUH";
    icon = "warning";
    iconBg = "bg-red-100";
    iconColor = "text-red-500";
  } else if (
    titleUpper.includes("PENGOSONGAN") ||
    titleUpper.includes("PENGAJUAN") ||
    messageUpper.includes("PENGOSONGAN") ||
    messageUpper.includes("PENGAJUAN")
  ) {
    type = "PENGAJUAN_PENGOSONGAN";
    icon = "delete_sweep";
    iconBg = "bg-orange-100";
    iconColor = "text-orange-500";
  } else if (titleUpper.includes("SETUJU") || messageUpper.includes("SETUJU")) {
    type = "PENGAJUAN_DISETUJUI";
    icon = "check_circle";
    iconBg = "bg-green-100";
    iconColor = "text-green-500";
  }

  // Calculate relative time
  const now = new Date();
  const diffMs = now.getTime() - new Date(n.createdAt).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let time = "Baru saja";
  if (diffDays > 0) {
    time = `${diffDays} hari lalu`;
  } else if (diffHours > 0) {
    time = `${diffHours} jam lalu`;
  } else if (diffMins > 0) {
    time = `${diffMins} menit lalu`;
  }

  return {
    id: n.id,
    type,
    title: n.title,
    desc: n.message,
    isRead: n.isRead,
    time,
    icon,
    iconBg,
    iconColor,
  };
};

// GET /api/v1/notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = ((req.query.role as string) || req.user?.role || "WARGA").toUpperCase();
    const userId = req.user?.userId;

    let formattedNotifications: any[] = [];

    // 1. Try to fetch notifications from DB where the target user's role matches OR userId matches
    try {
      const dbNotifications = await prisma.notification.findMany({
        where: {
          userId: userId, // Use userId instead of role to be more precise for the current user
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // 2. Map notifications to frontend structure
      formattedNotifications = dbNotifications.map(mapNotification);
    } catch (dbError) {
      console.warn(
        "Database connection failed for notifications, falling back to mock seeds:",
        dbError
      );
    }

    // 3. Fallback: if database is empty or unreachable, provide seed notifications
    if (formattedNotifications.length === 0) {
      if (role === "WARGA") {
        formattedNotifications = [
          {
            id: "seed-notif-1",
            type: "TONG_PENUH",
            title: "Kapasitas Tong Kritis",
            desc: "Tong Anorganik Anda hampir penuh (92%).",
            isRead: false,
            time: "2 jam lalu",
            icon: "warning",
            iconBg: "bg-red-100",
            iconColor: "text-red-500",
          },
          {
            id: "seed-notif-2",
            type: "POIN_BERTAMBAH",
            title: "Poin Bertambah",
            desc: "Anda mendapatkan +150 poin dari setoran organik terakhir.",
            isRead: true,
            time: "1 hari lalu",
            icon: "star",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-500",
          },
          {
            id: "seed-notif-3",
            type: "INFO",
            title: "Jadwal Pengangkutan",
            desc: "Pengangkutan wilayah Anda dijadwalkan besok pagi pukul 08.00.",
            isRead: true,
            time: "2 hari lalu",
            icon: "local_shipping",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
          },
        ];
      } else {
        formattedNotifications = [
          {
            id: "seed-notif-admin-1",
            type: "TONG_PENUH",
            title: "Pengajuan Pengosongan Baru",
            desc: "Warga (Budi Antoro) mengajukan pengosongan tong Anorganik (BIN-124) di RT 01 / RW 04.",
            isRead: false,
            time: "10 menit lalu",
            icon: "delete_sweep",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-500",
          },
        ];
      }
    }

    res.status(200).json({
      status: "success",
      data: formattedNotifications,
    });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal memuat notifikasi dari server",
    });
  }
});

// PUT /api/v1/notifications/read-all
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
    res.status(200).json({ status: "success", message: "Semua notifikasi ditandai dibaca" });
  } catch (error) {
    console.error("Update Notifications Error:", error);
    res.status(500).json({ status: "error", message: "Gagal mengupdate notifikasi" });
  }
});

// DELETE /api/v1/notifications/all
router.delete("/all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.deleteMany({
      where: { userId },
    });
    res.status(200).json({ status: "success", message: "Semua notifikasi dihapus" });
  } catch (error) {
    console.error("Delete Notifications Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menghapus notifikasi" });
  }
});

export default router;
