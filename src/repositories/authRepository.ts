import { PrismaClient, User, RefreshToken, Role } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthRepository {
  /**
   * Find a user by email, including their role details.
   */
  async findUserByEmail(email: string): Promise<(User & { role: Role }) | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  /**
   * Find a user by NIK, including their role details.
   */
  async findUserByNik(nik: string): Promise<(User & { role: Role }) | null> {
    return prisma.user.findUnique({
      where: { nik },
      include: { role: true },
    });
  }

  /**
   * Store a refresh token in the database.
   */
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
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
  async findRefreshToken(token: string): Promise<(RefreshToken & { user: User & { role: Role } }) | null> {
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
  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { token },
    }).catch(() => {
      // Ignore if token doesn't exist
    });
  }
  /**
   * Find a user by ID, including their role details.
   */
  async findUserById(id: string): Promise<(User & { role: Role }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  /**
   * Update a user's profile information.
   */
  async updateUser(id: string, data: { name?: string; email?: string }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update a user's password.
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }
}

export const authRepository = new AuthRepository();
