import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { AdminRole } from '../models/User.model.js';

export type AdminPermission =
  | 'analytics:view'
  | 'users:view'
  | 'users:manage'
  | 'contracts:view'
  | 'disputes:manage'
  | 'reviews:moderate'
  | 'reports:manage'
  | 'audit:view'
  | 'health:view'
  | 'exports:generate'
  | 'roles:manage';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'analytics:view',
    'users:view',
    'users:manage',
    'contracts:view',
    'disputes:manage',
    'reviews:moderate',
    'reports:manage',
    'audit:view',
    'health:view',
    'exports:generate',
    'roles:manage',
  ],
  operations_admin: [
    'analytics:view',
    'users:view',
    'users:manage',
    'contracts:view',
    'reports:manage',
    'audit:view',
    'health:view',
    'exports:generate',
  ],
  trust_safety_moderator: [
    'disputes:manage',
    'reviews:moderate',
    'reports:manage',
  ],
  support_operator: [
    'users:view',
    'contracts:view',
  ],
  analytics_viewer: [
    'analytics:view',
  ],
};

export function requireAdminPermission(permission: AdminPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Administrative access required' });
      return;
    }

    const adminRole = (req.user.adminRole as AdminRole) || 'super_admin';
    const permissions = ROLE_PERMISSIONS[adminRole] || [];

    if (!permissions.includes(permission)) {
      res.status(403).json({
        error: `Forbidden: Admin role '${adminRole}' lacks permission '${permission}'`,
        requiredPermission: permission,
        currentRole: adminRole,
      });
      return;
    }

    next();
  };
}
