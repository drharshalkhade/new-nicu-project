import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  UserCheck,
  AlertTriangle,
  Building,
  Users as UsersIcon,
} from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { useHierarchy } from '../../hooks/useHierarchy';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  message, 
  Card, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Tooltip,
  Badge
} from 'antd';
import CreateUserModal from '../Modals/CreateUserModal';
import { deleteUser } from '../../store/user/userThunk';

// Role badges and icons
const roleStyles = {
  super_admin: 'bg-red-100 text-red-800',
  hospital_admin: 'bg-blue-100 text-blue-800',
  auditor: 'bg-green-100 text-green-800',
};

const roleIcons = {
  super_admin: <Shield className="h-4 w-4 text-red-600" />,
  hospital_admin: <UserCheck className="h-4 w-4 text-blue-600" />,
  auditor: <Edit className="h-4 w-4 text-green-600" />,
};

const getRoleBadge = (role) => {
  const getRoleLabel = (role) => {
    switch (role) {
      case 'hospital_admin':
        return 'ADMIN';
      case 'super_admin':
        return 'SUPER ADMIN';
      case 'auditor':
        return 'AUDITOR';
      default:
        return role.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role]}`}>
      <span className="hidden sm:inline">{roleIcons[role]}</span>
      <span className="text-xs sm:text-xs">{getRoleLabel(role)}</span>
    </span>
  );
};

const Users = () => {
  const { hasPermission, isSuperAdmin } = useRoleBasedAccess();
  const {
    userDetails,
    users,
    loading,
    error,
    isDemo,
    canCreateUser,
    canViewUserData,
    canEditUser,
    canDeleteUser,
    getAdmins,
    getAuditors,
    getUsersUnderAdmin,
  } = useHierarchy();
  
  const dispatch = useDispatch();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      message.success({
        content: (
          <div>
            <div>User deleted successfully!</div>
            <div className="mt-1 text-xs text-gray-500">
              User has been deactivated and removed from the system. 
              They will no longer be able to access the application.
            </div>
          </div>
        ),
        duration: 5,
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      message.error('Failed to delete user: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      responsive: ['md'],
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name || record.email}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
          {record.is_demo && (
            <Badge count="DEMO" style={{ backgroundColor: '#52c41a' }} />
          )}
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      responsive: ['sm'],
      render: (_, record) => getRoleBadge(record.role),
    },
    {
      title: 'Organization',
      key: 'organization',
      responsive: ['lg'],
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.organizations?.name || 'N/A'}</div>
          {record.hospitals?.name && (
            <div className="text-sm text-gray-500">{record.hospitals.name}</div>
          )}
          {record.nicu_areas?.name && (
            <div className="text-sm text-gray-500">{record.nicu_areas.name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Created By',
      key: 'created_by',
      responsive: ['xl'],
      render: (_, record) => {
        if (record.created_by === userDetails?.id) {
          return <span className="text-blue-600">You</span>;
        }
        const creator = users.find(u => u.id === record.created_by);
        return creator ? creator.name || creator.email : 'N/A';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {canEditUser(record.id) && (
            <Tooltip title="Edit User">
              <Button
                type="text"
                size="small"
                icon={<Edit className="h-3 w-3 sm:h-4 sm:w-4" />}
                onClick={() => {
                  setSelectedUser(record);
                  setCreateModalOpen(true);
                }}
              />
            </Tooltip>
          )}
          {canDeleteUser(record.id) && (
            <Tooltip title="Delete User">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                onClick={() => {
                  setSelectedUser(record);
                  setDeleteModalOpen(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission('canManageUsers')) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You don't have permission to manage users. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const admins = getAdmins();
  const auditors = getAuditors();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage users and their access permissions
            {!isSuperAdmin && (
              <span className="block sm:inline sm:ml-2 text-sm">
                (Organization: {userDetails?.organizations?.name || 'N/A'})
              </span>
            )}
            {isDemo && (
              <span className="block sm:inline sm:ml-2 text-sm text-orange-600">
                (Demo Environment)
              </span>
            )}
          </p>
        </div>
        {(canCreateUser('hospital_admin') || canCreateUser('auditor')) && (
          <Button
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Add User
          </Button>
        )}
      </div>

      {/* Demo Environment Alert */}
      {isDemo && (
        <Alert
          message="Demo Environment"
          description="You are currently in a demo environment. All data and users created here are isolated from the main system."
          type="info"
          showIcon
          icon={<AlertTriangle />}
        />
      )}

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={<span className="text-sm sm:text-base">Total Users</span>}
              value={users.length}
              prefix={<UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
              valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={<span className="text-sm sm:text-base">Admins</span>}
              value={admins.length}
              prefix={<UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
              valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={<span className="text-sm sm:text-base">Auditors</span>}
              value={auditors.length}
              prefix={<Edit className="h-4 w-4 sm:h-5 sm:w-5" />}
              valueStyle={{ fontSize: '1.5rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={<span className="text-sm sm:text-base">Organization</span>}
              value={userDetails?.organizations?.name || 'N/A'}
              prefix={<Building className="h-4 w-4 sm:h-5 sm:w-5" />}
              valueStyle={{ fontSize: '1rem', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Hierarchy Information */}
      {userDetails?.role === 'hospital_admin' && (
        <Card title="Your Team" className="bg-blue-50">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-900">Auditors Under You:</h4>
              <div className="mt-2 space-y-2">
                {getUsersUnderAdmin(userDetails.id).map(user => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm">{user.name || user.email}</span>
                    <div className="flex-shrink-0">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                ))}
                {getUsersUnderAdmin(userDetails.id).length === 0 && (
                  <p className="text-sm text-gray-500">No auditors assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card title="Users">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} users`,
              responsive: true,
              size: 'small',
            }}
            size="small"
          />
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{user.name || user.email}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      {user.is_demo && (
                        <Badge count="DEMO" style={{ backgroundColor: '#52c41a' }} />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Organization:</span> {user.organizations?.name || 'N/A'}
                    </div>
                    {user.hospitals?.name && (
                      <div>
                        <span className="font-medium">Hospital:</span> {user.hospitals.name}
                      </div>
                    )}
                    {user.nicu_areas?.name && (
                      <div>
                        <span className="font-medium">NICU Area:</span> {user.nicu_areas.name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created by:</span> {
                        user.created_by === userDetails?.id 
                          ? 'You' 
                          : users.find(u => u.id === user.created_by)?.name || 'N/A'
                      }
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                    {canEditUser(user.id) && (
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => {
                          setSelectedUser(user);
                          setCreateModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDeleteUser(user.id) && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteModalOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit User Modal */}
      <CreateUserModal
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        canCreateUser={canCreateUser}
        isDemo={isDemo}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete User"
        open={deleteModalOpen}
        onOk={() => handleDeleteUser(selectedUser?.id)}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        okText="Delete User"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete user{' '}
            <strong>{selectedUser?.name || selectedUser?.email}</strong>?
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">What happens when you delete a user:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• User account will be deactivated immediately</li>
              <li>• User will no longer be able to log in to the system</li>
              <li>• All user data will be preserved for audit purposes</li>
              <li>• User will be removed from all user lists and reports</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500">
            This action cannot be undone. The user will need to be recreated if access is needed again.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
