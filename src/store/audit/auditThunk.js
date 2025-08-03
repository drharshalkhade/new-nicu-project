// services/auditService.js
import { supabase } from '../../lib/supabaseClient'
import { addAudit, setError } from './auditSlice'

// Create Hand Hygiene Audit
export const createHandHygieneAudit = (audit) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('hand_hygiene_audits')
      .insert([audit])
      .select()

    if (error) throw error

    if (data && data[0]) {
      dispatch(addAudit(data[0]))
    }

    return data[0]
  } catch (err) {
    dispatch(setError(err.message))
    throw err
  }
}

// Create VAP Audit
export const createVAPAudit = (audit) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('vap_audits')
      .insert([audit])
      .select()

    if (error) throw error

    if (data && data[0]) {
      dispatch(addAudit(data[0]))
    }

    return data[0]
  } catch (err) {
    dispatch(setError(err.message))
    throw err
  }
}
