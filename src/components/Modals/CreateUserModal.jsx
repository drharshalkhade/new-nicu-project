import React, { useState } from 'react';
import { Modal, Input, Select, Button, message } from 'antd';
import { Eye, EyeOff } from 'lucide-react';
import { useSelector } from 'react-redux';
import { signUp } from '../../utils/signUp';


const { Option } = Select;

const initialState = {
  name: '',
  hospital: '',
  department: '',
  email: '',
  password: '',
  role: 'auditor', // default
};

const CreateUserModal = ({ open, onClose }) => {
  const profile = useSelector((state) => state.user.userDetails)
  console.log("🚀 ~ CreateUserModal ~ profile:", profile)
  const [fields, setFields] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);


  const handleChange = (field, value) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validate = () => (
    !!fields.name &&
    !!fields.hospital &&
    !!fields.department &&
    !!fields.email &&
    !!fields.password &&
    !!fields.role
  );

  const handleSubmit = async (e) => {
  e?.preventDefault();
  if (!validate()) return;

  setLoading(true);

  try {
    const organization_id = profile?.organization_id;
    const userRole = fields?.role;
    const { error } = await signUp(fields.email, fields.password, {
      name: fields.name,
      organization_id,
      role: userRole,
      department: fields.department,
    });

    if (error) throw error;

    message.success('User account created successfully');

    setFields(initialState);
    setTouched({});

    if (onClose) onClose();

  } catch (err) {
    message.error(err.message || 'Failed to create user');
  } finally {
    setLoading(false);
  }
};

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={480}
      bodyStyle={{ padding: 0 }}
    >
      <form onSubmit={handleSubmit} className="bg-white p-7 rounded-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 flex items-center justify-center rounded-full h-14 w-14 mb-2">
            <svg height="28" width="28" className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center">NICU Audit Platform</h2>
          <span className="text-gray-500 text-center text-sm">Create your account</span>
        </div>

        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 font-medium mb-1">Full Name</label>
          <Input
            className={inputClass}
            placeholder="Enter your full name"
            value={fields.name}
            onChange={e => handleChange('name', e.target.value)}
            autoFocus
            onBlur={() => setTouched(p => ({ ...p, name: true }))}
          />
          {!fields.name && touched.name && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>

        {/* Hospital */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 font-medium mb-1">Hospital/Organization Name</label>
          <Input
            className={inputClass}
            placeholder="Enter hospital name"
            value={fields.hospital}
            onChange={e => handleChange('hospital', e.target.value)}
            onBlur={() => setTouched(p => ({ ...p, hospital: true }))}
          />
          {!fields.hospital && touched.hospital && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>

        {/* Department */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 font-medium mb-1">Department</label>
          <Input
            className={inputClass}
            placeholder="e.g., NICU, Infection Control"
            value={fields.department}
            onChange={e => handleChange('department', e.target.value)}
            onBlur={() => setTouched(p => ({ ...p, department: true }))}
          />
          {!fields.department && touched.department && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 font-medium mb-1">Email address</label>
          <Input
            className={inputClass}
            placeholder="Enter your email"
            type="email"
            value={fields.email}
            onChange={e => handleChange('email', e.target.value)}
            onBlur={() => setTouched(p => ({ ...p, email: true }))}
            autoComplete="email"
          />
          {!fields.email && touched.email && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>

        {/* Role dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 font-medium mb-1">Role</label>
          <Select
            className={inputClass}
            value={fields.role}
            onChange={value => handleChange('role', value)}
            style={{ width: '100%' }}
            dropdownClassName="rounded"
          >
            <Option value="auditor">Auditor</Option>
            {profile?.role === 'super_admin' && <Option value="admin">Admin</Option>}
          </Select>
        </div>
 
        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm text-gray-700 font-medium mb-1">Password</label>
          <div className="relative">
            <Input
              className={inputClass}
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={fields.password}
              onChange={e => handleChange('password', e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, password: true }))}
              autoComplete="new-password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-2.5 text-gray-500"
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {!fields.password && touched.password && <div className="text-xs text-red-600 mt-1">Required</div>}
        </div>

        {/* Submit */}
        <Button
          htmlType="submit"
          type="primary"
          block
          loading={loading}
          disabled={!validate()}
          className="bg-blue-600 hover:bg-blue-700 border-0 rounded transition-colors font-semibold text-lg py-2"
        >
          Create Account
        </Button>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
