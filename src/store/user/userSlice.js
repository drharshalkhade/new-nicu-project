// src/features/user/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userDetails: null,
  users: [],
  hierarchyUsers: [], // Users under current user's hierarchy
  loading: false,
  error: null,
  isDemo: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
      state.isDemo = action.payload?.is_demo || false;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setHierarchyUsers: (state, action) => {
      state.hierarchyUsers = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
      // Also add to hierarchy if current user can view them
      if (action.payload.created_by === state.userDetails?.id || 
          state.userDetails?.role === 'super_admin') {
        state.hierarchyUsers.push(action.payload);
      }
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      
      const hierarchyIndex = state.hierarchyUsers.findIndex(user => user.id === action.payload.id);
      if (hierarchyIndex !== -1) {
        state.hierarchyUsers[hierarchyIndex] = action.payload;
      }
    },
    removeUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload);
      state.hierarchyUsers = state.hierarchyUsers.filter(user => user.id !== action.payload);
    },
    clearUserData: (state) => {
      state.userDetails = null;
      state.users = [];
      state.hierarchyUsers = [];
      state.isDemo = false;
    },
  },
});

export const {
  setUserDetails,
  setUsers,
  setHierarchyUsers,
  setLoading,
  setError,
  addUser,
  updateUser,
  removeUser,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer;
