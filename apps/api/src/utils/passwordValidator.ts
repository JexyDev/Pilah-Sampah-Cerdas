/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Centralized Password Validation Engine (ISO 27001 / NIST SP 800-63B).
 * Single Source of Truth for password strength and character requirements.
 */

import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Validasi kekuatan kata sandi:
 * 1. Minimal 8 karakter
 * 2. Mengandung minimal 1 huruf (a-z atau A-Z)
 * 3. Mengandung minimal 1 angka (0-9)
 */
export function isPasswordValid(password: string): { ok: boolean; reason?: string } {
  if (!password || typeof password !== "string") {
    return { ok: false, reason: "Kata sandi wajib diisi" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter` };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, reason: "Kata sandi harus mengandung minimal 1 huruf (a-z atau A-Z)" };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, reason: "Kata sandi harus mengandung minimal 1 angka (0-9)" };
  }
  return { ok: true };
}

/**
 * Zod Schema terstandarisasi untuk validasi kata sandi baru / update.
 */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .refine((val) => /[A-Za-z]/.test(val), {
    message: "Kata sandi harus mengandung minimal 1 huruf (a-z atau A-Z)",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Kata sandi harus mengandung minimal 1 angka (0-9)",
  });
