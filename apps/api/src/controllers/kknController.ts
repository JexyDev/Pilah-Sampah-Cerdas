import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { kknService } from "../services/kknService.js";
import { facilityService } from "../services/facilityService.js";
import { timelineKknService } from "../services/timelineKknService.js";
import { extractUploadedFileUrls } from "../middlewares/uploadMiddleware.js";


export class KknController {
  async validateQrMaster(req: Request, res: Response): Promise<void> {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        res.status(400).json({ error: "BAD_REQUEST", message: "QR Code diperlukan." });
        return;
      }
      const existingBin = await prisma.bin.findUnique({
        where: { qrCode: String(qrCode).trim() },
        include: { qrBatch: true },
      });

      if (!existingBin) {
        res.status(404).json({
          error: "QR_NOT_FOUND",
          message: "QR Code Master tidak ditemukan dalam database sistem. Pastikan QR dicetak melalui sistem BERSEKA.",
        });
        return;
      }

      if (["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(existingBin.status)) {
        res.status(400).json({
          error: "QR_IN_USE",
          message: "QR Code ini sudah terdaftar dan aktif pada Tempat Sampah lain.",
        });
        return;
      }

      if (existingBin.status === "BROKEN") {
        res.status(400).json({
          error: "QR_BROKEN",
          message: "QR Code ini telah ditandai rusak.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "QR Code Master Valid dan belum digunakan.",
        data: {
          qrCode: existingBin.qrCode,
          status: existingBin.status,
          binId: existingBin.id,
          batchCode: existingBin.qrBatch?.batchCode || null,
        },
      });
    } catch (error: any) {
      console.error("[KknController] validateQrMaster error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memvalidasi QR Master" });
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getDashboardStats(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getDashboardStats error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRegisteredWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const rwId = req.query.rwId ? parseInt(req.query.rwId as string, 10) : undefined;
      const search = req.query.search as string | undefined;

      const data = await kknService.getRegisteredWarga(kknUserId, { rwId, search });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getRegisteredWarga error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWargaDetail(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId } = req.params;
      const data = await kknService.getWargaDetail(kknUserId, wargaId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getWargaDetail error:", error);
      const code = error.message === "FORBIDDEN_SCOPE" ? 403 : 500;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getWargaList(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const status = req.query.status as string;
      const kelurahan = req.query.kelurahan as string;
      const rwId = req.query.rw ? parseInt(req.query.rw as string, 10) : undefined;
      const search = req.query.search as string;

      const data = await kknService.getWargaList(kknUserId, { status, kelurahan, rwId, search });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getWargaList error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async activateByScan(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId, qrCode, latitude, longitude } = req.body;

      if (!wargaId || !qrCode) {
        return res.status(400).json({
          success: false,
          message: "Field wargaId dan qrCode wajib diisi",
        });
      }

      const data = await kknService.activateByScan(
        wargaId,
        qrCode,
        latitude != null ? Number(latitude) : undefined,
        longitude != null ? Number(longitude) : undefined,
        kknUserId
      );

      res.status(200).json({
        success: true,
        message: "Aktivasi warga via scan QR berhasil",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] activateByScan error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async activateBin(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId, binOrganikId, binAnorganikId, latitude, longitude } = req.body;

      if (!wargaId || !binOrganikId || !binAnorganikId) {
        return res.status(400).json({
          success: false,
          message: "Field wargaId, binOrganikId, dan binAnorganikId wajib diisi",
        });
      }

      await kknService.activateWargaBin(
        wargaId,
        binOrganikId,
        binAnorganikId,
        latitude != null ? Number(latitude) : undefined,
        longitude != null ? Number(longitude) : undefined,
        kknUserId
      );
      res.status(200).json({
        success: true,
        message: "Tempat sampah berhasil di-binding ke akun Warga di wilayah RT/RW dampingan KKN.",
      });
    } catch (error: any) {
      console.error("[KknController] activateBin error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createLeaveRequest(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      let fotoBuktiUrl = req.body.fotoBuktiUrl;
      if (req.file) {
        fotoBuktiUrl = `/uploads/${req.file.filename}`;
      }
      const data = await kknService.createLeaveRequest(studentId, {
        ...req.body,
        fotoBuktiUrl,
      });
      res.status(201).json({
        success: true,
        message: "Pengajuan izin berhasil dikirim. Menunggu verifikasi Dosen Pendamping Lapangan (DPL).",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] createLeaveRequest error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLeaveRequests(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const data = await kknService.getLeaveRequests(studentId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getLeaveRequests error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async cancelLeaveRequest(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const leaveRequestId = req.params.id;
      const reason = req.body?.alasan || req.body?.reason;
      const result = await kknService.cancelLeaveRequest(studentId, leaveRequestId, reason);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknController] cancelLeaveRequest error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getActivityLog(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getActivityLog(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getActivityLog error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async handover(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { toKknUserId, rwId, notes } = req.body;
      const data = await kknService.handover(kknUserId, toKknUserId, Number(rwId), notes);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] handover error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async inputFacility(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      let fotoUrl = req.body.foto;
      if (req.file) {
        fotoUrl = `/uploads/${req.file.filename}`;
      }

      const payload = {
        ...req.body,
        foto: fotoUrl,
        latitude: req.body.latitude != null ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude != null ? Number(req.body.longitude) : undefined,
        rwId: req.body.rwId,
        kapasitas: req.body.kapasitas != null ? Number(req.body.kapasitas) : undefined,
      };

      const data = await kknService.bantuInputFasilitas(kknUserId, payload);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] inputFacility error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getJenisFasilitas(req: Request, res: Response) {
    try {
      const data = await facilityService.getJenisFasilitas();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getJenisFasilitas error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async claimQr(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { qrCode, latitude, longitude } = req.body;
      if (!qrCode) {
        return res.status(400).json({ success: false, message: "qrCode wajib diisi" });
      }
      const data = await kknService.claimQr(
        kknUserId,
        qrCode,
        latitude != null ? Number(latitude) : undefined,
        longitude != null ? Number(longitude) : undefined
      );
      res.status(200).json({ success: true, message: "QR berhasil diklaim", data });
    } catch (error: any) {
      console.error("[KknController] claimQr error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.registerWarga(kknUserId, req.body);
      res.status(201).json({ success: true, message: "Registrasi Warga Berhasil", data });
    } catch (error: any) {
      console.error("[KknController] registerWarga error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyGroup(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getMyGroup(kknUserId);
      if (!data) {
        res.status(404).json({
          success: false,
          message: "Anda belum dimasukkan ke kelompok KKN oleh Admin DLH.",
        });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getMyGroup error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPemanfaatanSampah(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;

      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoDokumentasiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoDokumentasiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else {
        const bodyFoto =
          req.body.fotoDokumentasiUrl ||
          req.body.fotoBukti ||
          req.body.fotoUrl ||
          req.body.evidencePhotoUrl;
        if (bodyFoto && typeof bodyFoto === "string" && bodyFoto.trim() !== "" && bodyFoto !== "null") {
          fotoDokumentasiUrl = bodyFoto.trim();
        }
      }

      const data = await kknService.createPemanfaatanSampah(kknUserId, {
        ...req.body,
        fotoDokumentasiUrl,
      });

      res.status(201).json({
        success: true,
        message: "Laporan pemanfaatan sampah berhasil disimpan dan tercatat di Web Monitoring.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] createPemanfaatanSampah error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async notifyWargaStatus(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId, statusBimbingan } = req.body;
      if (!wargaId || !statusBimbingan) {
        res.status(400).json({
          success: false,
          message: "wargaId dan statusBimbingan wajib diisi",
        });
        return;
      }
      await kknService.notifyWargaStatus(kknUserId, wargaId, statusBimbingan);
      res.status(200).json({
        success: true,
        message: "Notifikasi terkirim",
      });
    } catch (error: any) {
      console.error("[KknController] notifyWargaStatus error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getActiveZone(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const lat = req.query.latitude
        ? parseFloat(req.query.latitude as string)
        : req.query.lat
        ? parseFloat(req.query.lat as string)
        : undefined;
      const lng = req.query.longitude
        ? parseFloat(req.query.longitude as string)
        : req.query.lng
        ? parseFloat(req.query.lng as string)
        : undefined;

      const data = await kknService.getActiveZone(kknUserId, lat, lng);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getActiveZone error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDampakRw(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getDampakStatistik(kknUserId, "rw");
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getDampakRw error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDampakKelurahan(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getDampakStatistik(kknUserId, "kelurahan");
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getDampakKelurahan error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async registerPosko(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      let fotoUrl = req.body.foto;
      if (req.file) {
        fotoUrl = `/uploads/${req.file.filename}`;
      }
      const payload = {
        ...req.body,
        foto: fotoUrl,
        latitude: req.body.latitude != null ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude != null ? Number(req.body.longitude) : undefined,
        rwId: req.body.rwId != null ? Number(req.body.rwId) : undefined,
      };

      const data = await kknService.registerPoskoKkn(kknUserId, payload);
      res.status(201).json({
        success: true,
        message: "Pendaftaran Posko KKN berhasil dikirim dan menunggu verifikasi RW.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] registerPosko error:", error);
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async updateMyPosko(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      let fotoUrl = req.body.foto;
      if (req.file) {
        fotoUrl = `/uploads/${req.file.filename}`;
      }
      const payload = {
        ...req.body,
        foto: fotoUrl,
        latitude: req.body.latitude != null ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude != null ? Number(req.body.longitude) : undefined,
        rwId: req.body.rwId != null ? Number(req.body.rwId) : undefined,
      };

      const data = await kknService.updatePoskoKkn(kknUserId, payload);
      res.status(200).json({
        success: true,
        message: "Data Posko KKN berhasil diperbarui.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] updatePosko error:", error);
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getMyPosko(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getMyPosko(kknUserId);
      if (!data) {
        res.status(200).json({
          success: true,
          message: "Data posko belum terdaftar",
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: data.posko ? "Data posko berhasil diambil" : "Data posko belum terdaftar",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] getMyPosko error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllPosko(req: Request, res: Response): Promise<void> {
    try {
      const kelurahan = req.query.kelurahan as string | undefined;
      const search = req.query.search as string | undefined;
      const userId = (req as any).user?.userId;
      const role = (req as any).user?.role || (req as any).user?.peran;
      const data = await kknService.getAllPoskoKkn({ kelurahan, search, userId, role });
      res.status(200).json({
        success: true,
        message: "Data posko KKN berhasil dimuat",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] getAllPosko error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPosko(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      let fotoUrl = req.body.foto;
      if (req.file) {
        fotoUrl = `/uploads/${req.file.filename}`;
      }
      const payload = {
        nama: req.body.nama,
        alamat: req.body.alamat,
        kelompokId: req.body.kelompokId || undefined,
        rwId: req.body.rwId != null && req.body.rwId !== "" ? Number(req.body.rwId) : undefined,
        latitude: req.body.latitude != null ? Number(req.body.latitude) : 0,
        longitude: req.body.longitude != null ? Number(req.body.longitude) : 0,
        foto: fotoUrl,
        pic: req.body.pic,
        kontak: req.body.kontak,
        statusApproval: req.body.statusApproval || "APPROVED",
      };

      const data = await kknService.createPoskoAdmin(userId, payload);
      res.status(201).json({
        success: true,
        message: "Posko KKN berhasil ditambahkan.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] createPosko error:", error);
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async updatePosko(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      let fotoUrl = req.body.foto;
      if (req.file) {
        fotoUrl = `/uploads/${req.file.filename}`;
      }
      const payload: any = {
        ...req.body,
      };
      if (fotoUrl !== undefined) {
        payload.foto = fotoUrl;
      }
      if (req.body.latitude != null && req.body.latitude !== "") {
        payload.latitude = Number(req.body.latitude);
      }
      if (req.body.longitude != null && req.body.longitude !== "") {
        payload.longitude = Number(req.body.longitude);
      }
      if (req.body.rwId != null && req.body.rwId !== "") {
        payload.rwId = Number(req.body.rwId);
      }

      const data = await kknService.updatePoskoAdmin(id, userId, payload);
      res.status(200).json({
        success: true,
        message: "Posko KKN berhasil diperbarui.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] updatePosko error:", error);
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async deletePosko(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const data = await kknService.deletePoskoAdmin(id, userId);
      res.status(200).json({
        success: true,
        message: "Posko KKN berhasil dihapus.",
        data,
      });
    } catch (error: any) {
      console.error("[KknController] deletePosko error:", error);
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3 Pilar KKN (Perencanaan, Aksi, Panen)
  // ──────────────────────────────────────────────────────────

  async createProgramKerja(req: Request, res: Response) {
    try {
      const payload = { ...req.body };
      if (req.file) {
        const fileUrl = `/uploads/${req.file.filename}`;
        payload.attachmentFile = fileUrl;
        payload.linkGoogleDrive = payload.linkGoogleDrive || fileUrl;
        payload.attachmentUrls = [fileUrl];
      }
      const data = await kknService.createProgramKerja(req.user!.userId, payload);
      
      try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { notificationIntegrationService } = require("../services/notificationIntegrationService");
        
        const title = "Pengajuan Program Kerja âœ…";
        const message = `Program ${data.judul} berhasil diajukan dan sedang direview.`;
        
        await prisma.notification.create({
          data: {
            userId: req.user!.userId,
            title,
            message,
            isRead: false,
          }
        });
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (user?.fcmToken) {
          await notificationIntegrationService.sendPushNotification(user.fcmToken, title, message);
        }
      } catch (e) {
        console.error("Failed to send notification for program kerja", e);
      }

      res.status(201).json({ success: true, message: "Program Kerja berhasil diajukan.", data });
    } catch (error: any) {
      console.error("[KknController] createProgramKerja error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getProgramKerja(req: Request, res: Response) {
    try {
      const targetGroupId = (req.query.groupId || req.query.kelompokId) as string | undefined;
      const data = await kknService.getProgramKerja(req.user!.userId, targetGroupId);
      res.status(200).json({ success: true, total: Array.isArray(data) ? data.length : 0, data });
    } catch (error: any) {
      console.error("[KknController] getProgramKerja error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateProgramKerja(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };
      if (req.file) {
        const fileUrl = `/uploads/${req.file.filename}`;
        payload.attachmentFile = fileUrl;
        payload.linkGoogleDrive = payload.linkGoogleDrive || fileUrl;
        payload.attachmentUrls = [fileUrl];
      }
      const data = await kknService.updateProgramKerja(req.user!.userId, id, payload);
      res.status(200).json({ success: true, message: "Program Kerja berhasil diperbarui.", data });
    } catch (error: any) {
      console.error("[KknController] updateProgramKerja error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLogbookPemanfaatan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoDokumentasiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoDokumentasiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else {
        const bodyFoto =
          req.body.fotoDokumentasiUrl ||
          req.body.fotoBuktiUrl ||
          req.body.fotoUrl;
        if (bodyFoto && typeof bodyFoto === "string" && bodyFoto.trim() !== "" && bodyFoto !== "null") {
          fotoDokumentasiUrl = bodyFoto.trim();
        }
      }

      const payload = { ...req.body, ...(fotoDokumentasiUrl ? { fotoDokumentasiUrl } : {}) };
      const data = await kknService.updateLogbookPemanfaatan(req.user!.userId, id, payload);
      res.status(200).json({ success: true, message: "Logbook pemanfaatan berhasil diperbarui.", data });
    } catch (error: any) {
      console.error("[KknController] updateLogbookPemanfaatan error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createLogbookPemanfaatan(req: Request, res: Response) {
    try {
      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoDokumentasiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoDokumentasiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else {
        const bodyFoto =
          req.body.fotoDokumentasiUrl ||
          req.body.fotoBuktiUrl ||
          req.body.fotoUrl;
        if (bodyFoto && typeof bodyFoto === "string" && bodyFoto.trim() !== "" && bodyFoto !== "null") {
          fotoDokumentasiUrl = bodyFoto.trim();
        }
      }

      const payload = { ...req.body, fotoDokumentasiUrl };
      const data = await kknService.createLogbookPemanfaatan(req.user!.userId, payload);
      res.status(201).json({ success: true, message: "Aksi Pemanfaatan berhasil dicatat.", data });
    } catch (error: any) {
      console.error("[KknController] createLogbookPemanfaatan error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getUnharvestedLogbooks(req: Request, res: Response) {
    try {
      const data = await kknService.getUnharvestedLogbooks(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getUnharvestedLogbooks error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createPanenHasil(req: Request, res: Response) {
    try {
      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoDokumentasiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoDokumentasiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else {
        const bodyFoto =
          req.body.fotoDokumentasiUrl ||
          req.body.fotoBuktiUrl ||
          req.body.fotoUrl;
        if (bodyFoto && typeof bodyFoto === "string" && bodyFoto.trim() !== "" && bodyFoto !== "null") {
          fotoDokumentasiUrl = bodyFoto.trim();
        }
      }

      const payload = { ...req.body, fotoDokumentasiUrl };
      const data = await kknService.createPanenHasil(req.user!.userId, payload);
      res.status(201).json({ success: true, message: "Hasil Panen berhasil dicatat.", data });
    } catch (error: any) {
      console.error("[KknController] createPanenHasil error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async claimWargaMandiri(req: Request, res: Response): Promise<void> {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId } = req.params;

      const result = await kknService.claimWargaMandiri(kknUserId, wargaId);
      res.status(200).json({
        success: true,
        message: "Berhasil mengklaim warga menjadi dampingan.",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknController] claimWargaMandiri error:", error);
      if (error.message === "WARGA_NOT_FOUND") {
        res.status(404).json({ success: false, error: "WARGA_NOT_FOUND", message: "Warga tidak ditemukan." });
        return;
      }
      if (error.message === "NO_ACTIVE_BINS") {
        res.status(400).json({ success: false, error: "NO_ACTIVE_BINS", message: "Warga ini belum memiliki tempat sampah aktif untuk diklaim." });
        return;
      }
      if (error.message === "ALREADY_CLAIMED") {
        res.status(400).json({ success: false, error: "ALREADY_CLAIMED", message: "Warga ini sudah menjadi dampingan mahasiswa lain." });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTimelineMahasiswa(req: Request, res: Response): Promise<void> {
    try {
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;
      const { kelompokId, kelurahan, bidangKegiatan, fase, statusPelaksanaan, search, startDate, endDate } = req.query;

      const result = await timelineKknService.getTimelineMahasiswa(
        {
          kelompokId: kelompokId ? String(kelompokId) : undefined,
          kelurahan: kelurahan ? String(kelurahan) : undefined,
          bidangKegiatan: bidangKegiatan ? String(bidangKegiatan) : undefined,
          fase: fase ? String(fase) : undefined,
          statusPelaksanaan: statusPelaksanaan ? String(statusPelaksanaan) : undefined,
          search: search ? String(search) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
        },
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        message: "Berhasil memuat linimasa program KKN beserta rekomendasi dan pertanyaan kritis",
        summary: result.summary,
        fases: result.fases,
        data: result.data,
      });
    } catch (error: any) {
      console.error("[KknController] getTimelineMahasiswa error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  }

  async getActiveTimelineMahasiswa(req: Request, res: Response): Promise<void> {
    try {
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;
      const { kelompokId, kelurahan, bidangKegiatan, fase, search } = req.query;

      const result = await timelineKknService.getActiveTimelineMahasiswa(
        {
          kelompokId: kelompokId ? String(kelompokId) : undefined,
          kelurahan: kelurahan ? String(kelurahan) : undefined,
          bidangKegiatan: bidangKegiatan ? String(bidangKegiatan) : undefined,
          fase: fase ? String(fase) : undefined,
          search: search ? String(search) : undefined,
        },
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        message: "Berhasil memuat tahapan linimasa KKN yang sedang berlangsung",
        summary: result.summary,
        activeFaseSummary: result.activeFaseSummary,
        data: result.data,
      });
    } catch (error: any) {
      console.error("[KknController] getActiveTimelineMahasiswa error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  }

  // Alias yang kompatibel dengan naming dari mobile dev
  async getActiveTimeline(req: Request, res: Response): Promise<void> {
    return this.getActiveTimelineMahasiswa(req, res);
  }

  /**
   * GET /api/v1/kkn/wilayah-kelompok
   * Mengambil data batas geografis (Polygon/Radius) serta titik pusat posko dari kelompok KKN mahasiswa yang sedang login.
   */
  async getWilayahKelompok(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Pengguna tidak terautentikasi" });
        return;
      }

      const result = await kknService.getWilayahKelompok(userId);
      res.status(200).json({
        success: true,
        message: "Berhasil memuat wilayah kelompok",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknController] getWilayahKelompok error:", error);
      if (error.message === "STUDENT_NOT_FOUND" || error.message === "KELOMPOK_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Data kelompok KKN mahasiswa tidak ditemukan",
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memuat wilayah kelompok",
      });
    }
  }
}

export const kknController = new KknController();
