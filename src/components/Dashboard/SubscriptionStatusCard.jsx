import React from 'react';
import { useSelector } from 'react-redux';
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react';

const SubscriptionStatusCard = ({ compact = false }) => {
  const userDetails = useSelector(state => state.user.userDetails);

  if (!userDetails?.subscription_status) {
    return null;
  }

  const { subscription_status, subscription_tier, subscription_end_date } = userDetails;
  const isExpired = subscription_status === 'expired';
  const isTrial = subscription_status === 'trial';
  const isActive = subscription_status === 'active';

  const subscriptionEndDate = subscription_end_date ? new Date(subscription_end_date) : null;

  const daysRemaining = subscriptionEndDate
    ? Math.ceil((subscriptionEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusColor = () => {
    if (isExpired) return 'bg-red-50 border border-red-200';
    if (isTrial) return 'bg-blue-50 border border-blue-200';
    if (isActive) return 'bg-green-50 border border-green-200';
    // If other status, fallback gray
    return 'bg-gray-50 border border-gray-200';
  };

  const getStatusTextColor = () => {
    if (isExpired) return 'text-red-800';
    if (isTrial) return 'text-blue-800';
    if (isActive) return 'text-green-800';
    return 'text-gray-800';
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (isTrial) return <Calendar className="h-5 w-5 text-blue-600" />;
    if (isActive) return <CreditCard className="h-5 w-5 text-green-600" />;
    return null;
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md ${getStatusColor()}`}>
        {getStatusIcon()}
        <div>
          <div className={`text-xs font-medium ${getStatusTextColor()}`}>
            {subscription_tier} {subscription_status}
          </div>
          {daysRemaining !== null && (
            <div className="text-xs text-gray-600">{daysRemaining} days remaining</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className={`font-medium ${getStatusTextColor()}`}>
            {subscription_tier} Plan
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            isExpired
              ? 'bg-red-100 text-red-800'
              : isTrial
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {subscription_status.toUpperCase()}
        </span>
      </div>

      {subscriptionEndDate && (
        <div className="text-sm">
          <div
            className={`${
              daysRemaining && daysRemaining <= 7 ? 'text-red-700 font-medium' : 'text-gray-600'
            }`}
          >
            {isTrial
              ? 'Trial ends'
              : isExpired
              ? 'Expired on'
              : 'Renews'}: {subscriptionEndDate.toLocaleDateString()}
          </div>
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="text-xs text-gray-500 mt-1">{daysRemaining} days remaining</div>
          )}
        </div>
      )}

      {isExpired && (
        <div className="mt-2">
          <a
            href="/settings?tab=subscription"
            className="text-sm font-medium text-red-700 hover:text-red-800"
          >
            Renew subscription →
          </a>
        </div>
      )}

      {isTrial && (
        <div className="mt-2">
          <a
            href="/settings?tab=subscription"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Upgrade now →
          </a>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatusCard;
