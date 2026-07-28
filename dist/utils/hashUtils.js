/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import bcrypt from "bcryptjs";
const SALT_ROUNDS = 10;
/**
 * Hash a plain text password.
 */
export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};
/**
 * Compare a plain text password with a hashed password.
 */
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
