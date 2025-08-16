// hooks/useDashboardData.js
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardData } from '../store/audit/auditThunk'

export const useDashboardData = () => {
  const dispatch = useDispatch()
  const profile = useSelector(state => state.user.userDetails)
  const { dashboardData, initialized, loading } = useSelector(state => state.audit)
  const [currentFilters, setCurrentFilters] = useState({})

  useEffect(() => {
    if (profile?.organization_id && !initialized && !loading) {
      dispatch(fetchDashboardData(profile.organization_id, currentFilters))
    }
  }, [profile?.organization_id, initialized, loading, dispatch, currentFilters])

  return {
    dashboardData,
    initialized,
    loading,
    refetch: (filters = {}) => {
      setCurrentFilters(filters)
      if (profile?.organization_id && !loading) {
        dispatch(fetchDashboardData(profile.organization_id, filters))
      }
    }
  }
} 