import { useSelector } from 'react-redux';
import ComplianceTable from '../common-components/ComplianceTable';

const columns = [
  { key: 'month', label: 'Month', className: 'text-left' },
  { key: 'adequate', label: 'Adequate', className: 'text-center text-green-700 bg-green-50 min-w-[120px]' },
  { key: 'needsImprovement', label: 'Needs Improvement', className: 'text-center text-yellow-700 bg-yellow-50 min-w-[140px]' },
  { key: 'noHandHygiene', label: 'No Hand Hygiene', className: 'text-center text-red-700 bg-red-50 min-w-[130px]' },
];

const legend = (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
      <div className="font-semibold text-green-900 mb-1">Adequate Compliance</div>
      <div className="text-green-700">
        • Duration: ≥10-20 sec or &gt;20 sec<br />
        • Steps: 6 steps or 3-5 steps<br />
        • Target: &gt;40% of audits
      </div>
    </div>
    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <div className="font-semibold text-yellow-900 mb-1">Needs Improvement</div>
      <div className="text-yellow-700">
        • Duration: &lt;10 sec with 6 steps<br />
        • Steps: &lt;3 steps with any duration<br />
        • Action: Additional training needed
      </div>
    </div>
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <div className="font-semibold text-red-900 mb-1">No Hand Hygiene</div>
      <div className="text-red-700">
        • Duration: 0 sec<br />
        • Steps: 0 steps<br />
        • Critical: Immediate intervention required
      </div>
    </div>
  </div>
);

const footer = 'Based on WHO hand hygiene technique assessment and time duration criteria';

const getComplianceColor = (category, value) => {
  const numValue = parseFloat(value?.replace('%', ''));
  switch (category) {
    case 'adequate':
      if (numValue >= 40) return 'text-green-700 bg-green-100 font-semibold';
      if (numValue >= 20) return 'text-green-600 bg-green-50';
      return 'text-green-500 bg-green-25';
    case 'needsImprovement':
      if (numValue >= 60) return 'text-yellow-700 bg-yellow-100 font-semibold';
      if (numValue >= 40) return 'text-yellow-600 bg-yellow-50';
      return 'text-yellow-500 bg-yellow-25';
    case 'noHandHygiene':
      if (numValue >= 30) return 'text-red-700 bg-red-100 font-semibold';
      if (numValue >= 15) return 'text-red-600 bg-red-50';
      return 'text-red-500 bg-red-25';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const HandHygieneComplianceTable = () => {
  const { dashboardData, initialized } = useSelector(state => state.audit);
  const complianceData = dashboardData.handHygiene || [];
  const loading = !initialized;

  return (
    <ComplianceTable
      title="Hand Hygiene Compliance by Month"
      subtitle="Based on technique assessment"
      columns={columns}
      data={complianceData}
      loading={loading}
      getCellClass={getComplianceColor}
      emptyMessage={
        <>
          No hand hygiene audit data available for the selected period.<br />
          <small>Complete some hand hygiene audits to see compliance trends.</small>
        </>
      }
      legend={legend}
      footer={footer}
    />
  );
};

export default HandHygieneComplianceTable;
