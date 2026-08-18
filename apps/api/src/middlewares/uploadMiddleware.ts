/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

// Storage Configuration with auto-mkdir
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File Filter (JPEG, PNG, WEBP only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/octet-stream"];
  const mimetypeLower = (file.mimetype || "").toLowerCase();
  const extLower = path.extname(file.originalname || "").toLowerCase();
  
  if (
    allowedMimeTypes.includes(mimetypeLower) ||
    [".jpg", ".jpeg", ".png", ".webp"].includes(extLower) ||
    !file.mimetype
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak valid. Hanya JPG, PNG, dan WEBP yang diperbolehkan.") as any,
      false
    );
  }
};

export const uploadAvatarMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export const safeUploadSingleImage = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadSingleImage.single(fieldName)(req, res, (err: any) => {
      if (err) {
        console.error(`[UploadMiddleware] Upload error on field '${fieldName}':`, err.message);
        return res.status(400).json({
          success: false,
          message: err.message || "Gagal mengunggah berkas foto bukti.",
        });
      }
      next();
    });
  };
};

export const uploadResiduImage = uploadSingleImage.fields([
  { name: "image", maxCount: 1 },
  { name: "evidence", maxCount: 1 },
  { name: "evidencePhotoUrl", maxCount: 1 },
]);
