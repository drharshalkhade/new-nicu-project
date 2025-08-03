import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

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

  const getComplianceColor = value => {
    const val = parseFloat(value.replace('%', ''));
    if (val >= 90) return 'text-green-600 bg-green-50';
    if (val >= 80) return 'text-yellow-600 bg-yellow-50';
    if (val >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">NIV Bundle Compliance</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">NIV Bundle Compliance</h3>
        <div className="text-sm text-gray-500">Last 6 months</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900 bg-gray-50">Category</th>
              {months.map(month => (
                <th key={month} className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50 min-w-[100px]">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complianceData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{row.category}</td>
                {months.map(month => (
                  <td key={month} className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${getComplianceColor(row[month])}`}>
                      {row[month]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-900 mb-1">General Precautions</div>
          <div className="text-blue-700">
            • Appropriate size prongs/mask<br />
            • Skin barrier application<br />
            • Gap between nasal septum and prong<br />
            • Preventing skin blanching and trauma<br />
            • Proper securing of prongs and circuit<br />
            • Gentle massage and humidification
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="font-semibold text-purple-900 mb-1">Ventilation Type Specific</div>
          <div className="text-purple-700">
            <span className="font-medium">CPAP:</span> Fitting, bubbling present<br />
            <span className="font-medium">NIPPV:</span> Interface fitting<br />
            <span className="font-medium">HFNC:</span> Nares coverage (50%)
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
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
        <div>
          Based on NIV safety guidelines
        </div>
      </div>
    </div>
  );
};

export default NIVComplianceTable;
