import { useSelector } from 'react-redux';
import ComplianceTable from '../common-components/ComplianceTable';

const columns = [
  { key: 'month', label: 'Month', className: 'text-left' },
  { key: 'adequate', label: 'Adequate', className: 'text-center text-green-700 bg-green-50 min-w-[120px]' },
  { key: 'needsImprovement', label: 'Needs Improvement', className: 'text-center text-yellow-700 bg-yellow-50 min-w-[140px]' },
  { key: 'poor', label: 'Poor', className: 'text-center text-red-700 bg-red-50 min-w-[100px]' },
];

const legend = (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
      <div className="font-semibold text-green-900 mb-1">Adequate (10-12 steps)</div>
      <div className="text-green-700">
        • All critical SUMANK steps completed<br />
        • Proper duration and technique<br />
        • Target: &gt;60% of audits
      </div>
    </div>
    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <div className="font-semibold text-yellow-900 mb-1">Needs Improvement (7-9 steps)</div>
      <div className="text-yellow-700">
        • Some steps missed<br />
        • Partial SUMANK compliance<br />
        • Action: Refresher training needed
      </div>
    </div>
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <div className="font-semibold text-red-900 mb-1">Poor (&lt;6 steps)</div>
      <div className="text-red-700">
        • Major steps missed<br />
        • Inadequate technique<br />
        • Critical: Immediate intervention required
      </div>
    </div>
  </div>
);

const footer = 'Based on SUMANK protocol: S(palm-to-palm), U(right over left), M(back of fingers), A(thumbs), N(fingertips), K(wrists)';

const getComplianceColor = (category, value) => {
  const numValue = parseFloat(value?.replace('%', ''));
  switch (category) {
    case 'adequate':
      if (numValue >= 60) return 'text-green-700 bg-green-100 font-semibold';
      if (numValue >= 40) return 'text-green-600 bg-green-50';
      return 'text-green-500 bg-green-25';
    case 'needsImprovement':
      if (numValue >= 35) return 'text-yellow-700 bg-yellow-100 font-semibold';
      if (numValue >= 20) return 'text-yellow-600 bg-yellow-50';
      return 'text-yellow-500 bg-yellow-25';
    case 'poor':
      if (numValue >= 20) return 'text-red-700 bg-red-100 font-semibold';
      if (numValue >= 10) return 'text-red-600 bg-red-50';
      return 'text-red-500 bg-red-25';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const HandWashComplianceTable = () => {
  const { dashboardData, initialized } = useSelector(state => state.audit);
  const handWashData = dashboardData.handWash || [];
  const loading = !initialized;

  // Transform data to match expected format
  const transformedData = handWashData.map(item => ({
    month: item.month,
    adequate: item.compliance > 0.8 ? `${(item.compliance * 100).toFixed(2)}%` : '0.00%',
    needsImprovement: item.compliance > 0.6 && item.compliance <= 0.8 ? `${(item.compliance * 100).toFixed(2)}%` : '0.00%',
    poor: item.compliance <= 0.6 ? `${(item.compliance * 100).toFixed(2)}%` : '0.00%',
  }));

  return (
    <ComplianceTable
      title="Hand Wash Compliance by Month"
      subtitle="SUMANK Protocol Assessment"
      columns={columns}
      data={transformedData}
      loading={loading}
      getCellClass={getComplianceColor}
      emptyMessage={
        <>
          No hand wash audit data available for the selected period.<br />
          <small>Complete some hand wash audits to see compliance trends.</small>
        </>
      }
      legend={legend}
      footer={footer}
    />
  );
};

export default HandWashComplianceTable;
