import { prisma } from "../lib/prisma.js";
/**
 * Permission routes — RBAC dinamis
 * GET /api/v1/permissions → ambil semua permission per role (SUPER USER only)
 * PUT /api/v1/permissions/:roleId → update permission batch untuk satu role
 * GET /api/v1/permissions/me → ambil permission milik user yang login
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

import {
  getRolePermissionCache,
  setRolePermissionCache,
  invalidateRolePermissionCache,
} from "../lib/permissionCache.js";
import { iotService } from "../services/iotService.js";

router.use(authMiddleware);

/** GET /api/v1/permissions/me — permission user yang login (semua role) */
router.get("/me", async (req, res) => {
  try {
    const userRole = String(req.user?.role || "").toUpperCase();

    // If DEVELOPER or SUPER_USER, return full access directly
    if (userRole === "DEVELOPER" || userRole === "SUPER_USER") {
      const allPermissions: Record<
        string,
        { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
      > = {
        dashboard_utama: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        dashboard_kkn: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        monitoring_sampah: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        laporan_analitik: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        pengangkutan: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        pemanfaatan: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        hasil_pemanfaatan: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        evaluasi_ai: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        manajemen_pengguna: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        manajemen_tempat_sampah: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        manajemen_lokasi: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        master_data_wilayah: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        rw_approval: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        rw_fasilitas: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        poin_warga: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        ide_daur_ulang: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        konfigurasi_sistem: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        audit_trail: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        internet_of_things: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        iot_monitoring: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        iot_data_sensor: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        iot_perangkat: { canView: true, canCreate: true, canEdit: true, canDelete: true },
        iot_konfigurasi: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      };
      res.json({ success: true, data: allPermissions, role: userRole });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { roleId: true, role: { select: { name: true } } },
    });
    if (!user) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }

    const cached = getRolePermissionCache(user.roleId);
    if (cached) {
      res.json({ success: true, data: cached, role: user.role?.name || userRole });
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

    // Integrasi hak akses dinamis grup IoT dari IoTSystemConfig
    const iotConfig = await iotService.getOrCreateSystemConfig();
    const effectiveRole = user.role?.name || userRole;

    const rbac = iotConfig.rbacPermissions || {
      iot_monitoring: Array.isArray(iotConfig.roleAccessMonitoring) ? iotConfig.roleAccessMonitoring : ["DEVELOPER", "SUPER_USER"],
      iot_data_sensor: Array.isArray(iotConfig.roleAccessDataSensor) ? iotConfig.roleAccessDataSensor : ["DEVELOPER", "SUPER_USER"],
      iot_perangkat: Array.isArray(iotConfig.roleAccessPerangkat) ? iotConfig.roleAccessPerangkat : ["DEVELOPER", "SUPER_USER"],
      iot_konfigurasi: Array.isArray(iotConfig.roleAccessKonfigurasi) ? iotConfig.roleAccessKonfigurasi : ["DEVELOPER", "SUPER_USER"],
    };

    const isRoleAllowed = (allowedList?: string[]) => {
      if (!Array.isArray(allowedList)) return false;
      return (
        allowedList.includes(effectiveRole) ||
        (effectiveRole === "PIMPINAN" && (allowedList.includes("PEMIMPIN") || allowedList.includes("PIMPINAN"))) ||
        (effectiveRole === "PEMIMPIN" && (allowedList.includes("PIMPINAN") || allowedList.includes("PEMIMPIN"))) ||
        ((effectiveRole === "TASK_FORCE" || effectiveRole === "PANITIA_TASKFORCE" || effectiveRole === "TASKFORCE") &&
          (allowedList.includes("TASK_FORCE") || allowedList.includes("PANITIA_TASKFORCE") || allowedList.includes("TASKFORCE")))
      );
    };

    const canMonitoring = isRoleAllowed(rbac.iot_monitoring);
    const canDataSensor = isRoleAllowed(rbac.iot_data_sensor);
    const canPerangkat = isRoleAllowed(rbac.iot_perangkat);
    const canKonfigurasi = isRoleAllowed(rbac.iot_konfigurasi);
    const canGroup = canMonitoring || canDataSensor || canPerangkat || canKonfigurasi;

    result.iot_monitoring = { canView: canMonitoring, canCreate: canMonitoring, canEdit: canMonitoring, canDelete: canMonitoring };
    result.iot_data_sensor = { canView: canDataSensor, canCreate: canDataSensor, canEdit: canDataSensor, canDelete: canDataSensor };
    result.iot_perangkat = { canView: canPerangkat, canCreate: canPerangkat, canEdit: canPerangkat, canDelete: canPerangkat };
    result.iot_konfigurasi = { canView: canKonfigurasi, canCreate: canKonfigurasi, canEdit: canKonfigurasi, canDelete: canKonfigurasi };
    result.internet_of_things = { canView: canGroup, canCreate: canGroup, canEdit: canGroup, canDelete: canGroup };

    setRolePermissionCache(user.roleId, result);
    res.json({ success: true, data: result, role: user.role?.name || userRole });
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
    const permissions: Record<
      string,
      { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
    > = req.body.permissions;

    if (!permissions || typeof permissions !== "object") {
      res
        .status(400)
        .json({ error: "INVALID_PAYLOAD", message: "permissions harus berupa object" });
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
    invalidateRolePermissionCache(roleId);

    res.json({ success: true, message: `Hak akses untuk role ${role.name} berhasil diperbarui` });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  }
});

export default router;
