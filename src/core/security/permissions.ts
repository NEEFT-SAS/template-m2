export type PermissionMask = bigint;

export const PERMISSIONS_NONE: PermissionMask = 0n;
// BigInt removes JS 32-bit signed bitwise limits.
// Keep a bounded index so masks still fit in signed SQL BIGINT columns.
export const MAX_PERMISSION_BIT = 62;

export const permissionBit = (index: number): PermissionMask => {
  if (!Number.isInteger(index)) {
    throw new Error('Permission bit index must be an integer');
  }
  if (index < 0 || index > MAX_PERMISSION_BIT) {
    throw new Error(`Permission bit index must be between 0 and ${MAX_PERMISSION_BIT}`);
  }
  return 1n << BigInt(index);
};

export const isPermissionBit = (value: PermissionMask): boolean =>
  value > 0n && (value & (value - 1n)) === 0n;

export const hasPermissions = (mask: PermissionMask, required: PermissionMask): boolean =>
  (mask & required) === required;

export const addPermissions = (mask: PermissionMask, add: PermissionMask): PermissionMask =>
  mask | add;

export const removePermissions = (mask: PermissionMask, remove: PermissionMask): PermissionMask =>
  mask & ~remove;

export const togglePermissions = (mask: PermissionMask, toggle: PermissionMask): PermissionMask =>
  mask ^ toggle;

export const combinePermissions = (...masks: PermissionMask[]): PermissionMask =>
  masks.reduce((acc, cur) => acc | cur, PERMISSIONS_NONE);

export const listPermissions = <T extends string>(
  mask: PermissionMask,
  registry: Record<T, PermissionMask>,
): T[] => (Object.keys(registry) as T[]).filter((key) => hasPermissions(mask, registry[key]));
