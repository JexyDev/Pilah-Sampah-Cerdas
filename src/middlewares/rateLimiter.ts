/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";

// Memory storage for tracking attempts
interface AttemptRecord {
  count: number;
  resetTime: number;
}

const attempts = new Map<string, AttemptRecord>();

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown").toString();
  const identifier = (req.body?.phone || req.body?.email || "unknown").toString().toLowerCase().trim();
  const key = `${ip}:${identifier}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxAttempts = 5;

  const record = attempts.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired record
    attempts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (record.count >= maxAttempts) {
    res.status(429).json({
      success: false,
      code: "TOO_MANY_ATTEMPTS",
      error: "TOO_MANY_ATTEMPTS",
      message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.",
    });
    return;
  }

  record.count += 1;
  next();
};
