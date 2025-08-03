// hooks/useSupabaseAudits.js
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setAudits,
  setMetrics,
  setLoading,
  setError,
  addAudit,
  updateAudit,
  deleteAudit
} from '../store/audit/auditSlice'
import { createHandHygieneAudit, createVAPAudit } from '../store/audit/auditThunk'
import { calculateCompliance } from '../utils/complianceCalculation'
import { supabase } from '../lib/supabaseClient'

export const useSupabaseAudits = () => {
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch()
  const { audits, metrics, loading, error } = useSelector(state => state.audit)

  useEffect(() => {
    if (!profile?.organization_id) return

    fetchAudits()
    fetchMetrics()
    const unsubscribe = subscribeToAuditChanges()

    return () => unsubscribe?.()
  }, [profile?.organization_id])

  const fetchAudits = async () => {
    if (!profile?.organization_id) return

    try {
      dispatch(setLoading(true))
      const { data, error } = await supabase
        .from('audit_records')
        .select('*, nicu_areas(name), users(name, email)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      dispatch(setAudits(data || []))
    } catch (err) {
      dispatch(setError(err.message || 'Failed to fetch audits'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const fetchMetrics = async () => {
    if (!profile?.organization_id) return

    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('metric_date', since)
        .order('metric_date', { ascending: false })

      if (error) throw error
      dispatch(setMetrics(data || []))
    } catch (err) {
      dispatch(setError(err.message || 'Failed to fetch metrics'))
    }
  }

  const subscribeToAuditChanges = () => {
    if (!profile?.organization_id) return

    const subscription = supabase
      .channel('audit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_records',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        (payload) => {
          const { eventType, new: newAudit, old } = payload
          switch (eventType) {
            case 'INSERT':
              dispatch(addAudit(newAudit))
              break
            case 'UPDATE':
              dispatch(updateAudit(newAudit))
              break
            case 'DELETE':
              dispatch(deleteAudit(old.id))
              break
            default:
              break
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

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

      if (auditData.audit_type === 'hand_hygiene') {
        await createHandHygieneAudit(data.id)
      } else if (auditData.audit_type === 'vap') {
        await createVAPAudit(data.id)
      }

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
    fetchAudits,
    getComplianceStats,
    getAuditsByType,
    getVAPComplianceByBundle,
    refetch: () => {
      fetchAudits()
      fetchMetrics()
    }
  }
}
