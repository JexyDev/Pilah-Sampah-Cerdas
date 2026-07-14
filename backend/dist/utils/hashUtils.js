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
