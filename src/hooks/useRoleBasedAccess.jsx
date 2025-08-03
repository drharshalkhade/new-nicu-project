import { useSelector } from 'react-redux';

// Define roles and permissions
const ROLE_PERMISSIONS = {
  super_admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
    canViewReports: true,
    canViewAllAreas: true,
    canManageSettings: true,
    canManageSubscriptions: true,
  },
  admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
    canViewReports: true,
    canViewAllAreas: true,
    canManageSettings: true,
    canManageSubscriptions: false,
  },
  auditor: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
    canViewReports: true,
    canViewAllAreas: true,
    canManageSettings: false,
    canManageSubscriptions: false,
  }
};

const DEFAULT_PERMISSIONS = Object.fromEntries(
  Object.keys(ROLE_PERMISSIONS.super_admin).map(key => [key, false])
);

export const useRoleBasedAccess = () => {
  // Get user from Redux state
  const user = useSelector(state => state.user?.userDetails);
  const role = user?.role;

  const permissions = ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS;

  const hasPermission = action => !!permissions[action];

  const checkSubscriptionAccess = feature => {
    if (role === 'super_admin') return true;

    const isActive = ['active', 'trial'].includes(user?.subscription_status);
    const tier = user?.subscription_tier;

    if (isActive) {
      if (['reports', 'users', 'settings'].includes(feature)) return true;
      if (feature === 'advanced_analytics') return ['Professional', 'Enterprise'].includes(tier);
      if (feature === 'white_label') return tier === 'Enterprise';
      return true;
    }
    return ['reports', 'dashboard'].includes(feature);
  };

  const canAccessAuditType = () => hasPermission('canView');

  const canAccessNICUArea = () => {
    if (['super_admin', 'admin'].includes(role)) return true;
    if (role === 'auditor') return hasPermission('canViewAllAreas');
    return false;
  };

  const canAccessOrganization = organizationId =>
    role === 'super_admin' || user?.organization_id === organizationId;

  const getAccessibleAuditTypes = () => {
    const allTypes = ['hand_hygiene', 'hand_wash', 'clabsi', 'niv', 'vap', 'disinfection'];
    return canAccessAuditType() ? allTypes : [];
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', required: 'canView', feature: null },
      { path: '/audit', label: 'New Audit', required: 'canCreate', feature: null },
      { path: '/reports', label: 'Reports', required: 'canViewReports', feature: 'reports' },
      { path: '/education', label: 'Education', required: 'canView', feature: null },
    ];

    const adminItems = [
      { path: '/users', label: 'Users', required: 'canManageUsers', feature: 'users' },
      { path: '/settings', label: 'Settings', required: 'canManageSettings', feature: 'settings' },
    ];

    return [...baseItems, ...adminItems]
      .filter(item =>
        hasPermission(item.required) && (!item.feature || checkSubscriptionAccess(item.feature))
      )
      .map(({ path, label }) => ({ path, label }));
  };

  return {
    user,
    permissions,
    hasPermission,
    canAccessAuditType,
    canAccessNICUArea,
    canAccessOrganization,
    getAccessibleAuditTypes,
    getNavigationItems,
    checkSubscriptionAccess,
    isAdmin: ['admin', 'super_admin'].includes(role),
    isSuperAdmin: role === 'super_admin',
    isAuditor: role === 'auditor',
  };
};
