/**
 * Permission routes — RBAC dinamis
 * GET /api/v1/permissions → ambil semua permission per role (SUPER USER only)
 * PUT /api/v1/permissions/:roleId → update permission batch untuk satu role
 * GET /api/v1/permissions/me → ambil permission milik user yang login
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const prisma = new PrismaClient();
const router = Router();

// Cache permission per roleId (invalidate saat update)
const permissionCache = new Map<number, Record<string, any>>();

router.use(authMiddleware);

/** GET /api/v1/permissions/me — permission user yang login (semua role) */
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { roleId: true },
    });
    if (!user) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }

    const cached = permissionCache.get(user.roleId);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const permissions = await prisma.permission.findMany({
      where: { roleId: user.roleId },
    });

    const result = Object.fromEntries(
      permissions.map((p) => [
        p.resource,
        {
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        },
      ])
    );

    permissionCache.set(user.roleId, result);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  }
});

// Endpoint berikut hanya untuk SUPER USER
router.use(roleMiddleware(["SUPER_USER"]));

/** GET /api/v1/permissions — semua permission per role */
router.get("/", async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: "asc" },
    });

    const data = roles.map((role) => ({
      roleId: role.id,
      roleName: role.name,
      permissions: Object.fromEntries(
        role.permissions.map((p) => [
          p.resource,
          {
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          },
        ])
      ),
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  }
});

/** PUT /api/v1/permissions/:roleId — update batch permission untuk satu role */
router.put("/:roleId", async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const permissions: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> =
      req.body.permissions;

    if (!permissions || typeof permissions !== "object") {
      res.status(400).json({ error: "INVALID_PAYLOAD", message: "permissions harus berupa object" });
      return;
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      res.status(404).json({ error: "ROLE_NOT_FOUND" });
      return;
    }

    // Upsert setiap permission
    const ops = Object.entries(permissions).map(([resource, perms]) =>
      prisma.permission.upsert({
        where: { roleId_resource: { roleId, resource } },
        update: {
          canView: perms.canView ?? false,
          canCreate: perms.canCreate ?? false,
          canEdit: perms.canEdit ?? false,
          canDelete: perms.canDelete ?? false,
        },
        create: {
          roleId,
          resource,
          canView: perms.canView ?? false,
          canCreate: perms.canCreate ?? false,
          canEdit: perms.canEdit ?? false,
          canDelete: perms.canDelete ?? false,
        },
      })
    );

    await prisma.$transaction(ops);

    // Invalidate cache
    permissionCache.delete(roleId);

    res.json({ success: true, message: `Hak akses untuk role ${role.name} berhasil diperbarui` });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  }
});

export default router;
