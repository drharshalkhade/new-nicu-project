import { useState, useEffect } from 'react';
import { Building, Calendar, CreditCard, MapPin, Plus, Settings as SettingsIcon, Users } from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useROleBasedAccess';
import { supabase } from '../../lib/supabaseClient';
import { signUp } from '../../utils/signUp';
import { useSelector } from 'react-redux';


const Settings = () => {
  const { hasPermission, isSuperAdmin } = useRoleBasedAccess();
  const profile = useSelector((state) => state.user.userDetails)

  const [activeTab, setActiveTab] = useState('organization');
  const [organizations, setOrganizations] = useState([]);
  const [nicuAreas, setNicuAreas] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    type: 'hospital',
    adminName: '',
    adminEmail: '',
    adminDepartment: 'Administration'
  });

  const [newSubscription, setNewSubscription] = useState({
    organizationId: '',
    planId: '',
    billingCycle: 'monthly',
    paymentMethod: 'credit_card',
    paymentReference: ''
  });

  const [newArea, setNewArea] = useState({
    name: '',
    description: ''
  });
  const [editingArea, setEditingArea] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'auditor',
    department: ''
  });

  useEffect(() => {
    if (hasPermission('canManageSettings')) {
      fetchData();
    }
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (isSuperAdmin) {
        await fetchOrganizations();
      }
      await fetchNicuAreas();
      await fetchSubscriptionPlans();
      if (!isSuperAdmin && profile?.organization_id) {
        await fetchCurrentSubscription(profile.organization_id);
      }
    } catch (err) {
      setError('Failed to load settings data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setOrganizations(data || []);
  };

  const fetchNicuAreas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nicu_areas_with_org')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setNicuAreas(data || []);
    } catch (error) {
      console.error('Error fetching NICU areas:', error);
      setNicuAreas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');
    if (error) throw error;
    setSubscriptionPlans(data || []);
  };

  const fetchCurrentSubscription = async (organizationId) => {
    const { data, error } = await supabase
      .rpc('get_organization_subscription', { org_id: organizationId });
    if (error) throw error;
    if (data && Object.keys(data).length > 0) {
      setCurrentSubscription({
        id: data.id || 'current',
        organization_id: data.organization_id,
        plan_id: data.plan_id || '',
        status: data.subscription_status || 'trial',
        start_date: data.start_date,
        end_date: data.end_date,
        trial_end_date: data.trial_end_date,
        billing_cycle: data.billing_cycle || 'monthly',
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference,
        plan_name: data.plan_name
      });
    }
  };

  const createOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: newOrganization.name,
          type: newOrganization.type,
          subscription_tier: 'starter'
        })
        .select()
        .single();
      if (orgError) throw orgError;

      // 2. Create admin user for the organization
      const { error: signUpError } = await signUp(
        newOrganization.adminEmail,
        'temp123!', // Temporary password - should be changed on first login
        {
          name: newOrganization.adminName,
          organization_id: orgData.id,
          role: 'admin',
          department: newOrganization.adminDepartment
        }
      );
      if (signUpError) throw signUpError;

      setSuccess(`Organization "${newOrganization.name}" and admin account created successfully!`);
      setNewOrganization({
        name: '',
        type: 'hospital',
        adminName: '',
        adminEmail: '',
        adminDepartment: 'Administration'
      });

      await fetchOrganizations();
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', newSubscription.planId)
        .single();

      if (planError) throw planError;

      const { error } = await supabase
        .rpc('upgrade_subscription', {
          org_id: newSubscription.organizationId,
          plan_name: plan.name,
          billing_cycle: newSubscription.billingCycle,
          payment_method: newSubscription.paymentMethod,
          payment_reference: newSubscription.paymentReference
        });

      if (error) throw error;

      setSuccess(`Subscription created successfully for plan "${plan.name}"!`);
      await fetchOrganizations();
      if (profile?.organization_id === newSubscription.organizationId) {
        await fetchCurrentSubscription(profile.organization_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const createNICUArea = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('nicu_areas')
        .insert({
          organization_id: profile?.organization_id,
          name: newArea.name,
          description: newArea.description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setNicuAreas([...nicuAreas, data]);
      setSuccess(`NICU Area "${newArea.name}" created successfully!`);
      setNewArea({ name: '', description: '' });
    } catch (err) {
      setError(err.message || 'Failed to create NICU area');
    } finally {
      setLoading(false);
    }
  };

  const updateNICUArea = async (area) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('nicu_areas')
        .update({
          name: area.name,
          description: area.description,
          is_active: area.is_active
        })
        .eq('id', area.id);

      if (error) throw error;

      setNicuAreas(nicuAreas.map(a => a.id === area.id ? area : a));
      setSuccess(`NICU Area "${area.name}" updated successfully!`);
      setEditingArea(null);
    } catch (err) {
      setError(err.message || 'Failed to update NICU area');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await signUp(
        newUser.email,
        'temp123!',
        {
          name: newUser.name,
          organization_id: profile?.organization_id,
          role: newUser.role,
          department: newUser.department
        }
      );

      if (error) throw error;

      setSuccess(`User "${newUser.name}" created successfully!`);
      setNewUser({ name: '', email: '', role: 'auditor', department: '' });
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('canManageSettings')) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <SettingsIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You don't have permission to access settings. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-600 mt-1">
        Manage {isSuperAdmin ? 'organizations, users, and system' : 'organization'} settings
      </p>
    </div>

    {/* Success/Error Messages */}
    {success && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">{success}</p>
        <button
          onClick={() => setSuccess(null)}
          className="mt-2 text-green-600 hover:text-green-800"
        >
          Dismiss
        </button>
      </div>
    )}
    {error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-red-600 hover:text-red-800"
        >
          Dismiss
        </button>
      </div>
    )}

    {/* Tabs */}
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('organization')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'organization' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Organizations
          </button>
        )}
        <button
          onClick={() => setActiveTab('areas')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'areas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <MapPin className="h-4 w-4 inline mr-2" />
          NICU Areas
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscription' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Subscription
        </button>
      </nav>
    </div>

    {/* Organization Management (Super Admin Only) */}
    {isSuperAdmin && activeTab === 'organization' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Organization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrganization.name}
                  onChange={(e) => setNewOrganization(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newOrganization.type}
                  onChange={(e) => setNewOrganization(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hospital">Hospital</option>
                  <option value="health_system">Health System</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrganization.adminName}
                  onChange={(e) => setNewOrganization(prev => ({ ...prev, adminName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newOrganization.adminEmail}
                  onChange={(e) => setNewOrganization(prev => ({ ...prev, adminEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Department
                </label>
                <input
                  type="text"
                  value={newOrganization.adminDepartment}
                  onChange={(e) => setNewOrganization(prev => ({ ...prev, adminDepartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter department"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={createOrganization}
                disabled={loading || !newOrganization.name || !newOrganization.adminName || !newOrganization.adminEmail}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Organization & Admin'}</span>
              </button>
            </div>
          </div>

          {/* Organizations List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Organizations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {org?.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                          org.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {org.subscription_status}
                        </span>
                        {org.trial_ends_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Trial ends: {new Date(org?.trial_ends_at)?.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {org.subscription_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org?.created_at)?.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    {/* Subscription Management */}
    {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Subscription */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isSuperAdmin ? 'Create New Subscription' : 'Current Subscription'}
            </h3>
            
            {isSuperAdmin ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSubscription.organizationId}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, organizationId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Plan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSubscription.planId}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, planId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Plan</option>
                      {subscriptionPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price_monthly}/month</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Cycle <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSubscription.billingCycle}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, billingCycle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (10% discount)</option>
                      <option value="half_yearly">Half-Yearly (15% discount)</option>
                      <option value="yearly">Yearly (20% discount)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={newSubscription.paymentMethod}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Reference
                    </label>
                    <input
                      type="text"
                      value={newSubscription.paymentReference}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, paymentReference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Invoice or transaction reference"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={createSubscription}
                    disabled={loading || !newSubscription.organizationId || !newSubscription.planId}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{loading ? 'Creating...' : 'Create Subscription'}</span>
                  </button>
                </div>
              </div>
            ) : currentSubscription ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-full ${
                        currentSubscription.status === 'active' ? 'bg-green-100 text-green-700' :
                        currentSubscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{currentSubscription.plan_name} Plan</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {currentSubscription.status} • {currentSubscription.billing_cycle} billing
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Subscription ID</div>
                      <div className="font-mono text-xs text-gray-500">{currentSubscription.id}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <div className="text-sm text-gray-600">Start Date</div>
                      <div className="font-medium text-gray-900">
                        {new Date(currentSubscription.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <div className="text-sm text-gray-600">End Date</div>
                      <div className="font-medium text-gray-900">
                        {new Date(currentSubscription.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <div className="text-sm text-gray-600">Amount Paid</div>
                      <div className="font-medium text-gray-900">
                        ${currentSubscription.amount_paid?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {currentSubscription.status === 'trial' && currentSubscription.trial_end_date && (
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                        <div className="text-sm font-medium text-yellow-800">
                          Trial ends on {new Date(currentSubscription.trial_end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        Please upgrade to a paid plan before your trial expires to avoid service interruption.
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No active subscription found.</p>
                <p className="text-sm mt-1">Contact the super admin to set up your subscription.</p>
              </div>
            )}
          </div>

          {/* Subscription Plans */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className={`border rounded-lg overflow-hidden ${
                  currentSubscription?.plan_id === plan.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}>
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${plan.price_monthly}</div>
                      <div className="text-sm text-gray-600">per month</div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div>Quarterly: ${plan.price_quarterly} (Save 10%)</div>
                      <div>Half-Yearly: ${plan.price_half_yearly} (Save 15%)</div>
                      <div>Yearly: ${plan.price_yearly} (Save 20%)</div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="text-sm font-medium text-gray-900">Features:</div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Users: {plan.features.max_users}</li>
                        <li>• Audits/month: {plan.features.max_audits_per_month}</li>
                        <li>• NICU Areas: {plan.features.max_areas}</li>
                        <li>• Audit Types: {plan.features.audit_types.length}</li>
                        <li>• Export Formats: {plan.features.export_formats.join(', ')}</li>
                        <li>• Support: {plan.features.support_level.replace('_', ' ')}</li>
                        {plan.features.white_label && <li>• White Label: Yes</li>}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 border-t border-gray-200">
                    {currentSubscription?.plan_id === plan.id ? (
                      <div className="text-center text-sm font-medium text-blue-600">Current Plan</div>
                    ) : (
                      <button
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          if (isSuperAdmin) {
                            setNewSubscription(prev => ({ ...prev, planId: plan.id }));
                            setActiveTab('subscription');
                          }
                        }}
                      >
                        {isSuperAdmin ? 'Select Plan' : 'Contact Admin to Upgrade'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription FAQ */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription FAQ</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">What happens when my trial ends?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  When your trial period ends, you'll need to upgrade to a paid plan to continue using the platform. 
                  Your data will be preserved for 30 days after trial expiration.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">How do I upgrade my subscription?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Contact our sales team or your super admin to upgrade your subscription to a different plan.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Can I change my billing cycle?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Yes, you can change your billing cycle at the end of your current billing period. 
                  Longer billing cycles offer greater discounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* NICU Areas Management */}
    {activeTab === 'areas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New NICU Area</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NICU Bay C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newArea.description}
                  onChange={(e) => setNewArea(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the area"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={createNICUArea}
                disabled={loading || !newArea.name}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Add NICU Area'}</span>
              </button>
            </div>
          </div>

          {/* NICU Areas List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">NICU Areas</h3>
            <div className="space-y-4">
              {nicuAreas.map((area) => (
                <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                  {editingArea?.id === area.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Area Name
                          </label>
                          <input
                            type="text"
                            value={editingArea.name}
                            onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editingArea.description}
                            onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingArea.is_active}
                          onChange={(e) => setEditingArea({ ...editingArea, is_active: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">Active</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateNICUArea(editingArea)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          <Save className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingArea(null)}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{area.name}</h4>
                        <p className="text-sm text-gray-600">{area.description}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          area.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {area.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingArea(area)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    {/* User Management */}
    {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auditor">Auditor</option>
                  <option value="viewer">Viewer</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NICU, Infection Control"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={createUser}
                disabled={loading || !newUser.name || !newUser.email}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create User'}</span>
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> New users will receive a temporary password "temp123!" and should change it on first login.
              </p>
            </div>
            
            {/* User Limits Warning */}
            {currentSubscription && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">
                    Subscription Plan: {currentSubscription.plan_name}
                  </p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Your current plan allows for a maximum of {
                    currentSubscription.plan_name === 'string' && 
                    subscriptionPlans.find(p => p.name === currentSubscription.plan_name)?.features?.max_users || 'unlimited'
                  } users.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
  </div>
);

};

export default Settings;
