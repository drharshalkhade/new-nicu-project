// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';
import auditReducer from './audit/auditSlice';


export const store = configureStore({
  reducer: {
    user: userReducer,
    audit: auditReducer
  },
});
