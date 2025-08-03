// src/features/user/userSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userDetails: null,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails(state, action) {
      state.userDetails = action.payload
    },
    clearUserDetails(state) {
      state.userDetails = null
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    setError(state, action) {
      state.error = action.payload
    },
  },
})

export const { setUserDetails, clearUserDetails, setLoading, setError } = userSlice.actions

export default userSlice.reducer
