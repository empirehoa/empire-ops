/**
 * Pure synchronous permission utilities — no server imports.
 * Safe to import from both server and client contexts.
 */

export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'manager'
  | 'board_member'
  | 'homeowner'
  | 'vendor'
  | 'staff'
  | 'inspector'
  | 'accountant'

/** Permission matrix — mirrors the DB seed in 074_rbac_comprehensive.sql */
export const PERMISSION_MATRIX: Record<string, Record<string, UserRole[]>> = {
  financials: {
    read: ['super_admin', 'tenant_admin', 'manager', 'accountant', 'board_member'],
    write: ['super_admin', 'tenant_admin', 'accountant'],
    approve: ['super_admin', 'tenant_admin', 'manager'],
    export: ['super_admin', 'tenant_admin', 'accountant'],
  },
  contacts: {
    read: ['super_admin', 'tenant_admin', 'manager', 'staff', 'board_member'],
    write: ['super_admin', 'tenant_admin', 'manager'],
  },
  violations: {
    read: ['super_admin', 'tenant_admin', 'manager', 'inspector', 'board_member', 'homeowner', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'inspector'],
    delete: ['super_admin', 'tenant_admin'],
  },
  work_orders: {
    read: ['super_admin', 'tenant_admin', 'manager', 'vendor', 'homeowner', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'homeowner'],
    assign: ['super_admin', 'tenant_admin', 'manager'],
  },
  documents: {
    read: ['super_admin', 'tenant_admin', 'manager', 'board_member', 'homeowner', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'board_member'],
  },
  residents: {
    read: ['super_admin', 'tenant_admin', 'manager', 'board_member'],
    write: ['super_admin', 'tenant_admin', 'manager'],
  },
  action_items: {
    read: ['super_admin', 'tenant_admin', 'manager', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'staff'],
  },
  ballots: {
    read: ['super_admin', 'tenant_admin', 'manager', 'board_member', 'homeowner'],
    write: ['super_admin', 'tenant_admin', 'manager', 'board_member'],
    certify: ['super_admin', 'tenant_admin'],
  },
  pos: {
    read: ['super_admin', 'tenant_admin', 'manager', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'staff'],
  },
  admin: {
    read: ['super_admin', 'tenant_admin'],
    write: ['super_admin', 'tenant_admin'],
  },
  users: {
    manage: ['super_admin', 'tenant_admin'],
  },
  my_account: {
    read: ['homeowner'],
    write: ['homeowner'],
  },
  lots: {
    read: ['super_admin', 'tenant_admin', 'manager', 'board_member', 'homeowner', 'staff'],
    write: ['super_admin', 'tenant_admin', 'manager', 'staff'],
    delete: ['super_admin', 'tenant_admin', 'manager'],
  },
}

/**
 * Pure synchronous check: does `role` have permission for `resource` + `action`?
 */
export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  return PERMISSION_MATRIX[resource]?.[action]?.includes(role) ?? false
}

/**
 * Homeowner scope check.
 * Non-homeowners always pass; homeowners only pass if the property/association
 * is in their allowed list.
 */
export function isHomeownerScoped(
  ctx: { role: UserRole; associationIds?: string[] },
  propertyId: string
): boolean {
  if (ctx.role !== 'homeowner') return true
  return ctx.associationIds?.includes(propertyId) ?? false
}
