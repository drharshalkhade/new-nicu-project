import React from 'react';

/**
 * Generic ComplianceTable component for all compliance tables.
 * Props:
 * - title: string (table title)
 * - subtitle: string (optional subtitle)
 * - columns: array of { key, label, className? }
 * - data: array of objects (each row)
 * - loading: boolean
 * - getCellClass: (colKey, value) => string (for coloring cells)
 * - emptyMessage: string (shown if no data)
 * - legend: ReactNode (optional, for below table)
 * - footer: ReactNode (optional, for below legend)
 */
const ComplianceTable = ({
  title,
  subtitle,
  columns,
  data,
  loading,
  getCellClass,
  emptyMessage,
  legend,
  footer,
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-medium text-gray-900 bg-gray-50 ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 text-center ${col.key === columns[0].key ? 'text-left font-medium text-gray-900' : ''}`}
                    >
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-sm ${getCellClass ? getCellClass(col.key, row[col.key]) : ''}`}
                      >
                        {row[col.key]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {legend && <div className="mt-4">{legend}</div>}
      {footer && <div className="mt-4 text-xs text-gray-500 text-center">{footer}</div>}
    </div>
  );
};

export default ComplianceTable;