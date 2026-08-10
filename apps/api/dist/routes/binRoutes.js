/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { Router } from "express";
import { binController } from "../controllers/binController.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Bins
 *   description: Bin interactions and transactions
 */
/**
 * @swagger
 * /api/v1/bins:
 *   get:
 *     summary: Get all bins
 *     tags: [Bins]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", binController.getAllBins);
router.get("/next-qr", authMiddleware, binController.getNextQr);
/**
 * @swagger
 * /api/v1/bins:
 *   post:
 *     summary: Create a bin
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authMiddleware, (req, res, next) => {
    const role = req.user?.role;
    if (role === "WARGA" || role === "MAHASISWA_KKN") {
        return binController.registerWargaBin(req, res);
    }
    return roleMiddleware(["SUPER_USER", "ADMIN_DLH"])(req, res, next);
}, binController.createBin);
/**
 * @swagger
 * /api/v1/bins/{id}:
 *   put:
 *     summary: Update a bin
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.updateBin);
/**
 * @swagger
 * /api/v1/bins/{id}:
 *   delete:
 *     summary: Delete a bin
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.deleteBin);
router.put("/:qrCode/broken", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW"]), binController.markBinAsBroken);
/**
 * @swagger
 * /api/v1/bins/locations:
 *   get:
 *     summary: Get location summary grouped by RW (for ManajemenLokasi page)
 *     tags: [Bins]
 *     responses:
 *       200:
 *         description: List of RW locations with RT count and bin count
 */
router.get("/locations", binController.getLocations);
/**
 * @swagger
 * /api/v1/bins/my-bins:
 *   get:
 *     summary: Menampilkan daftar tempat sampah milik Warga yang sedang aktif
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar tempat sampah aktif milik Warga
 */
router.get("/my-bins", authMiddleware, binController.getMyBins);
/**
 * @swagger
 * /api/v1/bins/my:
 *   get:
 *     summary: Menampilkan tempat sampah milik Warga (Alias Mobile Spec)
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar tempat sampah
 */
router.get("/my", authMiddleware, binController.getMyBins);
/**
 * @swagger
 * /api/v1/bins/kelurahans:
 *   get:
 *     summary: Mendapatkan daftar seluruh Kelurahan (Coblong)
 *     tags: [Kelurahan & Wilayah]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registered Kelurahans
 */
router.get("/kelurahans", authMiddleware, binController.getKelurahans);
/**
 * @swagger
 * /api/v1/bins/areas:
 *   get:
 *     summary: Mendapatkan daftar seluruh wilayah RT/RW
 *     tags: [Kelurahan & Wilayah]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registered RT/RW areas
 */
router.get("/areas", authMiddleware, binController.getAreas);
/**
 * @swagger
 * /api/v1/bins/kelurahans:
 *   post:
 *     summary: Tambah Kelurahan Baru (Admin DLH / SUPER USER)
 *     tags: [Kelurahan & Wilayah]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dago
 *     responses:
 *       201:
 *         description: Kelurahan created successfully
 */
router.post("/kelurahans", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.createKelurahan);
/**
 * @swagger
 * /api/v1/bins/kelurahans/{id}:
 *   delete:
 *     summary: Hapus Kelurahan (Admin DLH / SUPER USER)
 *     tags: [Kelurahan & Wilayah]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kelurahan deleted successfully
 */
router.delete("/kelurahans/:id", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.deleteKelurahan);
/**
 * @swagger
 * /api/v1/bins/measure:
 *   post:
 *     summary: Mengukur / kalkulasi estimasi volume tempat sampah (Mobile Spec)
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *               width:
 *                 type: number
 *     responses:
 *       200:
 *         description: Estimasi volume berhasil dihitung
 */
