/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Define token payload structure
export interface TokenPayload {
  userId: string;
  role: string;
  rwId?: number;
  rtId?: number;
}

/**
 * Ambil JWT Access Secret dari environment variable.
 * Akan throw error startup jika secret tidak dikonfigurasi — lebih aman daripada diam-diam memakai default.
 */
export const getJwtAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "[BERSEKA SECURITY] JWT_ACCESS_SECRET atau JWT_SECRET wajib diset di environment variables. " +
      "Jangan pernah menggunakan fallback secret di production/staging."
    );
  }
  return secret;
};

// Expiration times
export const getAccessTokenExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || "5d"; // 5 days for access token
};
const REFRESH_TOKEN_EXPIRES_DAYS = 5; // 5 days for refresh token

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtAccessSecret(), { expiresIn: getAccessTokenExpiresIn() } as any);
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (_userId: string): { token: string; expiresAt: Date } => {
  // Opaque UUID token — disimpan di DB untuk rotasi yang aman.
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  return { token, expiresAt };
};

/**
 * Verify Access Token.
 * Hanya menggunakan secret dari environment variable — tidak ada fallback hardcoded.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = getJwtAccessSecret();
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (err: any) {
    throw err;
  }
};
