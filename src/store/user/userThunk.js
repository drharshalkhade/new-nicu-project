// src/features/user/userThunks.js
import { setUserDetails, setLoading, setError, clearUserDetails } from './userSlice'
import { supabase } from '../../lib/supabaseClient'

export const fetchUserDetails = () => async (dispatch) => {
  dispatch(setLoading(true))
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('No user authenticated')

    // Assuming your profile is in the "users" table and user id is 'id' column:
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    dispatch(setUserDetails(data))
  } catch (error) {
    dispatch(setError(error.message))
    dispatch(setUserDetails(null))
  } finally {
    dispatch(setLoading(false))
  }
}

export const signOutAction = () => async (dispatch) => {
  try {
    dispatch(setLoading(true))

    const { error } = await supabase.auth.signOut()

    if (error) {
      dispatch(setError(error.message))
      console.error('Sign out error:', error)
    } else {
      dispatch(clearUserDetails())
    }

  } catch (err) {
    dispatch(setError(err.message))
    console.error('Unexpected sign out error:', err)
  } finally {
    dispatch(setLoading(false))
  }
}