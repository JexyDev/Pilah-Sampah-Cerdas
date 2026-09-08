/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Dynamic RBAC Permission Middleware.
 * Checks whether user has permission for a specific resource & action (canView, canCreate, canEdit, canDelete).
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import {
  getRolePermissionCache,
  setRolePermissionCache,
  PermissionActions,
  RolePermissionRecord,
} from "../lib/permissionCache.js";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete";

const normalizeRole = (r: string): string => {
  const upper = String(r || "").toUpperCase();
  if (["DLH", "DLH_ADMIN", "ADMIN_DLH", "ADMIN DLH"].includes(upper)) return "ADMIN_DLH";
  if (["ADMIN_KECAMATAN", "CAMAT", "CAMAT_ADMIN"].includes(upper)) return "CAMAT";
  if (["ADMIN_KELURAH", "LURAH", "LURAH_ADMIN"].includes(upper)) return "LURAH";
  if (["SUPER_USER", "superUser", "SUPER USER"].includes(upper)) return "SUPER_USER";
  if (
    [
      "DPL",
      "DOSEN_PEMBIMBING",
      "DOSEN PEMBIMBING",
      "DOSEN_PENDAMPING",
      "DOSEN PENDAMPING",
      "DOSEN_PENDAMPING_LAPANGAN",
      "DOSEN PENDAMPING LAPANGAN",
    ].includes(upper)
  )
    return "DPL";
  if (["PEMIMPIN", "PIMPINAN"].includes(upper)) return "PEMIMPIN";
  if (["PANITIA_TASKFORCE", "PANITIA", "TASKFORCE", "TASK_FORCE", "TASK FORCE"].includes(upper))
    return "TASK_FORCE";
  if (["MAHASISWA", "MAHASISWA_KKN", "MAHASISWA KKN"].includes(upper)) return "MAHASISWA_KKN";
  if (["WARGA", "MASYARAKAT"].includes(upper)) return "WARGA";
  return upper;
};

/**
 * Middleware to enforce dynamic permission checking from database/cache
 *
 * @param resource Key of resource from RBAC matrix (e.g. "pemanfaatan", "pengangkutan", "ide_daur_ulang")
 * @param action Action required: "canView" | "canCreate" | "canEdit" | "canDelete" (defaults to "canView")
 * @param fallbackAllowedRoles Optional list of roles that are allowed as fallback if resource is not defined in DB
 */
export const requirePermission = (
  resource: string,
  action: PermissionAction = "canView",
  fallbackAllowedRoles?: string[]
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "User belum terotentikasi" });
        return;
      }

      const userRole = normalizeRole(user.role);

      // Super User & Developer master bypass
      if (userRole === "DEVELOPER" || userRole === "SUPER_USER") {
        return next();
      }

      // Fetch user's roleId from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { roleId: true },
      });

      if (!dbUser) {
        res.status(404).json({ error: "USER_NOT_FOUND", message: "User tidak ditemukan" });
        return;
      }

      // Retrieve permissions from cache or query DB
      let rolePerms = getRolePermissionCache(dbUser.roleId);
      if (!rolePerms) {
        const perms = await prisma.permission.findMany({
          where: { roleId: dbUser.roleId },
        });

        rolePerms = Object.fromEntries(
          perms.map((p) => [
            p.resource,
            {
              canView: p.canView,
              canCreate: p.canCreate,
              canEdit: p.canEdit,
              canDelete: p.canDelete,
            },
          ])
        );

        setRolePermissionCache(dbUser.roleId, rolePerms);
      }

      // Check dynamic permission
      const resourcePerm = rolePerms[resource];
      if (resourcePerm && resourcePerm[action] === true) {
        return next();
      }

      // If resource not configured or false, check optional fallback roles
      if (fallbackAllowedRoles && fallbackAllowedRoles.length > 0) {
        const normalizedAllowed = fallbackAllowedRoles.map(normalizeRole);
        if (normalizedAllowed.includes(userRole)) {
          return next();
        }
      }

      // Permission denied
      console.warn(
        `[requirePermission 403] URL: ${req.method} ${req.originalUrl} | User: ${user.userId} (${userRole}) | Resource: ${resource} | Required: ${action}`
      );
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Akses ditolak: Anda tidak memiliki izin (${action}) untuk resource '${resource}'.`,
      });
    } catch (error: any) {
      console.error("[requirePermission] error:", error);
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal memverifikasi izin pengguna",
      });
    }
  };
};
