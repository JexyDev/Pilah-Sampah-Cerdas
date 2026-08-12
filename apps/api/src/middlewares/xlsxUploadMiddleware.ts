/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import multer from "multer";
import { Request } from "express";

const XLSX_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_XLSX_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

/**
 * Multer middleware khusus untuk upload file .xlsx
 * Menggunakan memory storage (file kecil, tidak perlu disk).
 */
const xlsxStorage = multer.memoryStorage();

const xlsxFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_XLSX_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak valid. Hanya file .xlsx yang diperbolehkan.") as any,
      false
    );
  }
};

export const uploadXlsx = multer({
  storage: xlsxStorage,
  fileFilter: xlsxFileFilter,
  limits: {
    fileSize: XLSX_MAX_FILE_SIZE,
  },
});
