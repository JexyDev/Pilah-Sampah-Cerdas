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

// In production, these should be loaded from environment variables (.env)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "access_secret_super_secure_key_123";

// Expiration times
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"; // 24 hours for access token
const REFRESH_TOKEN_EXPIRES_DAYS = 7; // 7 days for refresh token

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as any);
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
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
};
