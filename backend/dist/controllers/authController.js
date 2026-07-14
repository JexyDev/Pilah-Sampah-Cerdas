import { z } from "zod";
import { authService } from "../services/authService.js";
// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
});
const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token diperlukan"),
});
export class AuthController {
    /**
     * Handle User Login
     */
    async login(req, res) {
        try {
            // 1. Validate Input
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
                return;
            }
            const { email, password } = parsed.data;
            // 2. Call Service
            const result = await authService.login(email, password);
            // 3. Set HttpOnly Cookie for Web (Access Token)
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000, // 1 hour
            });
            // 4. Return response (Include refresh token in body for Mobile client to store securely)
            res.status(200).json({
                message: "Login berhasil",
                data: {
                    user: result.user,
                    accessToken: result.accessToken, // For Mobile client
                    refreshToken: result.refreshToken, // Mobile & Web client use this to refresh
                }
            });
        }
        catch (error) {
            if (error.message === "INVALID_CREDENTIALS") {
                res.status(401).json({ error: "UNAUTHORIZED", message: "Email atau password salah" });
            }
            else {
                res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
            }
        }
    }
    /**
     * Handle Token Refresh
     */
    async refresh(req, res) {
        try {
            // Accept refresh token from body
            const parsed = refreshSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: "VALIDATION_ERROR", message: "Refresh token diperlukan" });
                return;
            }
            const { refreshToken } = parsed.data;
            const result = await authService.refresh(refreshToken);
            // Set new Access Token Cookie
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000, // 1 hour
            });
            res.status(200).json({
                message: "Token berhasil diperbarui",
                data: {
                    accessToken: result.accessToken
                }
            });
        }
        catch (error) {
            if (error.message === "INVALID_TOKEN" || error.message === "TOKEN_EXPIRED") {
                res.status(401).json({ error: "UNAUTHORIZED", message: "Refresh token tidak valid atau kadaluarsa" });
            }
            else {
                res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
            }
        }
    }
    /**
     * Handle User Logout
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            // Clear cookie
            res.clearCookie("accessToken");
            res.status(200).json({ message: "Logout berhasil" });
        }
        catch (error) {
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan saat logout" });
        }
    }
}
export const authController = new AuthController();
