// store/auditSlice.js (no TypeScript)
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  audits: [],
  metrics: [],
  loading: false,
  error: null
}

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setAudits: (state, action) => {
      state.audits = action.payload
    },
    addAudit: (state, action) => {
      state.audits.unshift(action.payload)
    },
    updateAudit: (state, action) => {
      const index = state.audits.findIndex(a => a.id === action.payload.id)
      if (index !== -1) {
        state.audits[index] = action.payload
      }
    },
    deleteAudit: (state, action) => {
      state.audits = state.audits.filter(a => a.id !== action.payload)
    },
    setMetrics: (state, action) => {
      state.metrics = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  }
})

export const {
  setAudits,
  addAudit,
  updateAudit,
  deleteAudit,
  setMetrics,
  setLoading,
  setError
} = auditSlice.actions

export default auditSlice.reducer
