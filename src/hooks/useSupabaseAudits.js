// hooks/useSupabaseAudits.js
import { useDispatch, useSelector } from 'react-redux'
import { calculateCompliance } from '../utils/complianceCalculation'
import { supabase } from '../lib/supabaseClient'

export const useSupabaseAudits = () => {
  const profile = useSelector(state => state.user.userDetails);
  const { audits, metrics, loading, error } = useSelector(state => state.audit)

  const createAudit = async (auditData) => {
    if (!profile?.organization_id || !profile?.id) throw new Error('User not authenticated')

    const nicuAreaId = auditData.nicuAreaId || null
    delete auditData.nicuAreaId

    try {
      const compliance_score = await calculateCompliance(auditData.audit_type, auditData.audit_data).score
      const { data, error } = await supabase
        .from('audit_records')
        .insert({
          ...auditData,
          organization_id: profile.organization_id,
          observer_id: profile.id,
          nicu_area_id: nicuAreaId,
          compliance_score,
          status: 'completed'
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (err) {
      throw new Error(err.message || 'Failed to create audit')
    }
  }

  const getComplianceStats = () => {
    const total = audits.length
    if (total === 0) return { totalAudits: 0, averageCompliance: 0, highCompliance: 0, mediumCompliance: 0, lowCompliance: 0 }

    const average = audits.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / total
    return {
      totalAudits: total,
      averageCompliance: Math.round(average * 100) / 100,
      highCompliance: audits.filter(a => (a.compliance_score || 0) >= 90).length,
      mediumCompliance: audits.filter(a => (a.compliance_score || 0) >= 80 && (a.compliance_score || 0) < 90).length,
      lowCompliance: audits.filter(a => (a.compliance_score || 0) < 80).length
    }
  }

  const getAuditsByType = () => {
    const types = ['hand_hygiene', 'hand_wash', 'clabsi', 'niv', 'vap', 'disinfection']
    return types.map(type => {
      const filtered = audits.filter(a => a.audit_type === type)
      const avg = filtered.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / (filtered.length || 1)
      return { type, count: filtered.length, averageCompliance: avg }
    })
  }

  const getVAPComplianceByBundle = () => {
    const bundles = [
      'Intubation Bundle',
      'Maintenance Bundle',
      'ET Suction Bundle',
      'Extubation Bundle',
      'Post-Extubation Care Bundle'
    ]
    const vapAudits = audits.filter(a => a.audit_type === 'vap')

    return bundles.map(bundle => {
      const filtered = vapAudits.filter(a => a.audit_data?.bundleType === bundle)
      const avg = filtered.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / (filtered.length || 1)
      return { bundle, count: filtered.length, averageCompliance: avg }
    })
  }

  return {
    audits,
    metrics,
    loading,
    error,
    createAudit,
    getComplianceStats,
    getAuditsByType,
    getVAPComplianceByBundle
  }
}
