// src/features/user/userThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import { setUserDetails, setUsers, setHierarchyUsers, setLoading, setError } from './userSlice';
import { signUp } from '../../utils/signUp';

// Fetch user details with hierarchy information
export const fetchUserDetails = createAsyncThunk(
  'user/fetchUserDetails',
  async (userId, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      
      // Check if userId is valid
      if (!userId || userId === 'undefined') {
        throw new Error('Invalid user ID');
      }
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          organizations(name, is_demo),
          hospitals(name),
          nicu_areas(name)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      dispatch(setUserDetails(data));
      return data;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Fetch all users under current user's hierarchy
export const fetchHierarchyUsers = createAsyncThunk(
  'user/fetchHierarchyUsers',
  async (_, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      
      const { data, error } = await supabase
        .rpc('get_hierarchy_users');

      if (error) throw error;

      dispatch(setHierarchyUsers(data || []));
      return data;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Fetch all users (for super admin, excluding demo data)
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          organizations(name, is_demo),
          hospitals(name),
          nicu_areas(name)
        `)
        .eq('is_demo', false) // Exclude demo users
        .eq('is_active', true) // Exclude soft-deleted users
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch(setUsers(data || []));
      return data;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create new user with hierarchy tracking
export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      
      const currentUser = getState().user.userDetails;
      
      // Prepare user data with hierarchy information
      const userMetadata = {
        name: userData.name,
        role: userData.role,
        organization_id: currentUser.organization_id,
        hospital_id: currentUser.role === 'hospital_admin' ? currentUser.hospital_id : userData.hospital_id,
        nicu_area_id: userData.nicu_area_id,
        created_by: currentUser.id,
        is_demo: currentUser.is_demo || false,
        is_active: true,
      };

      // Use the signUp utility function to create the user
      const authData = await signUp(userData.email, userData.password, userMetadata);

      // Create a user object to add to the state (without fetching from DB)
      const newUser = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        organization_id: currentUser.organization_id,
        hospital_id: currentUser.role === 'hospital_admin' ? currentUser.hospital_id : userData.hospital_id,
        nicu_area_id: userData.nicu_area_id,
        created_by: currentUser.id,
        is_demo: currentUser.is_demo || false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organizations: { name: currentUser.organizations?.name, is_demo: currentUser.is_demo || false },
        hospitals: { name: currentUser.hospitals?.name },
        nicu_areas: { name: currentUser.nicu_areas?.name },
      };

      // Add to users array without fetching from DB
      dispatch(setUsers([...getState().user.users, newUser]));
      
      return newUser;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ userId, updates }, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          organizations(name, is_demo),
          hospitals(name),
          nicu_areas(name)
        `)
        .single();

      if (error) throw error;

      // Update in both users and hierarchyUsers arrays
      const currentUsers = getState().user.users;
      const updatedUsers = currentUsers.map(user => 
        user.id === userId ? data : user
      );
      dispatch(setUsers(updatedUsers));

      const currentHierarchyUsers = getState().user.hierarchyUsers;
      const updatedHierarchyUsers = currentHierarchyUsers.map(user => 
        user.id === userId ? data : user
      );
      dispatch(setHierarchyUsers(updatedHierarchyUsers));

      return data;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      
      // Mark user as deleted in the database (soft delete)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: getState().user.userDetails?.id
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Remove from both users and hierarchyUsers arrays
      const currentUsers = getState().user.users;
      const updatedUsers = currentUsers.filter(user => user.id !== userId);
      dispatch(setUsers(updatedUsers));

      const currentHierarchyUsers = getState().user.hierarchyUsers;
      const updatedHierarchyUsers = currentHierarchyUsers.filter(user => user.id !== userId);
      dispatch(setHierarchyUsers(updatedHierarchyUsers));

      return userId;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Check if user can view another user
export const canViewUser = createAsyncThunk(
  'user/canViewUser',
  async (targetUserId, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .rpc('can_view_user', { target_user_id: targetUserId });

      if (error) throw error;

      return data;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);

// Get users by role under current user's hierarchy
export const getUsersByRole = createAsyncThunk(
  'user/getUsersByRole',
  async (role, { dispatch, getState }) => {
    try {
      const hierarchyUsers = getState().user.hierarchyUsers;
      return hierarchyUsers.filter(user => user.role === role);
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);

// Sign out action
export const signOutAction = () => async (dispatch) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
    }
    
    // Clear user data from Redux store
    dispatch(setUserDetails(null));
    dispatch(setUsers([]));
    dispatch(setHierarchyUsers([]));
    dispatch(setLoading(false));
    dispatch(setError(null));
    
  } catch (error) {
    console.error('Error during sign out:', error);
    // Still clear the store even if there's an error
    dispatch(setUserDetails(null));
    dispatch(setUsers([]));
    dispatch(setHierarchyUsers([]));
    dispatch(setLoading(false));
    dispatch(setError(null));
  }
};