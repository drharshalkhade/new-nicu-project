import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

const ComplianceChart = ({ metrics }) => {
  const momentLabels = {
    beforePatientContact: 'Before Patient Contact',
    beforeAsepticProcedure: 'Before Aseptic Procedure',
    afterBodyFluidExposure: 'After Body Fluid Exposure',
    afterPatientContact: 'After Patient Contact',
    afterPatientSurroundings: 'After Patient Surroundings',
  };

  const momentData = Object.entries(metrics.complianceByMoment || {}).map(
    ([key, value]) => ({
      moment: momentLabels[key] || key,
      compliance: Number((value * 100).toFixed(1)),
    })
  );

  const trendsData = (metrics.trendsData || []).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    compliance: Number(((item.compliance || 0) * 100).toFixed(1)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Compliance Trends (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Compliance']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Compliance by WHO Moment</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={momentData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <YAxis dataKey="moment" type="category" width={150} />
            <Tooltip formatter={(value) => [`${value}%`, 'Compliance']} />
            <Bar dataKey="compliance" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComplianceChart;
