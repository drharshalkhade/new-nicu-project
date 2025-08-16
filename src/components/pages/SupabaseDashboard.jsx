import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import { Activity, Users, TrendingUp, AlertTriangle, Plus, RefreshCw, Calendar } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess'
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits'
import { useDashboardData } from '../../hooks/useDashboardData'
import SubscriptionStatusCard from '../Dashboard/SubscriptionStatusCard'
import MetricsCard from '../Dashboard/MetricsCard'
import HandHygieneComplianceTable from '../Dashboard/HandHygieneComplianceTable'
import HandWashComplianceTable from '../Dashboard/HandWashComplianceTable'
import VAPComplianceTable from '../Dashboard/VAPComplianceTable'
import NIVComplianceTable from '../Dashboard/NIVComplianceTable'
import HierarchyFilter from '../Dashboard/HierarchyFilter'

const SupabaseDashboard = () => {
  const dispatch = useDispatch();
  const userDetails = useSelector(state => state.user.userDetails);
  const { hasPermission } = useRoleBasedAccess();
  const { loading: overallLoading, error, getComplianceStats, getAuditsByType } = useSupabaseAudits();
  const { loading: dashboardLoading, refetch } = useDashboardData();
  const [hierarchyFilters, setHierarchyFilters] = useState({});

  const handleFilterChange = (filters) => {
    setHierarchyFilters(filters);
    // Trigger dashboard data refresh with new filters
    refetch(filters);
  };

  if (overallLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  const stats = getComplianceStats()
  const auditsByType = getAuditsByType()
  const complianceColor =
    stats.averageCompliance >= 90
      ? 'green'
      : stats.averageCompliance >= 80
      ? 'yellow'
      : 'red'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {userDetails?.name} • {userDetails?.department}
            {userDetails?.role === 'super_admin' && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                SUPER ADMIN
              </span>
            )}
            {userDetails?.role === 'hospital_admin' && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                ADMIN
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {userDetails?.subscription_status && <SubscriptionStatusCard compact />}
          {hasPermission('canView') && (
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          )}
          {hasPermission('canCreate') && (
            <Link
              to="/audit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Audit</span>
            </Link>
          )}
        </div>
      </div>

      {/* Hierarchy Filter for Super Admins */}
      <HierarchyFilter onFilterChange={handleFilterChange} />

      {/* Subscription Alerts */}
      {userDetails?.subscription_status === 'trial' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Trial Period Active</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You're currently on a trial subscription. Upgrade to continue accessing all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {userDetails?.subscription_status === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
              <p className="text-sm text-red-700 mt-1">
                Your subscription has expired. Please renew to continue accessing the platform.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Audits"
          value={stats.totalAudits}
          icon={Activity}
          color="blue"
          trend={null}
        />
        <MetricsCard
          title="Average Compliance"
          value={`${stats.averageCompliance.toFixed(1)}%`}
          icon={TrendingUp}
          color={complianceColor}
          trend={null}
        />
        <MetricsCard
          title="High Compliance"
          value={stats.highCompliance}
          icon={TrendingUp}
          color="green"
          trend={null}
        />
        <MetricsCard
          title="Low Compliance"
          value={stats.lowCompliance}
          icon={AlertTriangle}
          color="red"
          trend={null}
        />
      </div>

      {/* Audit Type Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Distribution by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {auditsByType.map(({ type, count, averageCompliance }) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</div>
              <div className="text-xs text-gray-500">
                {averageCompliance > 0 ? `${(averageCompliance * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Tables */}
      <div className="space-y-6">
        <HandHygieneComplianceTable />
        <HandWashComplianceTable />
        <VAPComplianceTable />
        <NIVComplianceTable />
      </div>
    </div>
  )
}

export default SupabaseDashboard
