import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  fetchHierarchyUsers,
  fetchAllUsers,
  canViewUser,
  getUsersByRole,
} from '../store/user/userThunk';

export const useHierarchy = () => {
  const dispatch = useDispatch();
  const {
    userDetails,
    users,
    hierarchyUsers,
    loading,
    error,
    isDemo,
  } = useSelector((state) => state.user);

  // Load appropriate users based on role
  useEffect(() => {
    if (userDetails?.id) {
      if (userDetails.role === 'super_admin') {
        dispatch(fetchAllUsers());
      } else {
        dispatch(fetchHierarchyUsers());
      }
    }
  }, [userDetails?.id, userDetails?.role]);

  // Manual refresh function
  const refreshUsers = () => {
    if (userDetails?.id) {
      if (userDetails.role === 'super_admin') {
        dispatch(fetchAllUsers());
      } else {
        dispatch(fetchHierarchyUsers());
      }
    }
  };

  // Helper functions
  const canCreateUser = (targetRole) => {
    if (!userDetails) return false;
    
    switch (userDetails.role) {
      case 'super_admin':
        return ['hospital_admin', 'auditor'].includes(targetRole);
      case 'hospital_admin':
        return targetRole === 'auditor';
      default:
        return false;
    }
  };

  const canViewUserData = (targetUserId) => {
    if (!userDetails) return false;
    
    // User can always view their own data
    if (userDetails.id === targetUserId) return true;
    
    // Super admin can view all non-demo users
    if (userDetails.role === 'super_admin') {
      const targetUser = users.find(u => u.id === targetUserId);
      return targetUser && !targetUser.is_demo;
    }
    
    // Hospital admin can view users they created
    if (userDetails.role === 'hospital_admin') {
      const targetUser = hierarchyUsers.find(u => u.id === targetUserId);
      return targetUser && targetUser.created_by === userDetails.id;
    }
    
    return false;
  };

  const canEditUser = (targetUserId) => {
    return canViewUserData(targetUserId);
  };

  const canDeleteUser = (targetUserId) => {
    if (!userDetails) return false;
    
    // Users cannot delete themselves
    if (userDetails.id === targetUserId) return false;
    
    return canViewUserData(targetUserId);
  };

  const getUsersByRole = (role) => {
    return hierarchyUsers.filter(user => user.role === role);
  };

  const getAdmins = () => {
    return getUsersByRole('hospital_admin');
  };

  const getAuditors = () => {
    return getUsersByRole('auditor');
  };

  const getUsersUnderAdmin = (adminId) => {
    return hierarchyUsers.filter(user => user.created_by === adminId);
  };

  const isDemoUser = () => {
    return isDemo;
  };

  const isDemoOrganization = () => {
    return userDetails?.organizations?.is_demo || false;
  };

  const getVisibleUsers = () => {
    if (userDetails?.role === 'super_admin') {
      return users; // All non-demo users
    }
    return hierarchyUsers; // Users under current user's hierarchy
  };

  const getOrganizationUsers = () => {
    return getVisibleUsers().filter(user => 
      user.organization_id === userDetails?.organization_id
    );
  };

  const getHospitalUsers = () => {
    return getVisibleUsers().filter(user => 
      user.hospital_id === userDetails?.hospital_id
    );
  };

  const getNicuAreaUsers = () => {
    return getVisibleUsers().filter(user => 
      user.nicu_area_id === userDetails?.nicu_area_id
    );
  };

  return {
    // State
    userDetails,
    users: getVisibleUsers(),
    hierarchyUsers,
    loading,
    error,
    isDemo,
    
    // Permission checks
    canCreateUser,
    canViewUserData,
    canEditUser,
    canDeleteUser,
    
    // User filtering
    getUsersByRole,
    getAdmins,
    getAuditors,
    getUsersUnderAdmin,
    getOrganizationUsers,
    getHospitalUsers,
    getNicuAreaUsers,
    
    // Demo checks
    isDemoUser,
    isDemoOrganization,
    
    // Actions
    checkCanViewUser: (targetUserId) => dispatch(canViewUser(targetUserId)),
    refreshUsers,
  };
}; 