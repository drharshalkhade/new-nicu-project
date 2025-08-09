import { useSelector } from 'react-redux';
import ComplianceTable from '../common-components/ComplianceTable';

const columns = [
  { key: 'month', label: 'Month', className: 'text-left' },
  { key: 'compliance', label: 'Compliance', className: 'text-center min-w-[120px]' },
  { key: 'count', label: 'Audits', className: 'text-center min-w-[100px]' },
];

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

const footer = 'Based on CLABSI prevention guidelines';

const getComplianceColor = (colKey, value) => {
  if (colKey === 'month' || colKey === 'count') return '';
  const val = parseFloat(value?.replace('%', ''));
  if (val >= 90) return 'text-green-600 bg-green-50';
  if (val >= 80) return 'text-yellow-600 bg-yellow-50';
  if (val >= 70) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const CLABSIComplianceTable = () => {
  const { dashboardData, initialized } = useSelector(state => state.audit);
  const clabsiData = dashboardData.clabsi || [];
  const loading = !initialized;

  // Transform data to include audit count
  const transformedData = clabsiData.map(item => ({
    month: item.month,
    compliance: item.compliance,
    count: item.count,
  }));

  return (
    <ComplianceTable
      title="CLABSI Compliance by Month"
      subtitle="Central Line-Associated Bloodstream Infection Prevention"
      columns={columns}
      data={transformedData}
      loading={loading}
      getCellClass={getComplianceColor}
      emptyMessage={
        <>
          No CLABSI audit data available for the selected period.<br />
          <small>Complete some CLABSI audits to see compliance trends.</small>
        </>
      }
      legend={legend}
      footer={footer}
    />
  );
};

export default CLABSIComplianceTable;