import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const HandWashComplianceTable = () => {
  const userDetails = useSelector(state => state.user.userDetails);
  const [complianceData, setComplianceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userDetails?.organization_id) {
      fetchHandWashCompliance();
    }
  }, [userDetails?.organization_id]);

  const fetchHandWashCompliance = async () => {
    try {
      setLoading(true);
      const results = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];

        const monthlyCompliance = await getMonthlyHandWashCompliance(startDate);

        results.push({
          month,
          adequate: monthlyCompliance.adequate,
          needsImprovement: monthlyCompliance.needsImprovement,
          poor: monthlyCompliance.poor,
        });
      }

      setComplianceData(results);
    } catch (error) {
      console.error('Error fetching hand wash compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simulated async data fetch with improvement trend & randomness
  const getMonthlyHandWashCompliance = async (startDate) => {
    try {
      const date = new Date(startDate);
      const monthIndex = date.getMonth();
      const currentMonth = new Date().getMonth();
      const monthsAgo = (currentMonth - monthIndex + 12) % 12;

      if (monthsAgo > 5) {
        return { adequate: '0.00%', needsImprovement: '0.00%', poor: '0.00%' };
      }

      // Base values moving towards improvement
      const baseAdequate = 35 + monthsAgo * 7;
      const baseNeeds = 40 - monthsAgo * 3;
      const basePoor = 25 - monthsAgo * 4;

      // Random variation +/-5%, +/-4%, +/-3%
      let adequate = baseAdequate + (Math.random() * 10 - 5);
      let needsImprovement = baseNeeds + (Math.random() * 8 - 4);
      let poor = basePoor + (Math.random() * 6 - 3);

      adequate = Math.max(0, adequate);
      needsImprovement = Math.max(0, needsImprovement);
      poor = Math.max(0, poor);

      const total = adequate + needsImprovement + poor;

      return {
        adequate: ((adequate / total) * 100).toFixed(2) + '%',
        needsImprovement: ((needsImprovement / total) * 100).toFixed(2) + '%',
        poor: ((poor / total) * 100).toFixed(2) + '%',
      };
    } catch (error) {
      console.error('Error in getMonthlyHandWashCompliance:', error);
      return { adequate: '0.00%', needsImprovement: '0.00%', poor: '0.00%' };
    }
  };

  const getComplianceColor = (category, value) => {
    const numValue = parseFloat(value.replace('%', ''));
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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hand Wash Compliance by Month</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Hand Wash Compliance by Month</h3>
        <div className="text-sm text-gray-500">SUMANK Protocol Assessment</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900 bg-gray-50">Month</th>
              <th className="text-center py-3 px-4 font-medium text-green-700 bg-green-50 min-w-[120px]">Adequate</th>
              <th className="text-center py-3 px-4 font-medium text-yellow-700 bg-yellow-50 min-w-[140px]">Needs Improvement</th>
              <th className="text-center py-3 px-4 font-medium text-red-700 bg-red-50 min-w-[100px]">Poor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complianceData.length > 0 ? (
              complianceData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{row.month}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-sm ${getComplianceColor('adequate', row.adequate)}`}>
                      {row.adequate}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-sm ${getComplianceColor('needsImprovement', row.needsImprovement)}`}>
                      {row.needsImprovement}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-sm ${getComplianceColor('poor', row.poor)}`}>
                      {row.poor}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No hand wash audit data available for the selected period.
                  <br />
                  <small>Complete some hand wash audits to see compliance trends.</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on SUMANK protocol: S(palm-to-palm), U(right over left), M(back of fingers), A(thumbs), N(fingertips), K(wrists)
      </div>
    </div>
  );
};

export default HandWashComplianceTable;
