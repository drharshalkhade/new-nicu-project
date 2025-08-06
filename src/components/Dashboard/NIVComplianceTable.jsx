import { useState, useEffect } from 'react';
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
  const userDetails = useSelector(state => state.user.userDetails);
  const [complianceData, setComplianceData] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userDetails?.organization_id) {
      fetchNIVCompliance();
    }
  }, [userDetails?.organization_id]);

  const fetchNIVCompliance = async () => {
    setLoading(true);
    try {
      // Generate month labels for last 6 months
      const monthsArray = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthsArray.push(date.toLocaleDateString('en-US', { month: 'long' }));
      }
      setMonths(monthsArray);

      // Categories for demo
      const categories = [
        'General Precautions for NIV',
        'CPAP',
        'NIPPV',
        'HFNC'
      ];

      const data = categories.map(category => {
        const row = { category };
        monthsArray.forEach((month, idx) => {
          let base;
          if (category === 'General Precautions for NIV') {
            base = 55 + (idx * 7);
          } else if (category === 'CPAP') {
            base = 65 + (idx * 6);
          } else if (category === 'NIPPV') {
            base = 85 + (idx * 2) - (idx === 2 || idx === 3 ? 15 : 0);
          } else {
            base = 95 - (idx * 3) + (idx >= 3 ? (idx - 2) * 5 : 0);
          }
          const variation = Math.floor(Math.random() * 10) - 5;
          const value = Math.min(Math.max(base + variation, 50), 99.9);
          row[month] = `${value.toFixed(2)}%`;
        });
        return row;
      });

      setComplianceData(data);
    } catch (error) {
      console.error('Error fetching NIV compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically generate columns: first is category, then months
  const columns = [
    { key: 'category', label: 'Category', className: 'text-left' },
    ...months.map(month => ({ key: month, label: month, className: 'text-center min-w-[100px]' })),
  ];

  return (
    <ComplianceTable
      title="NIV Bundle Compliance"
      subtitle="Last 6 months"
      columns={columns}
      data={complianceData}
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
