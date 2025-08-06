import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  areas: [],
  loading: false,
  error: null,
};

const nicuAreaSlice = createSlice({
  name: 'nicuArea',
  initialState,
  reducers: {
    setAreas(state, action) {
      state.areas = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setAreas, setLoading, setError } = nicuAreaSlice.actions;
export default nicuAreaSlice.reducer;