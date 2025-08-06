// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';
import auditReducer from './audit/auditSlice';
import nicuAreaReducer from './nicuAreaSlice';


export const store = configureStore({
  reducer: {
    user: userReducer,
    audit: auditReducer,
    nicuArea: nicuAreaReducer,
  },
});
