import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { notificationSyncController } from "../controllers/notificationSyncController.js";

const router = Router();

/**
 * @swagger
 * /api/v1/notifications/sync:
 *   get:
 *     summary: Mendapatkan status sinkronisasi cache notifikasi HP (Cloud Sync)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get("/sync", authMiddleware, notificationSyncController.getSyncState);

/**
 * @swagger
 * /api/v1/notifications/sync:
 *   put:
 *     summary: Update status sinkronisasi cache notifikasi HP (Cloud Sync)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put("/sync", authMiddleware, notificationSyncController.updateSyncState);

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
    titleUpper.includes("TEMPAT SAMPAH") ||
    titleUpper.includes("TONG") ||
    titleUpper.includes("KRITIS") ||
    titleUpper.includes("PENUH") ||
    messageUpper.includes("TEMPAT SAMPAH") ||
    messageUpper.includes("TONG") ||
    messageUpper.includes("KRITIS") ||
    messageUpper.includes("PENUH")
  ) {
    type = "TEMPAT_SAMPAH_PENUH";
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
    createdAt: n.createdAt,
    icon,
    iconBg,
    iconColor,
  };
};

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Manajemen Notifikasi Pengguna & Device Push Token
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Mendapatkan seluruh notifikasi generik user (Warga / RW / RT / Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data notifikasi
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = ((req.query.role as string) || req.user?.role || "WARGA").toUpperCase();
    const userId = req.user?.userId;

    let formattedNotifications: any[] = [];

    const isDplRole = role === "DPL" || role === "DOSEN_PEMBIMBING";

    if (isDplRole && userId) {
      // 1. Ambil seluruh mahasiswa di kelompok bimbingan DPL ini
      const dplGroups = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: userId }, { dpl: { id: userId } }] },
        select: { students: { select: { userId: true, user: { select: { name: true } } } } },
      });
      const studentUserIds = dplGroups.flatMap((g) => g.students.map((s) => s.userId));

      // 2. Ambil pengajuan izin (Leave Request) mahasiswa bimbingan DPL
      let leaveNotifs: any[] = [];
      if (studentUserIds.length > 0) {
        const pendingLeave = await prisma.studentLeaveRequest.findMany({
          where: { studentId: { in: studentUserIds }, status: "PENDING" },
          include: { student: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 15,
        });

        leaveNotifs = pendingLeave.map((r) => {
          const diffMs = Date.now() - new Date(r.createdAt).getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          let time = "Baru saja";
          if (diffDays > 0) time = `${diffDays} hari lalu`;
          else if (diffHours > 0) time = `${diffHours} jam lalu`;
          else if (diffMins > 0) time = `${diffMins} menit lalu`;

          return {
            id: `leave-req-${r.id}`,
            type: "PENGAJUAN_IZIN",
            title: `Pengajuan ${r.type === "SAKIT" ? "Izin Sakit" : "Izin Meninggalkan Tempat"}`,
            desc: `Mahasiswa ${r.student?.name || "Bimbingan"} mengajukan ${r.type}: "${r.reason}". Mohon review/persetujuan DPL.`,
            isRead: false,
            time,
            createdAt: r.createdAt,
            icon: "event_note",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
          };
        });
      }

      // 3. Ambil notifikasi DB langsung untuk ID user DPL
      const dbNotifs = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const userNotifs = dbNotifs.map(mapNotification);
      const allDplNotifs = [...leaveNotifs, ...userNotifs];

      res.status(200).json({
        success: true,
        data: allDplNotifs,
        unreadCount: leaveNotifs.length + userNotifs.filter((n) => !n.isRead).length,
      });
      return;
    }

    const isAdminOrPetugas = [
      "DEVELOPER",
      "SUPER_USER",
      "PEMIMPIN",
      "PANITIA_TASKFORCE",
      "DPL",
      "ADMIN_DLH",
      "CAMAT",
      "LURAH",
      "RW",
      "RT",
      "PETUGAS_RESIDU",
      "MAHASISWA_KKN",
    ].includes(role);

    // Fetch user details for area scoping
    let dbUser = null;
    let areaIds: number[] = [];
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          rw: {
            include: {
              kelurahan: {
                include: {
                  kecamatan: true,
                },
              },
            },
          },
        },
      });

      if (dbUser?.rwId) {
        const area = dbUser.rw;
        if (area) {
          const rwPart =
            area.name
              .split("/")
              .map((s) => s.trim())
              .find((s) => s.startsWith("RW")) || area.name;

          const matchingAreas = await prisma.rw.findMany({
            where: {
              kelurahanId: area.kelurahanId,
              name: { contains: rwPart },
            },
            select: { id: true },
          });
          areaIds = matchingAreas.map((a) => a.id);
        }
        if (areaIds.length === 0) areaIds = [dbUser.rwId];
      }
    }

    if (isAdminOrPetugas) {
      // 1. Fetch real PENDING BinResetRequests scoped by area/role
      try {
        let reqWhere: any = { status: "PENDING" };
        if (["RW", "RT", "PETUGAS_RESIDU", "MAHASISWA_KKN"].includes(role)) {
          if (areaIds.length > 0) {
            reqWhere.bin = { rwId: { in: areaIds } };
          } else {
            reqWhere.bin = { rwId: -1 };
          }
        } else if (role === "LURAH" && dbUser?.rw?.kelurahanId) {
          reqWhere.bin = { rw: { kelurahanId: dbUser.rw.kelurahanId } };
        } else if (role === "CAMAT" && dbUser?.rw?.kelurahan?.kecamatanId) {
          reqWhere.bin = { rw: { kelurahan: { kecamatanId: dbUser.rw.kelurahan.kecamatanId } } };
        }

        const requests = await prisma.binResetRequest.findMany({
          where: reqWhere,
          include: {
            bin: {
              include: {
                rw: true,
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
          const area = r.bin?.rw?.name || "RW 04";

          return {
            id: `req-${r.id}`,
            type: "PENGAJUAN_PENGOSONGAN",
            title: "Pengajuan Pengosongan Baru",
            desc: `Warga (${r.user?.name || "Warga"}) mengajukan pengosongan Tempat Sampah ${binCategory} (${binQr}) di ${area}. [REQ-${r.id}]`,
            isRead: r.status !== "PENDING",
            time,
            createdAt: r.createdAt,
            icon: "delete_sweep",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-500",
          };
        });

        // 2. Fetch real full bins (>90% volume capacity) scoped by area/role
        let criticalBinNotifs: any[] = [];
        try {
          let binWhere: any = {};
          if (["RW", "PETUGAS_RESIDU", "MAHASISWA_KKN"].includes(role)) {
            if (areaIds.length > 0) {
              binWhere.rwId = { in: areaIds };
            } else {
              binWhere.rwId = -1;
            }
          } else if (role === "LURAH" && dbUser?.rw?.kelurahanId) {
            binWhere.rw = { kelurahanId: dbUser.rw.kelurahanId };
          } else if (role === "CAMAT" && dbUser?.rw?.kelurahan?.kecamatanId) {
            binWhere.rw = { kelurahan: { kecamatanId: dbUser.rw.kelurahan.kecamatanId } };
          }

          const fullBins = await prisma.bin.findMany({
            where: binWhere,
            include: { rw: true, category: true },
            take: 10,
          });
          const realCriticalBins = fullBins.filter(
            (b) =>
              Number(b.maxCapacityLiter) > 0 &&
              Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) > 0.9
          );
          criticalBinNotifs = realCriticalBins.map((b) => {
            const pct = Math.round(
              (Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter)) * 100
            );
            return {
              id: `crit-bin-${b.id}`,
              type: "TONG_PENUH",
              title: "Kapasitas Tempat Sampah Kritis",
              desc: `Tempat Sampah ${b.category?.name || ""} (${b.qrCode}) di ${b.rw?.name || "Wilayah"} telah mencapai ${pct}%!`,
              isRead: false,
              time: "Status Real-time",
              createdAt: b.updatedAt,
              icon: "warning",
              iconBg: "bg-red-100",
              iconColor: "text-red-500",
            };
          });
        } catch (e) {
          console.error("[NotificationRoute] Error fetching critical bins:", e);
        }

        // 3. User direct DB notifications
        let userNotifs: any[] = [];
        if (userId) {
          try {
            const dbNotifs = await prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 20,
            });
            userNotifs = dbNotifs.map(mapNotification).filter((n: any) => {
              const t = (n.title || "").toLowerCase();
              const d = (n.desc || "").toLowerCase();
              const isResetReq =
                t.includes("pengosongan") ||
                d.includes("pengosongan") ||
                d.includes("mengajukan") ||
                d.includes("[req-");
              return !isResetReq;
            });
          } catch {
            // ignore
          }
        }

        formattedNotifications = [
          ...criticalBinNotifs,
          ...reqNotifications,
          ...userNotifs,
        ];
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

          // Check if citizen has real bins that are > 90% full
          const myBinOwnerships = await prisma.binOwnership.findMany({
            where: { userId },
            include: { bin: { include: { category: true } } },
          });
          myBinOwnerships.forEach((bo) => {
            const b = bo.bin;
            if (
              b &&
              Number(b.maxCapacityLiter) > 0 &&
              Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) > 0.9
            ) {
              const pct = Math.round(
                (Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter)) * 100
              );
              formattedNotifications.unshift({
                id: `my-crit-bin-${b.id}`,
                type: "TEMPAT_SAMPAH_PENUH",
                title: "Kapasitas Tempat Sampah Kritis",
                desc: `Tempat sampah ${b.category?.name || ""} Anda hampir penuh (${pct}%).`,
                isRead: false,
                time: "Status Real-time",
                createdAt: b.updatedAt,
                icon: "warning",
                iconBg: "bg-red-100",
                iconColor: "text-red-500",
              });
            }
          });
        } catch {
          // ignore
        }
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

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Membaca (tandai selesai) seluruh notifikasi user secara massal
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Semua notifikasi berhasil ditandai dibaca
 */
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

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Membaca (tandai selesai) notifikasi individual berdasarkan ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Notifikasi
 *     responses:
 *       200:
 *         description: Notifikasi berhasil ditandai dibaca
 */
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

/**
 * @swagger
 * /api/v1/notifications/device-token:
 *   post:
 *     summary: Registrasi FCM Push Notification Device Token (Mobile Spec)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device token disimpan
 */
router.post("/device-token", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.userId;
    if (token) {
      // Re-bind token: Remove token from any other user accounts to prevent notification leaks
      await prisma.user.updateMany({
        where: { fcmToken: token, id: { not: userId } },
        data: { fcmToken: null },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: token },
      });
    }
    res.status(200).json({ status: "success", message: "Device token berhasil disimpan" });
  } catch (error) {
    console.error("Register Device Token Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menyimpan device token" });
  }
});

/**
 * @swagger
 * /api/v1/notifications/unregister-token:
 *   post:
 *     summary: Hapus registrasi FCM Push Notification Device Token (Mobile Spec)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device token berhasil dihapus
 */
router.post("/unregister-token", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });
    res.status(200).json({ status: "success", message: "Device token berhasil dihapus" });
  } catch (error) {
    console.error("Unregister Device Token Error:", error);
    res.status(500).json({ status: "error", message: "Gagal menghapus device token" });
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
