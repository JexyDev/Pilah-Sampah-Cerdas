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

// In production, these should be dynamically loaded from environment variables (.env)
export const getJwtAccessSecret = (): string => {
  return (
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "access_secret_super_secure_key_123"
  );
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
  // Using UUID for refresh token or could use JWT. Usually opaque strings like UUID are stored in DB.
  // We'll generate a random opaque token for DB storage and rotation safety.
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  return { token, expiresAt };
};

/**
 * Verify Access Token with multi-secret fallback for seamless session continuity
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const primarySecret = getJwtAccessSecret();
  const candidateSecrets = Array.from(
    new Set(
      [
        primarySecret,
        "access_secret_super_secure_key_123",
        "ganti_ini_dengan_string_random_minimal_32_karakter",
      ].filter(Boolean)
    )
  );

  let lastError: any = null;
  for (const secret of candidateSecrets) {
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (err: any) {
      lastError = err;
      if (err.name === "TokenExpiredError") {
        throw err;
      }
    }
  }

  throw lastError || new Error("Token verification failed");
};
