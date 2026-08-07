/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { pengangkutanController } from "../controllers/pengangkutanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
  ]),
  pengangkutanController.getAll
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
  ]),
  pengangkutanController.getById
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT", "PETUGAS_RESIDU"]),
  pengangkutanController.create
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT", "PETUGAS_RESIDU"]),
  pengangkutanController.update
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  pengangkutanController.delete
);

export default router;
