import { Router } from "express";
import { rwService } from "../services/rwService.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Semua route di sini dilindungi authMiddleware dan khusus untuk role RW
router.use(authMiddleware);

// Middleware khusus RW
router.use((req, res, next) => {
  if (req.user?.role !== "RW") {
    return res
      .status(403)
      .json({ error: "FORBIDDEN", message: "Hanya RW yang dapat mengakses portal ini." });
  }
  if (!req.user?.rtRwId) {
    return res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "Akun RW tidak memiliki wilayah yang valid." });
  }
  next();
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const data = await rwService.getDashboard(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});
// BINS
router.get("/bins/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingBins(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/bins/:id/approve", async (req, res, next) => {
  try {
    const data = await rwService.approveBin(req.params.id, req.user!.rtRwId!);
    res.json({ message: "Bin berhasil diaktifkan", data });
  } catch (error) {
    next(error);
  }
});

router.put("/bins/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "Reason is required" });
    const data = await rwService.rejectBin(req.params.id, reason, req.user!.rtRwId!);
    res.json({ message: "Pengajuan bin ditolak", data });
  } catch (error) {
    next(error);
  }
});

router.get("/bins/inactive", async (req, res, next) => {
  try {
    const data = await rwService.getInactiveBins(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/bins/:id/broken", async (req, res, next) => {
  try {
    const data = await rwService.markBinBroken(req.params.id, req.user!.userId, req.user!.rtRwId!);
    res.json({ message: "Bin ditandai rusak", data });
  } catch (error) {
    next(error);
  }
});

// PETUGAS RESIDU
router.get("/petugas/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingPetugas(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/petugas/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body; // "APPROVED" or "REJECTED"
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }
    const data = await rwService.verifyPetugas(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.rtRwId!
    );
    res.json({ message: "Verifikasi petugas berhasil", data });
  } catch (error) {
    next(error);
  }
});

// IDE DAUR ULANG
router.get("/ide", async (req, res, next) => {
  try {
    const data = await rwService.getPendingIde(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/ide/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body; // "APPROVED" or "REJECTED"
    const data = await rwService.verifyIde(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.userId,
      req.user!.rtRwId!
    );
    res.json({ message: "Ide diverifikasi", data });
  } catch (error) {
    next(error);
  }
});

// FASILITAS
router.get("/facilities/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingFacilities(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/facilities/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body;
    const data = await rwService.verifyFacility(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.rtRwId!
    );
    res.json({ message: "Fasilitas diverifikasi", data });
  } catch (error) {
    next(error);
  }
});

router.get("/facilities", async (req, res, next) => {
  try {
    const data = await rwService.getFacilities(req.user!.rtRwId!);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/facilities/:id/production", async (req, res, next) => {
  try {
    const { materialMasukKg, outputKg, jenisOutput, periode } = req.body;
    const data = await rwService.inputFacilityProduction(
      req.params.id,
      Number(materialMasukKg),
      Number(outputKg),
      jenisOutput,
      periode,
      req.user!.rtRwId!
    );
    res.json({ message: "Data produksi berhasil disimpan", data });
  } catch (error) {
    next(error);
  }
});

export default router;
