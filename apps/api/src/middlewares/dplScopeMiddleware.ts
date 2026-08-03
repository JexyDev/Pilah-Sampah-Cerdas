import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Middleware to enforce DPL data scoping.
 * DPL users can ONLY access groups and students assigned to them.
 * Admin DLH and SuperAdmin bypass this check.
 */
export const dplScopeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "User belum terotentikasi" });
      return;
    }

    const currentUserId = user.userId || (user as any).id;
    const roleName = String(user.role || "").toUpperCase();

    // SuperAdmin and Admin DLH can view all DPL data
    if (
      ["ADMIN_DLH", "DLH", "DLH_ADMIN", "SUPERADMIN", "SUPER_ADMIN", "ADMIN"].some((r) =>
        roleName.includes(r)
      )
    ) {
      next();
      return;
    }

    // Only DPL role proceeds
    if (!["DPL", "DOSEN_PEMBIMBING", "DOSEN PEMBIMBING"].includes(roleName)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Akses hanya untuk Dosen Pembimbing Lapangan (DPL)" });
      return;
    }

    const groupId = (req.params.groupId || req.query.groupId || req.body?.groupId) as string | undefined;
    const studentId = (req.params.studentId || req.query.studentId || req.body?.studentId) as string | undefined;

    if (groupId) {
      const group = await prisma.kelompokKkn.findUnique({
        where: { id: groupId },
        select: { dplId: true },
      });

      if (!group || group.dplId !== currentUserId) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Anda tidak memiliki hak akses ke kelompok bimbingan ini",
        });
        return;
      }
    }

    if (studentId) {
      const student = await prisma.studentKkn.findFirst({
        where: {
          OR: [{ id: studentId }, { userId: studentId }],
        },
        include: {
          kelompok: {
            select: { dplId: true },
          },
        },
      });

      if (!student || !student.kelompok || student.kelompok.dplId !== currentUserId) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Anda tidak memiliki hak akses ke data mahasiswa ini",
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error("[dplScopeMiddleware] error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi batasan akses DPL" });
  }
};
