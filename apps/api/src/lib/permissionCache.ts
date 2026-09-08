/**
 * Project: BERSEKA
 * Module: Permission Cache
 * Shared in-memory cache for role permissions to reduce DB query load.
 */

export interface PermissionActions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type RolePermissionRecord = Record<string, PermissionActions>;

const cache = new Map<number, RolePermissionRecord>();

export const getRolePermissionCache = (roleId: number): RolePermissionRecord | undefined => {
  return cache.get(roleId);
};

export const setRolePermissionCache = (roleId: number, permissions: RolePermissionRecord): void => {
  cache.set(roleId, permissions);
};

export const invalidateRolePermissionCache = (roleId: number): void => {
  cache.delete(roleId);
};

export const clearAllPermissionCache = (): void => {
  cache.clear();
};
