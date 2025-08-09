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

const footer = 'Based on NIV safety guidelines';

const getComplianceColor = (colKey, value) => {
  if (colKey === 'category') return '';
  const val = parseFloat(value?.replace('%', ''));
  if (val >= 90) return 'text-green-600 bg-green-50';
  if (val >= 80) return 'text-yellow-600 bg-yellow-50';
  if (val >= 70) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const NIVComplianceTable = () => {
  const { dashboardData, initialized } = useSelector(state => state.audit);
  const nivData = dashboardData.niv || [];
  const loading = !initialized;

  // Generate month labels for last 6 months
  const monthsArray = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    monthsArray.push(date.toLocaleDateString('en-US', { month: 'long' }));
  }

  // Transform data to match expected format
  const categories = [
    'General Precautions for NIV',
    'CPAP',
    'NIPPV',
    'HFNC'
  ];

  const transformedData = categories.map(category => {
    const row = { category };
    monthsArray.forEach(month => {
      const monthData = nivData.find(item => item.month === month);
      row[month] = monthData?.compliance || 'N/A';
    });
    return row;
  });

  // Dynamically generate columns: first is category, then months
  const columns = [
    { key: 'category', label: 'Category', className: 'text-left' },
    ...monthsArray.map(month => ({ key: month, label: month, className: 'text-center min-w-[100px]' })),
  ];

  return (
    <ComplianceTable
      title="NIV Bundle Compliance"
      subtitle="Last 6 months"
      columns={columns}
      data={transformedData}
      loading={loading}
      getCellClass={getComplianceColor}
      emptyMessage={
        <>
          No NIV audit data available for the selected period.<br />
          <small>Complete some NIV audits to see compliance trends.</small>
        </>
      }
      legend={legend}
      footer={footer}
    />
  );
};

export default NIVComplianceTable;
