/**
 * Project: TrashCare
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

    const isAdminOrPetugas = [
      "SUPER_ADMIN",
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "PETUGAS_RESIDU",
      "MAHASISWA_KKN",
    ].includes(role);

    if (isAdminOrPetugas) {
      // 1. Fetch real BinResetRequests from database
      try {
        const requests = await prisma.binResetRequest.findMany({
          include: {
            bin: {
              include: {
                rtRw: true,
                category: true,
              },
            },
            user: true,
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        });

        const reqNotifications = requests.map((r) => {
          const now = new Date();
          const diffMs = now.getTime() - new Date(r.createdAt).getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          let time = "Baru saja";
          if (diffDays > 0) time = `${diffDays} hari lalu`;
          else if (diffHours > 0) time = `${diffHours} jam lalu`;
          else if (diffMins > 0) time = `${diffMins} menit lalu`;

          const binCategory = r.bin?.category?.name || "Organik";
          const binQr = r.bin?.qrCode || "BIN";
          const area = r.bin?.rtRw?.name || "RT 01 / RW 04";

          return {
            id: `req-${r.id}`,
            type: "PENGAJUAN_PENGOSONGAN",
            title: "Pengajuan Pengosongan Baru",
            desc: `Warga (${r.user?.name || "Warga"}) mengajukan pengosongan tong ${binCategory} (${binQr}) di ${area}. [REQ-${r.id}]`,
            isRead: r.status !== "PENDING",
            time,
            icon: "delete_sweep",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-500",
          };
        });

        // 2. Active Shift Notification
        const currentHour = (new Date().getUTCHours() + 7) % 24;
        const isMorning = currentHour >= 6 && currentHour < 12;
        const scheduleNotif = {
          id: `sched-active-shift-${new Date().toISOString().slice(0, 10)}`,
          type: "JADWAL_JEMPUT",
          title: isMorning ? "Jadwal Jemput Pagi" : "Jadwal Jemput Sore",
          desc: `Terdapat tempat sampah warga yang perlu diangkut pada shift ${
            isMorning ? "Pagi (06:00 - 08:00 WIB)" : "Sore (16:00 - 18:00 WIB)"
          }.`,
          isRead: false,
          time: "Shift Aktif Hari Ini",
          icon: "local_shipping",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        };

        // 3. User direct DB notifications
        let userNotifs: any[] = [];
        if (userId) {
          try {
            const dbNotifs = await prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 10,
            });
            userNotifs = dbNotifs.map(mapNotification);
          } catch (e) {
            // ignore
          }
        }

        formattedNotifications = [scheduleNotif, ...reqNotifications, ...userNotifs];
      } catch (err) {
        console.error("[NotificationRoute] Error fetching admin notifications:", err);
      }
    } else {
      // Warga user notifications
      if (userId) {
        try {
          const dbNotifs = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
          });
          formattedNotifications = dbNotifs.map(mapNotification);
        } catch (e) {
          // ignore
        }
      }

      if (formattedNotifications.length === 0) {
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

// PUT /api/v1/notifications/:id/read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    res.status(200).json({ status: "success", message: "Notifikasi berhasil ditandai dibaca" });
  } catch (error) {
    console.error("Mark Single Notification Read Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menandai notifikasi" });
  }
});

// POST /api/v1/notifications/device-token
router.post("/device-token", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });
    res.status(200).json({ status: "success", message: "Device token berhasil disimpan" });
  } catch (error) {
    console.error("Register Device Token Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menyimpan device token" });
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
