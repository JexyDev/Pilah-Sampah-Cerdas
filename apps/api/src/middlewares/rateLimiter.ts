/**
 * Project: BERSEKA
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

// Periodically clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
      if (now > record.resetTime) {
        attempts.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Clear login attempts for a specific IP and identifier (e.g., after successful login)
 */
export const clearLoginAttempts = (ip: string, identifier: string): void => {
  const cleanId = (identifier || "unknown").toString().toLowerCase().trim();
  const key = `${ip}:${cleanId}`;
  attempts.delete(key);
};

/**
 * Reset all login attempts in memory
 */
export const resetAllLoginRateLimits = (): void => {
  attempts.clear();
};

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown").toString();

  // In development / local environment, completely bypass login rate limiting
  if (
    process.env.NODE_ENV !== "production" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "localhost"
  ) {
    return next();
  }

  const identifier = (req.body?.phone || req.body?.email || "unknown")
    .toString()
    .toLowerCase()
    .trim();
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
    const remainingSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    res.status(429).json({
      success: false,
      code: "TOO_MANY_ATTEMPTS",
      error: "TOO_MANY_ATTEMPTS",
      message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${remainingSeconds} detik.`,
    });
    return;
  }

  record.count += 1;
  next();
};
