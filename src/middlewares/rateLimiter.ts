/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
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
  const email = (req.body?.email || "unknown").toString().toLowerCase().trim();

  // Rate limit key combines IP and email to prevent distributed attacks on single accounts
  // and brute force from single IPs
  const key = `${ip}:${email}`;
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
