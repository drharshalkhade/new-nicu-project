// hooks/useDashboardData.js
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardData } from '../store/audit/auditThunk'

export const useDashboardData = () => {
  const dispatch = useDispatch()
  const profile = useSelector(state => state.user.userDetails)
  const { dashboardData, initialized, loading } = useSelector(state => state.audit)

  useEffect(() => {
    if (profile?.organization_id && !initialized && !loading) {
      dispatch(fetchDashboardData(profile.organization_id))
    }
  }, [])

  return {
    dashboardData,
    initialized,
    loading,
    refetch: () => {
      if (profile?.organization_id && !loading) {
        dispatch(fetchDashboardData(profile.organization_id))
      }
    }
  }
} 