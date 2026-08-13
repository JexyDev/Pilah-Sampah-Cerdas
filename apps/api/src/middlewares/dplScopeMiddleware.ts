import { Request, Response, NextFunction } from "express";

/**
 * Middleware untuk memastikan akses ke Dashboard KKN.
 * Hanya SUPER_USER, PEMIMPIN, dan PANITIA_TASKFORCE yang diizinkan.
 * DPL, ADMIN_DLH, MAHASISWA_KKN, dan role lain tidak punya akses.
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

    const roleName = String(user.role || "").toUpperCase();

    const allowedRoles = [
      "SUPER_USER",
      "superUser",
      "PEMIMPIN",
      "PIMPINAN",
      "PANITIA_TASKFORCE",
      "PANITIA",
      "TASKFORCE",
      "DPL",
      "DOSEN_PEMBIMBING",
    ];
    const isAllowed = allowedRoles.some((r) => roleName.includes(r));

    if (!isAllowed) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Akses Dashboard KKN hanya untuk Admin, DPL, Pemimpin, dan Panitia Taskforce",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("[dplScopeMiddleware] error:", error);
    res
      .status(500)
      .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi hak akses" });
  }
};
