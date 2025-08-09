// services/auditService.js
import { supabase } from '../../lib/supabaseClient'
import { 
  addAudit, 
  setError, 
  setDashboardData, 
  setDashboardLoading, 
  setDashboardError,
  setInitialized 
} from './auditSlice';

// Utility function to format dates for Supabase queries
const formatDateForQuery = (date) => {
  return date.toISOString().split('T')[0] + 'T00:00:00.000Z'
}

const formatEndDateForQuery = (date) => {
  return date.toISOString().split('T')[0] + 'T23:59:59.999Z'
}

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

// Centralized dashboard data fetching
export const fetchDashboardData = (organizationId) => async (dispatch) => {
  if (!organizationId) {
    return
  }

  try {
    dispatch(setDashboardLoading(true))
    dispatch(setDashboardError(null))

    // Fetch all dashboard data in parallel with individual error handling
    const [
      handHygieneData,
      handWashData,
      vapData,
      nivData,
      clabsiData,
      disinfectionData
    ] = await Promise.allSettled([
      fetchHandHygieneCompliance(organizationId),
      fetchHandWashCompliance(organizationId),
      fetchVAPCompliance(organizationId),
      fetchNIVCompliance(organizationId),
      fetchCLABSICompliance(organizationId),
      fetchDisinfectionCompliance(organizationId)
    ])

    // Handle each result individually
    dispatch(setDashboardData({ type: 'handHygiene', data: handHygieneData.status === 'fulfilled' ? handHygieneData.value : [] }))
    dispatch(setDashboardData({ type: 'handWash', data: handWashData.status === 'fulfilled' ? handWashData.value : [] }))
    dispatch(setDashboardData({ type: 'vap', data: vapData.status === 'fulfilled' ? vapData.value : [] }))
    dispatch(setDashboardData({ type: 'niv', data: nivData.status === 'fulfilled' ? nivData.value : [] }))
    dispatch(setDashboardData({ type: 'clabsi', data: clabsiData.status === 'fulfilled' ? clabsiData.value : [] }))
    dispatch(setDashboardData({ type: 'disinfection', data: disinfectionData.status === 'fulfilled' ? disinfectionData.value : [] }))
    
    dispatch(setInitialized(true))
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    dispatch(setDashboardError(error.message))
  } finally {
    dispatch(setDashboardLoading(false))
  }
}

// Individual data fetching functions
const fetchHandHygieneCompliance = async (organizationId, months = 6) => {
  try {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'hand_hygiene')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching hand hygiene data:', error)
        return []
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0 
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      // Categorize compliance based on score
      let adequate = 0, needsImprovement = 0, noHandHygiene = 0
      
      monthlyData.forEach(audit => {
        const compliance = audit.compliance_score || 0
        if (compliance >= 0.8) {
          adequate++
        } else if (compliance >= 0.6) {
          needsImprovement++
        } else {
          noHandHygiene++
        }
      })

      const total = monthlyData.length
      results.push({
        month,
        adequate: total > 0 ? ((adequate / total) * 100).toFixed(2) + '%' : '0.00%',
        needsImprovement: total > 0 ? ((needsImprovement / total) * 100).toFixed(2) + '%' : '0.00%',
        noHandHygiene: total > 0 ? ((noHandHygiene / total) * 100).toFixed(2) + '%' : '0.00%',
      })
    }
    return results
  } catch (error) {
    console.error('Error fetching hand hygiene compliance data:', error)
    return []
  }
}

const fetchHandWashCompliance = async (organizationId, months = 6) => {
  try {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'hand_wash')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching hand wash data:', error)
        return []
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0 
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      results.push({
        month,
        compliance: avgCompliance,
        count: monthlyData.length
      })
    }
    return results
  } catch (error) {
    console.error('Error fetching hand wash compliance data:', error)
    return []
  }
}

const fetchVAPCompliance = async (organizationId, months = 6) => {
  try {
    const monthsArray = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      monthsArray.push(date.toLocaleDateString('en-US', { month: 'long' }))
    }

    // Since we don't have bundle-specific data, we'll create a single row for VAP compliance
    const results = []
    const row = { bundle: 'VAP Bundle' }
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'vap')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching VAP data:', error)
        return { data: [], months: [] }
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      row[month] = avgCompliance > 0 ? `${(avgCompliance * 100).toFixed(2)}%` : 'N/A'
    }
    
    results.push(row)
    return { data: results, months: monthsArray }
  } catch (error) {
    console.error('Error fetching VAP compliance data:', error)
    return { data: [], months: [] }
  }
}

const fetchNIVCompliance = async (organizationId, months = 6) => {
  try {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'niv')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching NIV data:', error)
        return []
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      results.push({
        month,
        compliance: avgCompliance > 0 ? `${(avgCompliance * 100).toFixed(2)}%` : 'N/A',
        count: monthlyData.length
      })
    }
    return results
  } catch (error) {
    console.error('Error fetching NIV compliance data:', error)
    return []
  }
}

const fetchCLABSICompliance = async (organizationId, months = 6) => {
  try {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'clabsi')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching CLABSI data:', error)
        return []
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      results.push({
        month,
        compliance: avgCompliance > 0 ? `${(avgCompliance * 100).toFixed(2)}%` : 'N/A',
        count: monthlyData.length
      })
    }
    return results
  } catch (error) {
    console.error('Error fetching CLABSI compliance data:', error)
    return []
  }
}

const fetchDisinfectionCompliance = async (organizationId, months = 6) => {
  try {
    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      // Format dates for Supabase query
      const startDateStr = formatDateForQuery(startDate)
      const endDateStr = formatEndDateForQuery(endDate)

      const { data, error } = await supabase
        .from('audit_records')
        .select('compliance_score')
        .eq('organization_id', organizationId)
        .eq('audit_type', 'disinfection')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      if (error) {
        console.error('Error fetching disinfection data:', error)
        return []
      }

      const monthlyData = data || []
      const avgCompliance = monthlyData.length > 0
        ? monthlyData.reduce((sum, audit) => sum + (audit.compliance_score || 0), 0) / monthlyData.length
        : 0

      results.push({
        month,
        compliance: avgCompliance > 0 ? `${(avgCompliance * 100).toFixed(2)}%` : 'N/A',
        count: monthlyData.length
      })
    }
    return results
  } catch (error) {
    console.error('Error fetching disinfection compliance data:', error)
    return []
  }
}