router.post("/measure", authMiddleware, binController.measure);
router.post("/areas", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.createArea);
router.put("/areas/:id", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.updateArea);
router.delete("/areas/:id", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.deleteArea);
/**
 * @swagger
 * /api/v1/bins/scan:
 *   post:
 *     summary: Scan a QR code on a Bin to deposit waste
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *               - detectedType
 *               - estimatedVolume
 *               - householdId
 *             properties:
 *               qrCode:
 *                 type: string
 *               detectedType:
 *                 type: string
 *                 example: ORGANIC
 *               estimatedVolume:
 *                 type: number
 *                 example: 3.5
 *               householdId:
 *                 type: string
 *                 format: uuid
 *               userLat:
 *                 type: number
 *                 format: float
 *               userLng:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Transaction processed
 *       400:
 *         description: Validation error, overflow, or location out of range
 *       404:
 *         description: Bin not found
 */
router.post("/scan", authMiddleware, roleMiddleware(["WARGA"]), binController.scan);
/**
 * @swagger
 * /api/v1/bins/{id}/status:
 *   get:
 *     summary: Get status of a bin
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/status", binController.getStatus);
/**
 * @swagger
 * /api/v1/bins/{id}/empty:
 *   post:
 *     summary: Empty bin capacity
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/empty", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "PETUGAS_RESIDU"]), binController.emptyBin);
router.get("/reset-request/status", authMiddleware, binController.getResetRequestStatus);
router.get("/reset/my-requests", authMiddleware, binController.getResetRequestStatus);
router.post("/reset-request", authMiddleware, roleMiddleware(["WARGA"]), binController.createResetRequest);
router.get("/reset-request/:id", authMiddleware, binController.getResetRequest);
router.put("/reset-request/:id/review", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "PETUGAS_RESIDU"]), binController.reviewResetRequest);
router.post("/qr-batch", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.createQrBatch);
router.get("/qr-batch", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]), binController.getAllQrBatches);
router.put("/qr-batch/:id/assign", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), binController.assignQrBatch);
router.post("/dispatch/:id/claim", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "PETUGAS_RESIDU"]), binController.claimDispatch);
router.get("/dispatch/optimized-route", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "PETUGAS_RESIDU"]), binController.getOptimizedRoute);
router.put("/:id/approve-activation", authMiddleware, roleMiddleware(["SUPER_USER", "RW"]), binController.approveActivation);
/**
 * @swagger
 * /api/v1/bins/activate:
 *   post:
 *     summary: Aktivasi tempat sampah warga (Mobile Spec)
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrCode]
 *             properties:
 *               qrCode:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tempat sampah berhasil diajukan untuk aktivasi
 */
router.post("/activate", authMiddleware, roleMiddleware(["WARGA", "MAHASISWA_KKN"]), binController.registerWargaBin);
router.put("/:id/reject-activation", authMiddleware, roleMiddleware(["SUPER_USER", "RW"]), binController.rejectActivation);
router.post("/:id/report-issue", authMiddleware, roleMiddleware(["WARGA"]), binController.reportIssue);
router.post("/:id/report-damage", authMiddleware, roleMiddleware(["WARGA", "RT", "RW", "PETUGAS_RESIDU"]), binController.reportIssue);
router.put("/:id/capacity", authMiddleware, roleMiddleware(["WARGA", "SUPER_USER", "RW"]), binController.updateCapacity);
router.post("/register-warga", authMiddleware, roleMiddleware(["WARGA"]), binController.registerWargaBin);
/**
 * @swagger
 * /api/v1/bins/reset:
 *   post:
 *     summary: Pengajuan reset tempat sampah (Mobile Spec)
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [binId]
 *             properties:
 *               binId:
 *                 type: string
 *               evidence:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Pengajuan reset berhasil dikirim
 */
router.post("/reset", authMiddleware, roleMiddleware(["WARGA"]), uploadAvatarMiddleware.single("evidence"), binController.createResetRequestMobile);
router.get("/reset-requests", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "PETUGAS_RESIDU"]), binController.listResetRequests);
router.put("/reset/:id/approve", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "PETUGAS_RESIDU"]), binController.approveResetRequest);
export default router;
