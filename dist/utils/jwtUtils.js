/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
// In production, these should be loaded from environment variables (.env)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_super_secure_key_123";
// Expiration times
const ACCESS_TOKEN_EXPIRES_IN = "1h"; // 1 hour for access token
const REFRESH_TOKEN_EXPIRES_DAYS = 7; // 7 days for refresh token
/**
 * Generate Access Token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};
/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (_userId) => {
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
export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_ACCESS_SECRET);
};
