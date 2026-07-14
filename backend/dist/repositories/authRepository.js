import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class AuthRepository {
    /**
     * Find a user by email, including their role details.
     */
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }
    /**
     * Store a refresh token in the database.
     */
    async createRefreshToken(userId, token, expiresAt) {
        return prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
    /**
     * Find a valid refresh token.
     */
    async findRefreshToken(token) {
        return prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    include: { role: true },
                },
            },
        });
    }
    /**
     * Delete a specific refresh token (used during logout or rotation).
     */
    async deleteRefreshToken(token) {
        await prisma.refreshToken.delete({
            where: { token },
        }).catch(() => {
            // Ignore if token doesn't exist
        });
    }
}
export const authRepository = new AuthRepository();
