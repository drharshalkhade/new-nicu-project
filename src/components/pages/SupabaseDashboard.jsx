import { Link } from 'react-router-dom'
import { Activity, Users, TrendingUp, AlertTriangle, Plus, RefreshCw, Calendar } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useRoleBasedAccess } from '../../hooks/useROleBasedAccess'
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits'
import SubscriptionStatusCard from '../Dashboard/SubscriptionStatusCard'
import MetricsCard from '../Dashboard/MetricsCard'
import HandHygieneComplianceTable from '../Dashboard/HandHygieneComplianceTable'
import HandWashComplianceTable from '../Dashboard/HandWashComplianceTable'
import VAPComplianceTable from '../Dashboard/VAPComplianceTable'
import NIVComplianceTable from '../Dashboard/NIVComplianceTable'

const SupabaseDashboard = () => {
  const userDetails = useSelector(state => state.user.userDetails)
  const { hasPermission } = useRoleBasedAccess()
  const { loading, error, getComplianceStats, getAuditsByType, refetch } = useSupabaseAudits()

  if (loading) {
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
            {userDetails?.role === 'admin' && (
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

      {/* Subscription Alerts */}
      {userDetails?.subscription_status === 'trial' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Trial Subscription Active</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  You're currently on a trial subscription that will expire on{' '}
                  {new Date(userDetails.subscription_end_date || '').toLocaleDateString()}.
                </p>
                <p className="mt-1">
                  Upgrade to a paid plan to continue using all features after your trial ends.
                </p>
                <a
                  href="/settings?tab=subscription"
                  className="mt-2 inline-block text-blue-800 font-medium hover:text-blue-900"
                >
                  View Subscription Options →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {userDetails?.subscription_status === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Your subscription has expired. Some features may be limited or unavailable.</p>
                <p className="mt-1">Please renew your subscription to regain full access to all features.</p>
                <a
                  href="/settings?tab=subscription"
                  className="mt-2 inline-block text-red-800 font-medium hover:text-red-900"
                >
                  Renew Subscription →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {hasPermission('canView') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Overall Compliance"
            value={`${stats.averageCompliance.toFixed(1)}%`}
            icon={TrendingUp}
            color={complianceColor}
            subtitle="Last 30 days"
          />
          <MetricsCard
            title="Total Audits"
            value={stats.totalAudits}
            icon={Activity}
            color="blue"
            subtitle="This month"
          />
          <MetricsCard
            title="High Compliance"
            value={stats.highCompliance}
            icon={Users}
            color="green"
            subtitle="≥90% compliance"
          />
          <MetricsCard
            title="Needs Attention"
            value={stats.lowCompliance}
            icon={AlertTriangle}
            color="red"
            subtitle="<80% compliance"
          />
        </div>
      )}

      {/* Audit Types Overview */}
      {hasPermission('canViewReports') && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Types Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditsByType.map(({ type, count, averageCompliance }) => (
              <div key={type} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</h4>
                  <span className="text-sm text-gray-500">{count} audits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        averageCompliance >= 90
                          ? 'bg-green-500'
                          : averageCompliance >= 80
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(averageCompliance, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{averageCompliance.toFixed(0)}%</span>
                  <span>&lt;70% Poor</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Tables */}
      {hasPermission('canViewReports') && (
        <>
          <HandHygieneComplianceTable />
          <HandWashComplianceTable />
          <VAPComplianceTable />
          <NIVComplianceTable />
          {/* Uncomment or add other tables as needed */}
        </>
      )}

      {/* NICU Areas Compliance Overview - Assuming permission required */}
      {hasPermission('canViewAllAreas') && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {/* This block can be updated to fetch real data instead of hardcoded table rows */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by NICU Area - All Audit Types</h3>
          <div className="overflow-x-auto">
            {/* Table should be populated dynamically from props or state */}
            {/* Here you want to replace static rows with dynamic data fetch */}
            {/* For now, leaving structure but removing hardcoded data to keep it clean */}
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 bg-gray-50">NICU Area</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">Total Audits</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">Hand Hygiene</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">Hand Wash</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">CLABSI</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">NIV</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">VAP</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">Disinfection</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Replace with dynamic data rows here */}
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    NICU area compliance data not available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Limited Access Message */}
      {!hasPermission('canViewAllAreas') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Limited Access</h3>
          <p className="text-yellow-700">
            Your current role ({userDetails?.role?.replace('_', ' ')}) has limited access to certain reports and areas.
            Contact your administrator for additional permissions.
          </p>
        </div>
      )}
    </div>
  )
}

export default SupabaseDashboard
