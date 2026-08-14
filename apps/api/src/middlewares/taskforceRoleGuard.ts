import { Request, Response, NextFunction } from "express";

/**
 * Guard khusus PANITIA_TASKFORCE: batasi role yang boleh dibuat/diupdate.
 * Taskforce hanya boleh CRUD akun DPL dan MAHASISWA_KKN.
 * SUPER_USER dan PEMIMPIN tidak dibatasi.
 */
export const taskforceRoleGuard = (req: Request, res: Response, next: NextFunction): void => {
  const userRole = String(req.user?.role || "").toUpperCase();

  // SUPER_USER, PEMIMPIN, DEVELOPER — bebas
  if (["SUPER_USER", "PEMIMPIN", "DEVELOPER"].includes(userRole)) {
    return next();
  }

  // PANITIA_TASKFORCE — batasi target role
  if (userRole === "PANITIA_TASKFORCE") {
    const targetRoleName = String(req.body?.roleName || req.body?.role || "").toUpperCase();

    // Jika ini DELETE/PUT tanpa roleName, izinkan (update data non-role)
    if (!targetRoleName) {
      return next();
    }

    const ALLOWED_TARGETS = ["DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN"];
    if (!ALLOWED_TARGETS.includes(targetRoleName)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Panitia Taskforce hanya dapat mengelola akun DPL dan Mahasiswa KKN. Role '${targetRoleName}' tidak diizinkan.`,
      });
      return;
    }
  }

  next();
};
