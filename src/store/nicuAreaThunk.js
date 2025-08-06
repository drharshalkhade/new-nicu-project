import { setAreas, setLoading, setError } from './nicuAreaSlice';
import { supabase } from '../lib/supabaseClient';

export const fetchNicuAreas = (organization_id) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data, error } = await supabase
      .from('nicu_areas_with_org')
      .select('id, name')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    dispatch(setAreas(data || []));
  } catch (err) {
    dispatch(setError(err.message || 'Failed to fetch NICU areas'));
    dispatch(setAreas([]));
  } finally {
    dispatch(setLoading(false));
  }
};