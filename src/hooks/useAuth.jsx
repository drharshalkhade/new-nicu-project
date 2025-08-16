import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { fetchUserDetails } from '../store/user/userThunk'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If user is authenticated, fetch user details from the database
      if (session?.user?.id) {
        try {
          await dispatch(fetchUserDetails(session.user.id)).unwrap()
        } catch (error) {
          console.error('Error fetching user details:', error)
        }
      }
    })

    // Initial session check
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
      
      // If user is already authenticated, fetch user details
      if (data.session?.user?.id) {
        try {
          await dispatch(fetchUserDetails(data.session.user.id)).unwrap()
        } catch (error) {
          console.error('Error fetching user details:', error)
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [dispatch])

  return { user, loading }
}
