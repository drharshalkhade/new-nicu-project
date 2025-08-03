import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  UserCheck,
} from 'lucide-react';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { useSelector } from 'react-redux';
import CreateUserModal from '../Modals/CreateUserModal';

// Role badges and icons
const roleStyles = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-blue-100 text-blue-800',
  auditor: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};
const roleIcons = {
  super_admin: <Shield className="h-4 w-4 text-red-600" />,
  admin: <UserCheck className="h-4 w-4 text-blue-600" />,
  auditor: <Edit className="h-4 w-4 text-green-600" />,
  viewer: <Eye className="h-4 w-4 text-gray-600" />,
};
const getRoleBadge = (role) => (
  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role]}`}>
    {roleIcons[role]} <span>{role.replace('_', ' ').toUpperCase()}</span>
  </span>
);

const Users = () => {
  const { hasPermission, isSuperAdmin } = useRoleBasedAccess();
  const profile = useSelector((state) => state.user.userDetails)
  const [users, setUsers] = useState([]); 
  const [authOpen, setAuthOpen] = useState(false);

  const canEditUser = (user) => {
    if (isSuperAdmin) return true;
    return (
      profile?.role === 'admin' &&
      user.role !== 'super_admin' &&
      user.role !== 'admin' &&
      user.organization === profile?.organization_id
    );
  };

  const filteredUsers = isSuperAdmin
    ? users
    : users.filter((u) => u.organization === profile?.organization_id);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and their access permissions
            {!isSuperAdmin && (
              <span className="ml-2 text-sm">
                (Organization: {profile?.organization_name || profile?.organization_id || 'N/A'})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Role Permissions */}
      <RolePermissions />

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        canEditUser={canEditUser}
        onEdit={true}
        onDelete={id => setUsers(users.filter(u => u.id !== id))}
        currentUserId={profile?.id}
      />

      {/* Organization Summary (Super Admin only) */}
      {isSuperAdmin && <OrganizationSummary users={users} />}

      <CreateUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

const RolePermissions = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          title: 'Super Admin',
          icon: <Shield className="h-5 w-5 text-red-600" />,
          description: [
            'All organizations access',
            'Full system control',
            'User management',
            'System settings',
          ],
          color: 'red',
        },
        {
          title: 'Admin',
          icon: <UserCheck className="h-5 w-5 text-blue-600" />,
          description: [
            'Organization management',
            'User management',
            'All audit types',
            'Full reports access',
          ],
          color: 'blue',
        },
        {
          title: 'Auditor',
          icon: <Edit className="h-5 w-5 text-green-600" />,
          description: [
            'Create/edit audits',
            'View all areas',
            'Export reports',
            'Limited user access',
          ],
          color: 'green',
        },
        {
          title: 'Viewer',
          icon: <Eye className="h-5 w-5 text-gray-600" />,
          description: [
            'View-only access',
            'Limited reports',
            'Export data',
            'No audit creation',
          ],
          color: 'gray',
        },
      ].map(role => (
        <div
          key={role.title}
          className={`bg-${role.color}-50 p-4 rounded-lg border border-${role.color}-200`}
        >
          <div className="flex items-center space-x-2 mb-2">
            {role.icon}
            <span className={`font-semibold text-${role.color}-900`}>{role.title}</span>
          </div>
          <ul className={`text-sm text-${role.color}-700 space-y-1`}>
            {role.description.map(line => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

const UsersTable = ({ users, canEditUser, onEdit, onDelete, currentUserId }) => (
  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Users ({users.length})</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['User', 'Role', 'Department', 'Organization', 'Status', 'Last Login', 'Actions'].map(
              heading => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === 'super_admin'
                        ? 'bg-red-600'
                        : user.role === 'admin'
                        ? 'bg-blue-600'
                        : user.role === 'auditor'
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    <span className="text-white font-medium">
                      {user.name ? user.name.toString().charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.department}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.organization}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  {canEditUser(user) && (
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canEditUser(user) && user.id !== currentUserId && (
                    <button
                      onClick={() => window.confirm('Are you sure?') && onDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const OrganizationSummary = ({ users }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Summary</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SummaryCard title="Total Organizations" count={1} color="blue" />
      <SummaryCard
        title="Active Users"
        count={users.filter(u => u.isActive).length}
        color="green"
      />
      <SummaryCard
        title="Administrators"
        count={users.filter(u => u.role === 'admin').length}
        color="purple"
      />
    </div>
  </div>
);

const SummaryCard = ({ title, count, color }) => (
  <div className={`bg-${color}-50 p-4 rounded-lg`}>
    <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
    <div className={`text-sm text-${color}-700`}>{title}</div>
  </div>
);

export default Users;
