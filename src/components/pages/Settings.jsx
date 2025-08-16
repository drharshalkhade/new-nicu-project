import { useState, useEffect, useRef } from 'react';
import { Building, CreditCard, MapPin, Plus, Settings as SettingsIcon, Users, Save, X, Edit } from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { supabase } from '../../lib/supabaseClient';
import { signUp } from '../../utils/signUp';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import { Card, Button, Form, Input, Select, Checkbox, Table, Tag, Space, Modal, message, Spin, Alert, Tabs } from 'antd';
import InputField from '../common-components/InputFields';

const { TabPane } = Tabs;
const { Option } = Select;

const Settings = () => {
  const { hasPermission, isSuperAdmin } = useRoleBasedAccess();
  const profile = useSelector((state) => state.user.userDetails);
  const dispatch = useDispatch();
  
  // Redux state for NICU areas
  const { areas: nicuAreas, loading: nicuAreasLoading, error: nicuAreasError } = useSelector((state) => state.nicuArea);

  const [activeTab, setActiveTab] = useState('organization');
  const [organizations, setOrganizations] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingArea, setEditingArea] = useState(null);
  const dataFetchedRef = useRef(false);

  // Ant Design form instances
  const [organizationForm] = Form.useForm();
  const [areaForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [subscriptionForm] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && !nicuAreasLoading && nicuAreas.length === 0) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    if (hasPermission?.('canManageSettings') && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchData();
    }

    return () => {
      dataFetchedRef.current = false;
    };
  }, []);


  const fetchData = async () => {
    if (loading) return; // Prevent concurrent calls
    
    try {
      setLoading(true);
      setError(null);

      const promises = [];
      
      if (isSuperAdmin) {
        promises.push(fetchOrganizations());
      }
      promises.push(fetchSubscriptionPlans());
      
      if (!isSuperAdmin && profile?.organization_id) {
        promises.push(fetchCurrentSubscription(profile.organization_id));
      }

      await Promise.all(promises);
    } catch (err) {
      setError('Failed to load settings data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');
      
      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setSubscriptionPlans([]);
    }
  };

  const fetchCurrentSubscription = async (organizationId) => {
    if (!organizationId) return;
    
    try {
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
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const createOrganization = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: values.name,
          type: values.type,
          subscription_tier: 'starter'
        })
        .select()
        .single();
      
      if (orgError) throw orgError;

      // Generate a secure temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + '!1';
      
      const { error: signUpError } = await signUp(
        values.adminEmail,
        tempPassword,
        {
          name: values.adminName,
          organization_id: orgData.id,
          role: 'hospital_admin',
          department: values.adminDepartment
        }
      );
      
      if (signUpError) throw signUpError;

      message.success({
        content: (
          <div>
            <div>Organization "{values.name}" and admin account created successfully!</div>
            <div className="mt-2 text-sm">
              <strong>Temporary password for {values.adminEmail}:</strong> {tempPassword}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Please share this password with the admin. They should change it on first login.
            </div>
          </div>
        ),
        duration: 10,
        style: {
          marginTop: '20vh',
        },
      });
      organizationForm.resetFields();
      await fetchOrganizations();
    } catch (err) {
      message.error(err?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', values.planId)
        .single();

      if (planError) throw planError;

      const { error } = await supabase
        .rpc('upgrade_subscription', {
          org_id: values.organizationId,
          plan_name: plan.name,
          billing_cycle: values.billingCycle,
          payment_method: values.paymentMethod,
          payment_reference: values.paymentReference
        });

      if (error) throw error;

      message.success(`Subscription created successfully for plan "${plan.name}"!`);
      subscriptionForm.resetFields();
      await fetchOrganizations();
      if (profile?.organization_id === values.organizationId) {
        await fetchCurrentSubscription(profile.organization_id);
      }
    } catch (err) {
      message.error(err?.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const createNICUArea = async (values) => {
    if (!profile?.organization_id) {
      message.error('Organization ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('nicu_areas')
        .insert({
          organization_id: profile.organization_id,
          name: values.name,
          description: values.description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      message.success(`NICU Area "${values.name}" created successfully!`);
      areaForm.resetFields();
      // Refresh NICU areas from Redux
      dispatch(fetchNicuAreas(profile.organization_id));
    } catch (err) {
      message.error(err?.message || 'Failed to create NICU area');
    } finally {
      setLoading(false);
    }
  };

  const updateNICUArea = async (area) => {
    if (!area?.id) {
      message.error('Invalid area data');
      return;
    }

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

      message.success(`NICU Area "${area.name}" updated successfully!`);
      setEditingArea(null);
      // Refresh NICU areas from Redux
      dispatch(fetchNicuAreas(profile.organization_id));
    } catch (err) {
      message.error(err?.message || 'Failed to update NICU area');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (values) => {
    if (!profile?.organization_id) {
      message.error('Organization ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await signUp(
        values.email,
        'temp123!',
        {
          name: values.name,
          organization_id: profile.organization_id,
          role: values.role,
          department: values.department
        }
      );

      if (error) throw error;

      message.success(`User "${values.name}" created successfully!`);
      userForm.resetFields();
    } catch (err) {
      message.error(err?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Organization table columns
  const organizationColumns = [
    {
      title: 'Organization',
      dataIndex: 'name',
      key: 'name',
      responsive: ['md'],
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      responsive: ['sm'],
      render: (type) => (
        <Tag color="blue">{type?.replace('_', ' ') || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'subscription_status',
      key: 'subscription_status',
      responsive: ['lg'],
      render: (status) => {
        const color = status === 'active' ? 'green' : status === 'trial' ? 'blue' : 'red';
        return <Tag color={color}>{status || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Subscription',
      dataIndex: 'subscription_tier',
      key: 'subscription_tier',
      responsive: ['xl'],
      render: (tier) => <Tag color="green">{tier || 'N/A'}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      responsive: ['lg'],
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
  ];

  if (!hasPermission?.('canManageSettings')) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <div className="text-center">
            <SettingsIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h2>
            <p className="text-yellow-700">
              You don't have permission to access settings. Please contact your administrator.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading && !organizations.length && !nicuAreas.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage {isSuperAdmin ? 'organizations, users, and system' : 'organization'} settings
        </p>
      </div>

      {/* Error Messages */}
      {nicuAreasError && (
        <Alert
          message="Error"
          description={nicuAreasError}
          type="error"
          showIcon
          closable
        />
      )}

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="settings-tabs"
        size="small"
      >
        {/* Organization Management (Super Admin Only) */}
        {isSuperAdmin && (
          <TabPane tab={<span><Building className="h-4 w-4 inline mr-1 sm:mr-2" />Organizations</span>} key="organization">
            <div className="space-y-6">
              <Card title="Create New Organization" className="mb-6">
                <Form
                  form={organizationForm}
                  layout="vertical"
                  onFinish={createOrganization}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <InputField
                      label="Organization Name"
                      name="name"
                      required
                      placeholder="Enter organization name"
                    />
                    <InputField
                      label="Organization Type"
                      name="type"
                      type="select"
                      required
                      options={[
                        { value: 'hospital', label: 'Hospital' },
                        { value: 'health_system', label: 'Health System' },
                        { value: 'clinic', label: 'Clinic' },
                      ]}
                    />
                    <InputField
                      label="Admin Name"
                      name="adminName"
                      required
                      placeholder="Enter admin full name"
                    />
                    <InputField
                      label="Admin Email"
                      name="adminEmail"
                      type="email"
                      required
                      placeholder="Enter admin email"
                    />
                    <InputField
                      label="Admin Department"
                      name="adminDepartment"
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Create Organization & Admin
                    </Button>
                  </div>
                </Form>
              </Card>

              <Card title="Existing Organizations">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table
                    dataSource={organizations}
                    columns={organizationColumns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 800 }}
                    size="small"
                  />
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading organizations...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {organizations.map((org) => (
                        <div key={org.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{org.name}</h3>
                              <p className="text-sm text-gray-500">{org.type?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Tag color="blue">{org.type?.replace('_', ' ') || 'N/A'}</Tag>
                              {org.subscription_status && (
                                <Tag color={org.subscription_status === 'active' ? 'green' : org.subscription_status === 'trial' ? 'blue' : 'red'}>
                                  {org.subscription_status}
                                </Tag>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {org.subscription_tier && (
                              <div>
                                <span className="font-medium">Subscription:</span> {org.subscription_tier}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Created:</span> {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {organizations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No organizations found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabPane>
        )}

        {/* NICU Areas Management */}
        <TabPane tab={<span><MapPin className="h-4 w-4 inline mr-1 sm:mr-2" />NICU Areas</span>} key="areas">
          <div className="space-y-6">
            <Card title="Add New NICU Area" className="mb-6">
              <Form
                form={areaForm}
                layout="vertical"
                onFinish={createNICUArea}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <InputField
                    label="Area Name"
                    name="name"
                    required
                    placeholder="e.g., NICU Bay C"
                  />
                  <InputField
                    label="Description"
                    name="description"
                    placeholder="Brief description of the area"
                  />
                </div>
                <div className="mt-6">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add NICU Area
                  </Button>
                </div>
              </Form>
            </Card>

            <Card title="NICU Areas">
              <div className="space-y-4">
                {nicuAreasLoading ? (
                  <div className="text-center py-8">
                    <Spin />
                  </div>
                ) : (
                  nicuAreas?.map((area) => (
                    <Card key={area?.id} size="small" className="mb-4">
                      {editingArea?.id === area?.id ? (
                        <Form
                          initialValues={editingArea}
                          onFinish={(values) => updateNICUArea({ ...editingArea, ...values })}
                          layout="vertical"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                              label="Area Name"
                              name="name"
                              required
                            />
                            <InputField
                              label="Description"
                              name="description"
                            />
                          </div>
                          <Form.Item name="is_active" valuePropName="checked">
                            <Checkbox>Active</Checkbox>
                          </Form.Item>
                          <Space>
                            <Button type="primary" htmlType="submit" loading={loading} icon={<Save className="h-3 w-3" />}>
                              Save
                            </Button>
                            <Button onClick={() => setEditingArea(null)} icon={<X className="h-3 w-3" />}>
                              Cancel
                            </Button>
                          </Space>
                        </Form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{area?.name}</h4>
                            <p className="text-sm text-gray-600">{area?.description}</p>
                            <Tag color={area?.is_active ? 'green' : 'red'} className="mt-1">
                              {area?.is_active ? 'Active' : 'Inactive'}
                            </Tag>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => setEditingArea(area)}
                              icon={<Edit className="h-3 w-3" />}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabPane>

        {/* User Management */}
        <TabPane tab={<span><Users className="h-4 w-4 inline mr-1 sm:mr-2" />Users</span>} key="users">
          <Card title="Add New User" className="mb-6">
            <Form
              form={userForm}
              layout="vertical"
              onFinish={createUser}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Full Name"
                  name="name"
                  required
                  placeholder="Enter full name"
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter email address"
                />
                <InputField
                  label="Role"
                  name="role"
                  type="select"
                  required
                  options={[
                    { value: 'auditor', label: 'Auditor' },
                    { value: 'viewer', label: 'Viewer' },
                    ...(isSuperAdmin ? [{ value: 'admin', label: 'Admin' }] : []),
                  ]}
                />
                <InputField
                  label="Department"
                  name="department"
                  placeholder="e.g., NICU, Infection Control"
                />
              </div>
              <div className="mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Create User
                </Button>
              </div>
            </Form>

            <Alert
              message="Note"
              description="New users will receive a temporary password 'temp123!' and should change it on first login."
              type="warning"
              showIcon
              className="mt-4"
            />
          </Card>
        </TabPane>

        {/* Subscription Management */}
        <TabPane tab={<span><CreditCard className="h-4 w-4 inline mr-1 sm:mr-2" />Subscription</span>} key="subscription">
          <div className="space-y-6">
            <Card title={isSuperAdmin ? 'Create New Subscription' : 'Current Subscription'}>
              {isSuperAdmin ? (
                <Form
                  form={subscriptionForm}
                  layout="vertical"
                  onFinish={createSubscription}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Organization"
                      name="organizationId"
                      type="select"
                      required
                      placeholder="Select Organization"
                      options={organizations?.map(org => ({ value: org?.id, label: org?.name }))}
                    />
                    <InputField
                      label="Subscription Plan"
                      name="planId"
                      type="select"
                      required
                      placeholder="Select Plan"
                      options={subscriptionPlans?.map(plan => ({ 
                        value: plan?.id, 
                        label: `${plan?.name} - $${plan?.price_monthly}/month` 
                      }))}
                    />
                    <InputField
                      label="Billing Cycle"
                      name="billingCycle"
                      type="select"
                      required
                      options={[
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly (10% discount)' },
                        { value: 'half_yearly', label: 'Half-Yearly (15% discount)' },
                        { value: 'yearly', label: 'Yearly (20% discount)' },
                      ]}
                    />
                    <InputField
                      label="Payment Method"
                      name="paymentMethod"
                      type="select"
                      options={[
                        { value: 'credit_card', label: 'Credit Card' },
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'paypal', label: 'PayPal' },
                      ]}
                    />
                    <InputField
                      label="Payment Reference"
                      name="paymentReference"
                      placeholder="Invoice or transaction reference"
                    />
                  </div>
                  <div className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Create Subscription
                    </Button>
                  </div>
                </Form>
              ) : currentSubscription ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${
                          currentSubscription?.status === 'active' ? 'bg-green-100 text-green-700' :
                          currentSubscription?.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{currentSubscription?.plan_name} Plan</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {currentSubscription?.status} • {currentSubscription?.billing_cycle} billing
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Subscription ID</div>
                        <div className="font-mono text-xs text-gray-500">{currentSubscription?.id}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm text-gray-600">Start Date</div>
                        <div className="font-medium text-gray-900">
                          {currentSubscription?.start_date ? new Date(currentSubscription.start_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm text-gray-600">End Date</div>
                        <div className="font-medium text-gray-900">
                          {currentSubscription?.end_date ? new Date(currentSubscription.end_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm text-gray-600">Amount Paid</div>
                        <div className="font-medium text-gray-900">
                          ${currentSubscription?.amount_paid?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {currentSubscription?.status === 'trial' && currentSubscription?.trial_end_date && (
                      <Alert
                        message="Trial Period"
                        description={`Trial ends on ${new Date(currentSubscription.trial_end_date).toLocaleDateString()}. Please upgrade to a paid plan before your trial expires to avoid service interruption.`}
                        type="warning"
                        showIcon
                        className="mb-4"
                      />
                    )}
                    
                    <div className="flex justify-end">
                      <Button type="primary">
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No active subscription found.</p>
                  <p className="text-sm mt-1">Contact the super admin to set up your subscription.</p>
                </div>
              )}
            </Card>

            {/* Subscription Plans */}
            <Card title="Available Subscription Plans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans?.map((plan) => (
                  <Card key={plan?.id} className={`${
                    currentSubscription?.plan_id === plan?.id ? 'border-blue-500 ring-2 ring-blue-200' : ''
                  }`}>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">{plan?.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{plan?.description}</p>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-900">${plan?.price_monthly}</div>
                        <div className="text-sm text-gray-600">per month</div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div>Quarterly: ${plan?.price_yearly ? (plan.price_yearly / 4).toFixed(2) : 'N/A'} (Save 10%)</div>
                        <div>Half-Yearly: ${plan?.price_yearly ? (plan.price_yearly / 2).toFixed(2) : 'N/A'} (Save 15%)</div>
                        <div>Yearly: ${plan?.price_yearly} (Save 20%)</div>
                      </div>
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">Features:</div>
                        <ul className="space-y-1 text-sm text-gray-600 text-left">
                          <li>• Users: {plan?.max_users || 'Unlimited'}</li>
                          <li>• Audits/month: {plan?.max_audits_per_month || 'Unlimited'}</li>
                          <li>• Organizations: {plan?.max_organizations || 'Unlimited'}</li>
                          <li>• Support: {plan?.features?.support_level?.replace('_', ' ') || 'Email'}</li>
                        </ul>
                      </div>
                      <div className="mt-4">
                        {currentSubscription?.plan_id === plan?.id ? (
                          <Tag color="blue">Current Plan</Tag>
                        ) : (
                          <Button
                            type="primary"
                            onClick={() => {
                              if (isSuperAdmin) {
                                subscriptionForm.setFieldsValue({ planId: plan?.id });
                                setActiveTab('subscription');
                              }
                            }}
                          >
                            {isSuperAdmin ? 'Select Plan' : 'Contact Admin to Upgrade'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;
