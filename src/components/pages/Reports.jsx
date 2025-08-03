import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useROleBasedAccess';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';

const REPORT_AUDIT_OPTIONS = [
  { value: 'all', label: 'All Audits' },
  { value: 'hand_hygiene', label: 'Hand Hygiene' },
  { value: 'hand_wash', label: 'Hand Wash' },
  { value: 'clabsi', label: 'CLABSI' },
  { value: 'niv', label: 'NIV' },
  { value: 'vap', label: 'VAP' },
  { value: 'disinfection', label: 'Disinfection' }
];

const AUDIT_TYPE_COLORS = {
  hand_hygiene: 'bg-blue-100 text-blue-800',
  hand_wash: 'bg-cyan-100 text-cyan-800',
  clabsi: 'bg-red-100 text-red-800',
  niv: 'bg-purple-100 text-purple-800',
  vap: 'bg-green-100 text-green-800',
  disinfection: 'bg-orange-100 text-orange-800'
};

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800'
};

function getAuditTypeColor(type) {
  return AUDIT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800';
}
function getStatusColor(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
function getComplianceColor(score) {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 80) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

const Reports = () => {
  const { hasPermission } = useRoleBasedAccess();
  const { audits, loading } = useSupabaseAudits();
  const [selectedAuditType, setSelectedAuditType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  if (!hasPermission('canViewReports')) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <BarChart3 className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You don't have permission to view reports. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ---- Filtering ----
  const filteredAudits = audits.filter(audit => {
    const auditDate = new Date(audit.created_at).toISOString().split('T')[0];
    const matchesType = selectedAuditType === 'all' || audit.audit_type === selectedAuditType;
    const matchesDate = auditDate >= dateRange.start && auditDate <= dateRange.end;
    return matchesType && matchesDate;
  });

  // ---- CSV Download ----
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Audit Type', 'NICU Area', 'Observer', 'Compliance Score', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredAudits.map(audit => [
        new Date(audit.created_at).toLocaleDateString(),
        new Date(audit.created_at).toLocaleTimeString(),
        audit.audit_type.replace('_', ' ').toUpperCase(),
        audit.nicu_area || 'NICU Area', // Replace with actual data if possible
        audit.observer || 'Observer Name', // Replace with actual data if possible
        audit.compliance_score?.toFixed(1) || 'N/A',
        audit.status || 'completed',
        (audit.notes || '').replace(/[\r\n,"]/g, ' ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nicu-audit-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Download */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive audit compliance reporting</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Audit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type</label>
            <select
              value={selectedAuditType}
              onChange={e => setSelectedAuditType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REPORT_AUDIT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Records ({filteredAudits.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NICU Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAudits.length > 0 ? (
                filteredAudits.map(audit => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(audit.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAuditTypeColor(audit.audit_type)}`}>
                        {audit.audit_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {audit.nicu_area || `NICU Area ${Math.floor(Math.random() * 5) + 1}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {audit.observer || `Observer ${Math.floor(Math.random() * 10) + 1}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(audit.compliance_score || 0)}`}>
                        {audit.compliance_score?.toFixed(1) || 'N/A'}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(audit.status || 'completed')}`}>
                        {(audit.status || 'completed').charAt(0).toUpperCase() + (audit.status || 'completed').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {audit.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No audits found</h3>
                      <p className="text-gray-500">
                        Try adjusting your filters or date range to see more results.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
