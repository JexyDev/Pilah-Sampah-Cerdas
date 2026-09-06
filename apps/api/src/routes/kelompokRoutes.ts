import { Router } from "express";
import { kelompokController } from "../controllers/kelompokController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Semua route butuh auth
router.use(authMiddleware);

// ── READ (semua role authenticated boleh baca) ──────────────────────────────
router.get("/dpls", kelompokController.getDpls);
router.get("/", kelompokController.getAll);
router.get("/:id", kelompokController.getById);

// ── WRITE: SUPER_USER, DEVELOPER, PEMIMPIN, PANITIA_TASKFORCE ──────────────────────────
const KKN_WRITE_ROLES = ["SUPER_USER", "DEVELOPER", "PEMIMPIN", "PANITIA_TASKFORCE"];

router.post("/", roleMiddleware(KKN_WRITE_ROLES), kelompokController.create);
router.put("/:id", roleMiddleware(KKN_WRITE_ROLES), kelompokController.update);
router.delete("/:id", roleMiddleware(KKN_WRITE_ROLES), kelompokController.delete);

// ── SET KETUA: termasuk DPL (bisa tunjuk ketua di kelompoknya) ──────────────
router.put(
  "/:id/leader",
  roleMiddleware([...KKN_WRITE_ROLES, "DPL"]),
  kelompokController.setLeader
);

// ── ASSIGN DPL ke kelompok (PUT /:id/assign-dpl) ────────────────────────────
// Body: { dplId: string | null }
router.put("/:id/assign-dpl", roleMiddleware(KKN_WRITE_ROLES), kelompokController.assignDpl);

// ── ASSIGN RW ke kelompok (PUT /:id/assign-rw) ──────────────────────────────
// Body: { rwIds: number[] }
router.put("/:id/assign-rw", roleMiddleware(KKN_WRITE_ROLES), kelompokController.assignRw);

// ── PINDAH MAHASISWA antar kelompok (PATCH /:id/mahasiswa/:studentKknId/pindah) ─
// Body: { targetKelompokId: string }
router.patch(
  "/:id/mahasiswa/:studentKknId/pindah",
  roleMiddleware(KKN_WRITE_ROLES),
  kelompokController.pindahMahasiswa
);

export default router;
