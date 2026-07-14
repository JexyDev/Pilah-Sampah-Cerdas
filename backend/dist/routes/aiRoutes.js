import { Router } from "express";
import { aiController } from "../controllers/aiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Waste Detection
 */
/**
 * @swagger
 * /api/v1/waste/detect-mock:
 *   post:
 *     summary: Simulasi Deteksi Gambar Sampah AI
 *     description: Mengirim gambar sampah untuk dideteksi kategorinya secara otomatis menggunakan antrian Redis FIFO dengan limitasi kuota harian.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL gambar sampah yang diunggah
 *                 example: "http://mock-storage/waste.jpg"
 *     responses:
 *       200:
 *         description: Deteksi berhasil
 *       400:
 *         description: Bad Request (Missing parameter)
 *       422:
 *         description: Gambar buram atau jenis sampah tidak teridentifikasi
 *       429:
 *         description: Quota Exceeded (Batas harian terlampaui)
 *       408:
 *         description: AI Timeout (Proses deteksi melebihi 2 detik)
 */
router.post("/detect-mock", authMiddleware, roleMiddleware(["WARGA", "ADMIN", "PETUGAS_KELURAHAN"]), aiController.detect);
export default router;
