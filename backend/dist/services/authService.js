import { authRepository } from "../repositories/authRepository.js";
import { comparePassword } from "../utils/hashUtils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtils.js";
export class AuthService {
    /**
     * Authenticate user with email and password, returning tokens if successful.
     */
    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        // Prepare payload
        const payload = {
            userId: user.id,
            role: user.role.name,
        };
        // Generate tokens
        const accessToken = generateAccessToken(payload);
        const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);
        // Save refresh token to DB
        await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            }
        };
    }
    /**
     * Validate refresh token and issue a new access token.
     */
    async refresh(token) {
        const tokenRecord = await authRepository.findRefreshToken(token);
        if (!tokenRecord) {
            throw new Error("INVALID_TOKEN");
        }
        if (new Date() > tokenRecord.expiresAt) {
            // Token expired, clean it up
            await authRepository.deleteRefreshToken(token);
            throw new Error("TOKEN_EXPIRED");
        }
        // Generate new access token
        const payload = {
            userId: tokenRecord.user.id,
            role: tokenRecord.user.role.name,
        };
        const newAccessToken = generateAccessToken(payload);
        return {
            accessToken: newAccessToken,
        };
    }
    /**
     * Invalidate a refresh token (Logout).
     */
    async logout(token) {
        await authRepository.deleteRefreshToken(token);
    }
}
export const authService = new AuthService();
