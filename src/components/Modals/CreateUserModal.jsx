import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, message, Form, Alert } from 'antd';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { createUser, updateUser } from '../../store/user/userThunk';
import { useHierarchy } from '../../hooks/useHierarchy';

const { Option } = Select;

const CreateUserModal = ({ open, onCancel, user, canCreateUser, isDemo }) => {
  const dispatch = useDispatch();
  const { userDetails, loading: hierarchyLoading } = useHierarchy();
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode
        form.setFieldsValue({
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'auditor',
          hospital_id: user.hospital_id || '',
          nicu_area_id: user.nicu_area_id || '',
        });
      } else {
        // Create mode
        form.resetFields();
        form.setFieldsValue({
          role: 'auditor', // default role
        });
      }
    }
  }, [open, user, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (user) {
        // Update existing user
        await dispatch(updateUser({
          userId: user.id,
          updates: {
            name: values.name,
            role: values.role,
            hospital_id: values.hospital_id,
            nicu_area_id: values.nicu_area_id,
          }
        })).unwrap();
        message.success('User updated successfully');
        onCancel();
      } else {
        // Create new user
        const userData = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          hospital_id: values.hospital_id,
          nicu_area_id: values.nicu_area_id,
        };
        
        const newUser = await dispatch(createUser(userData)).unwrap();
        message.success({
          content: `User "${newUser.name}" created successfully!`,
          duration: 3,
          style: {
            marginTop: '20vh',
          },
        });
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      message.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    const roles = [];
    
    if (canCreateUser('hospital_admin')) {
      roles.push({ value: 'hospital_admin', label: 'Admin' });
    }
    
    if (canCreateUser('auditor')) {
      roles.push({ value: 'auditor', label: 'Auditor' });
    }
    
    return roles;
  };

  // Get available hospitals (for super admin)
  const getAvailableHospitals = () => {
    // This would come from your hospital data
    // For now, using the current user's hospital
    if (userDetails?.hospital_id) {
      return [{ value: userDetails.hospital_id, label: userDetails.hospitals?.name || 'Current Hospital' }];
    }
    return [];
  };

  // Get available NICU areas
  const getAvailableNicuAreas = () => {
    // This would come from your NICU areas data
    // For now, using the current user's NICU area
    if (userDetails?.nicu_area_id) {
      return [{ value: userDetails.nicu_area_id, label: userDetails.nicu_areas?.name || 'Current NICU Area' }];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();
  const availableHospitals = getAvailableHospitals();
  const availableNicuAreas = getAvailableNicuAreas();

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={
        <div className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>{user ? 'Edit User' : 'Create New User'}</span>
        </div>
      }
      width={600}
      destroyOnClose
    >
      {isDemo && (
        <Alert
          message="Demo Environment"
          description="This user will be created in the demo environment and will not be visible to super admins."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          role: 'auditor',
        }}
      >
        {/* Full Name */}
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        {/* Email (only for new users) */}
        {!user && (
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
        )}

        {/* Password (only for new users) */}
        {!user && (
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              placeholder="Enter password"
              iconRender={(visible) => (visible ? <Eye /> : <EyeOff />)}
            />
          </Form.Item>
        )}

        {/* Role */}
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select placeholder="Select role">
            {availableRoles.map(role => (
              <Option key={role.value} value={role.value}>
                {role.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Hospital (only for super admin) */}
        {userDetails?.role === 'super_admin' && availableHospitals.length > 0 && (
          <Form.Item
            label="Hospital"
            name="hospital_id"
            rules={[{ required: true, message: 'Please select a hospital' }]}
          >
            <Select placeholder="Select hospital">
              {availableHospitals.map(hospital => (
                <Option key={hospital.value} value={hospital.value}>
                  {hospital.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* NICU Area */}
        {availableNicuAreas.length > 0 && (
          <Form.Item
            label="NICU Area"
            name="nicu_area_id"
          >
            <Select placeholder="Select NICU area (optional)">
              {availableNicuAreas.map(area => (
                <Option key={area.value} value={area.value}>
                  {area.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Form Actions */}
        <Form.Item className="mb-0">
          <div className="flex justify-end space-x-2">
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
