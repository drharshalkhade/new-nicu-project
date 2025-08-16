import React from 'react';
import { useSelector } from 'react-redux';
import ComplianceTable from '../common-components/ComplianceTable';

const legend = (
  <div className="flex items-center space-x-4 text-xs text-gray-500">
    <div className="flex items-center space-x-1">
      <div className="w-3 h-3 bg-green-100 rounded"></div>
      <span>≥90% Excellent</span>
    </div>
    <div className="flex items-center space-x-1">
      <div className="w-3 h-3 bg-yellow-100 rounded"></div>
      <span>80-89% Good</span>
    </div>
    <div className="flex items-center space-x-1">
      <div className="w-3 h-3 bg-orange-100 rounded"></div>
      <span>70-79% Fair</span>
    </div>
    <div className="flex items-center space-x-1">
      <div className="w-3 h-3 bg-red-100 rounded"></div>
      <span>&lt;70% Poor</span>
    </div>
  </div>
);

const footer = 'Based on WHO VAP prevention guidelines';

const getComplianceColor = (colKey, value) => {
  if (colKey === 'bundle') return '';
  const val = parseFloat(value?.replace('%', ''));
  if (val >= 90) return 'text-green-600 bg-green-50';
  if (val >= 80) return 'text-yellow-600 bg-yellow-50';
  if (val >= 70) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const VAPComplianceTable = () => {
  const { dashboardData, initialized } = useSelector(state => state.audit);
  const vapData = dashboardData.vap || { data: [], months: [] };
  const complianceData = vapData.data || [];
  const months = vapData.months || [];
  const loading = !initialized;

  // VAP Bundle categories based on the form options
  const bundleCategories = [
    'Intubation Bundle',
    'Reintubation Bundle', 
    'Maintenance Bundle',
    'ET Suction Bundle',
    'Extubation Bundle',
    'Post-Extubation Care Bundle'
  ];

  // Transform data to show multiple bundle types like NIV table
  const transformedData = bundleCategories.map(bundle => {
    const row = { bundle };
    months.forEach(month => {
      const monthData = complianceData.find(item => item.bundle === bundle && item.month === month);
      row[month] = monthData?.compliance || 'N/A';
    });
    return row;
  });

  // Dynamically generate columns: first is bundle, then months
  const columns = [
    { key: 'bundle', label: 'Bundle', className: 'text-left' },
    ...months.map(month => ({ key: month, label: month, className: 'text-center min-w-[100px]' })),
  ];

  return (
    <ComplianceTable
      title="VAP Bundle Compliance by Month"
      subtitle="Last 6 months"
      columns={columns}
      data={transformedData}
      loading={loading}
      getCellClass={getComplianceColor}
      emptyMessage={
        <>
          No VAP audit data available for the selected period.<br />
          <small>Complete some VAP audits to see compliance trends.</small>
        </>
      }
      legend={legend}
      footer={footer}
    />
  );
};

export default VAPComplianceTable;
