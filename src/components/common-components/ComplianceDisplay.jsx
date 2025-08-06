import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ComplianceDisplay - shows compliance score, progress bar, and warning if low
 * Props:
 * - complianceScore: number
 * - complianceLevel: { color: string, description: string }
 * - totalFields: number
 * - completedFields: number
 * - lowCompliance: boolean
 */
const ComplianceDisplay = ({ complianceScore, complianceLevel, totalFields, completedFields, lowCompliance }) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-6">
    <div className="flex justify-between mb-2">
      <h4 className="text-sm font-semibold">Compliance</h4>
      <div className={`text-lg font-bold text-${complianceLevel.color}-600`}>
        {complianceScore.toFixed(1)}%
      </div>
    </div>
    <div className="w-full rounded-full bg-gray-200 h-2 mb-2">
      <div
        className={`rounded-full h-2 transition-all duration-300 bg-${complianceLevel.color}-500`}
        style={{ width: `${complianceScore}%` }}
      />
    </div>
    <div className="flex justify-between text-xs text-gray-600 mb-2">
      <span>
        Completed {completedFields}/{totalFields}
      </span>
      <span>{complianceLevel.description}</span>
    </div>
    {lowCompliance && (
      <div className="flex items-center text-red-600 space-x-2 mt-1">
        <AlertCircle size={16} />
        <span className="text-sm">Below 80% compliance threshold</span>
      </div>
    )}
  </div>
);

export default ComplianceDisplay;