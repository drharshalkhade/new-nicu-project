import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  calculateVAPCompliance,
  getComplianceLevel,
} from '../../utils/complianceCalculation';
import {
  Form,
  Input,
  Select,
  Radio,
  Button,
  Spin,
  message,
} from 'antd';
import { useAuth } from '../../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import BundleSection from '../common-components/BundleSection';
import ComplianceDisplay from '../common-components/ComplianceDisplay';

const { Option } = Select;

const bundleFields = {
  intubationBundle: [
    { key: 'preSuppliesArranged', label: 'Supplies Arranged' },
    { key: 'preIndication', label: 'Indication' },
    { key: 'preEmergencyElective', label: 'Emergency/Elective' },
    { key: 'preETSize', label: 'ET Tube Size' },
    { key: 'preETDepth', label: 'ET Tube Depth' },
    { key: 'procWearMask', label: 'Wear Mask/Gloves' },
    { key: 'procHandWash', label: 'Hand Wash' },
    { key: 'procAseptic', label: 'Aseptic Precautions' },
    { key: 'procAppropriateSteps', label: 'Appropriate Steps' },
  ],
  reintubationBundle: [
    { key: 'reintubationReason', label: 'Reason for Re-intubation' },
    { key: 'reintubationChecklist', label: 'Checklist Used' },
  ],
  maintenanceBundle: [
    { key: 'maintenanceCircuitChange', label: 'Circuit Change' },
    { key: 'maintenanceHumidification', label: 'Humidification' },
    { key: 'maintenanceSuction', label: 'Suction' },
    { key: 'maintenanceChecklist', label: 'Checklist Used' },
  ],
  etSuctionBundle: [
    { key: 'etSuctionIndication', label: 'Indication' },
    { key: 'etSuctionSterility', label: 'Sterility Maintained' },
    { key: 'etSuctionChecklist', label: 'Checklist Used' },
  ],
  extubationBundle: [
    { key: 'extubationReadiness', label: 'Readiness Assessed' },
    { key: 'extubationChecklist', label: 'Checklist Used' },
  ],
  postExtubationBundle: [
    { key: 'postExtubationSupport', label: 'Support Provided' },
    { key: 'postExtubationChecklist', label: 'Checklist Used' },
  ],
};

const bundleOptions = [
  { key: 'intubationBundle', label: 'Intubation Bundle' },
  { key: 'reintubationBundle', label: 'Re-intubation Bundle' },
  { key: 'maintenanceBundle', label: 'Maintenance Bundle' },
  { key: 'etSuctionBundle', label: 'ET Suction Bundle' },
  { key: 'extubationBundle', label: 'Extubation Bundle' },
  { key: 'postExtubationBundle', label: 'Post Extubation Bundle' },
];

const VAPForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [form] = Form.useForm();
  const [visibleSection, setVisibleSection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const handleBundleSelection = (val) => {
    setVisibleSection(val);
    form.setFieldsValue({ bundleSelection: val });
    setTimeout(() => {
      const el = document.getElementById(val);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      const complianceData = calculateVAPCompliance(values);
      const auditRecord = {
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        observerId: user?.id || 'unknown',
        observerName: user?.name || 'Unknown Observer',
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuAreas)?.name || 'Unknown Area',
        nicuAreasId: values.nicuAreas,
        bundleSelection: values.bundleSelection,
        compliance: complianceData.score / 100,
        notes: `VAP Audit - ${values.bundleSelection} - Patient: ${values.patientName}`,
        patientName: values.patientName,
        staffName: values.staffName,
        vapData: values,
        auditType: 'VAP',
      };
      await createAudit(auditRecord);
      setShowSuccess(true);
      message.success('VAP Audit submitted successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting audit:', err);
      message.error('Failed to submit audit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-green-50 border border-green-200 rounded-lg p-10 text-center">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
          <h2 className="text-2xl font-semibold text-green-900 mb-3">VAP Audit Submitted Successfully</h2>
          <p className="text-green-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const formValues = form.getFieldsValue();
  const complianceData = calculateVAPCompliance(formValues);
  const complianceLevel = getComplianceLevel(complianceData.score);
  const isLow = complianceData.score < 80;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ bundleSelection: '', nicuAreas: '' }}
          scrollToFirstError
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-6 flex items-center space-x-4 text-white">
            <Button
              type="text"
              icon={<ArrowLeft />}
              onClick={() => navigate('/audit')}
              aria-label="Back to audit list"
              className="text-white"
            />
            <div>
              <h1 className="text-2xl font-semibold">VAP Audit</h1>
              <p className="text-green-200 text-sm">2025 - Ventilator-Associated Pneumonia Prevention</p>
            </div>
            <div className="ml-auto bg-green-800 rounded-full px-3 py-1 font-semibold text-lg">
              {complianceData.score.toFixed(1)}%
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Patient Info & NICU Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Patient Name"
                name="patientName"
                rules={[{ required: true, message: 'Please enter patient name' }]}
              >
                <Input placeholder="Enter patient name" />
              </Form.Item>
              <Form.Item
                label="Staff Name"
                name="staffName"
              >
                <Input placeholder="Enter staff name" />
              </Form.Item>
              <Form.Item
                label="NICU Area"
                name="nicuAreas"
                rules={[{ required: true, message: 'Please select NICU area' }]}
              >
                {loadingAreas ? (
                  <Spin />
                ) : (
                  <Select placeholder="Select NICU Area" showSearch optionFilterProp="children" allowClear>
                    {nicuAreas.map((area) => (
                      <Option key={area.id} value={area.id}>
                        {area.name}
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </div>

            {/* Bundle Selection */}
            <Form.Item
              label="Bundle Selection"
              name="bundleSelection"
              rules={[{ required: true, message: 'Please select a bundle' }]}
            >
              <Radio.Group onChange={(e) => handleBundleSelection(e.target.value)}>
                {bundleOptions.map(({ key, label }) => (
                  <Radio.Button key={key} value={key} className="mb-2">
                    {label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            {/* Dynamic Bundle Sections - use BundleSection component */}
            {visibleSection && bundleFields[visibleSection] && (
              <BundleSection
                id={visibleSection}
                title={bundleOptions.find(opt => opt.key === visibleSection)?.label || ''}
                fields={bundleFields[visibleSection]}
              />
            )}

            {/* Compliance Display */}
            {visibleSection && (
              <ComplianceDisplay
                complianceScore={complianceData.score}
                complianceLevel={complianceLevel}
                totalFields={complianceData.totalFields}
                completedFields={complianceData.completedFields}
                lowCompliance={isLow}
              />
            )}

            {/* Submit Buttons */}
            <div className="flex justify-between">
              <Button onClick={scrollToTop} type="default">Back to Top</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={isSubmitting || !visibleSection}
              >
                Submit
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default VAPForm;
