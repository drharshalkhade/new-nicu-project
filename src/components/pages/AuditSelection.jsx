import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Droplets,
  Heart,
  Shield,
  Settings as Lungs,
  SprayCan as Spray
} from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';

const AuditSelection = () => {
  const { hasPermission, getAccessibleAuditTypes } = useRoleBasedAccess();

  if (!hasPermission('canCreate')) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <Activity className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You don't have permission to create new audits. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const auditTypes = [
    {
      id: 'hand-hygiene',
      title: '1. Hand Hygiene Audit',
      description: 'WHO 5 Moments hand hygiene compliance assessment',
      icon: Activity,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'hand-wash',
      title: '2. Hand Wash Audit',
      description: 'Detailed handwashing technique evaluation',
      icon: Droplets,
      color: 'bg-cyan-500',
      available: true
    },
    {
      id: 'vap',
      title: '3. VAP Audit',
      description: 'Ventilator-Associated Pneumonia prevention audit',
      icon: Lungs,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'niv',
      title: '4. NIV Audit',
      description: 'Non-Invasive Ventilation compliance audit',
      icon: Heart,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'clabsi',
      title: '5. CLABSI Audit',
      description: 'Central Line-Associated Bloodstream Infection audit',
      icon: Shield,
      color: 'bg-red-500',
      available: true
    },
    {
      id: 'disinfection',
      title: '6. Disinfection Audit',
      description: 'Equipment and environment disinfection compliance audit',
      icon: Spray,
      color: 'bg-orange-500',
      available: true
    }
  ];

  const accessibleTypes = getAccessibleAuditTypes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Select Audit Type</h1>
        <p className="text-gray-600 mt-1">Choose the type of audit you want to conduct</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auditTypes.map((audit) => {
          const Icon = audit.icon;
          // Use the same normalization (replace - with _) for comparison:
          const isAccessible = accessibleTypes.includes(audit.id.replace('-', '_'));

          // Available & accessible: show as link
          if (audit.available && isAccessible) {
            return (
              <Link
                key={audit.id}
                to={`/audit/${audit.id}`}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-full ${audit.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {audit.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{audit.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  <span>Start Audit</span>
                  <svg className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          }

          // Not accessible: show disabled
          return (
            <div
              key={audit.id}
              className={`p-6 rounded-lg border border-gray-200 cursor-not-allowed ${!isAccessible ? 'bg-red-50 opacity-60' : 'bg-gray-50 opacity-60'}`}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-full bg-gray-400 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-500">{audit.title}</h3>
                </div>
              </div>
              <p className="text-gray-500 text-sm">{audit.description}</p>
              <div className="mt-4 flex items-center text-gray-400 text-sm">
                <span>{!isAccessible ? 'Access Restricted' : 'Coming Soon'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-blue-700 text-sm mb-4">
          Each audit type follows specific medical protocols and guidelines. Make sure you're familiar with the requirements before starting.
        </p>
        <Link
          to="/education"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Training Resources →
        </Link>
      </div>
    </div>
  );
};

export default AuditSelection;
