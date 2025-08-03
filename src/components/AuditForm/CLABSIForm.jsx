import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { Form, Input, Select, Radio, Button, message, Spin } from 'antd';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { supabase } from '../../lib/supabaseClient';
import { useSelector } from 'react-redux';
import { calculateCLABSICompliance, getComplianceLevel } from '../../utils/complianceCalculation';

const { Option } = Select;

const CLABSIForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const profile = useSelector(state => state.user.userDetails);

  const [nicuAreas, setNicuAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    insertion: false,
    maintenance: false,
    removal: false,
  });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchNicuAreas();
    console.log(expandedSections)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNicuAreas = async () => {
    if (!profile?.organization_id) {
      setNicuAreas([]);
      return;
    }
    try {
      setLoadingAreas(true);
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
      setLoadingAreas(false);
    }
  };

  // const toggleSection = section => {
  //   setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  // };

  // const calculateCompliance = (values) => {
  //   const result = calculateCLABSICompliance(values);
  //   return result.score / 100;
  // };

  const onBundleChange = val => {
    form.setFieldsValue({ bundleChecklist: val });
    setExpandedSections({
      insertion: val === 'Insertion Bundle',
      maintenance: val === 'Maintenance Bundle',
      removal: val === 'Removal Bundle',
    });
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const auditData = {
        type: 'clabsi',
        patientName: values.patientName,
        nicuAreaId: values.nicuAreaId,
        staffName: values.staffName,
        bundleType: values.bundleChecklist,
        bundleData: values,
      };

      await createAudit(auditData);
      setSubmitStatus('success');
      message.success('Audit saved successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      setSubmitStatus('error', error);
      message.error('Error saving audit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine compliance level for display
  const formValues = form.getFieldsValue();
  const compliance = calculateCLABSICompliance(formValues);
  const complianceLevel = getComplianceLevel(compliance.score);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                onClick={() => navigate('/audit')}
                icon={<ArrowLeft className="h-5 w-5" />}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CLABSI Checklist</h1>
                <p className="text-gray-600 mt-1">
                  Central Line-Associated Bloodstream Infection Prevention
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                complianceLevel.color === 'green'
                  ? 'bg-green-100 text-green-800'
                  : complianceLevel.color === 'yellow'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {compliance.score.toFixed(1)}% Compliance
            </div>
          </div>
        </div>

        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          className="p-6 space-y-6"
          initialValues={{
            bundleChecklist: '',
          }}
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              label="Patient Name"
              name="patientName"
              rules={[{ required: true, message: 'Please enter patient name' }]}
            >
              <Input placeholder="Enter patient name" />
            </Form.Item>

            <Form.Item label="Staff Name" name="staffName">
              <Input placeholder="Enter staff name" />
            </Form.Item>

            <Form.Item
              label="NICU Area"
              name="nicuAreaId"
              rules={[{ required: true, message: 'Please select NICU area' }]}
            >
              {loadingAreas ? (
                <Spin />
              ) : (
                <Select placeholder="Select NICU Area" allowClear>
                  {nicuAreas.map(area => (
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
            label="Bundle Checklist"
            name="bundleChecklist"
            rules={[{ required: true, message: 'Please select a bundle checklist' }]}
          >
            <Radio.Group onChange={e => onBundleChange(e.target.value)}>
              {['Insertion Bundle', 'Maintenance Bundle', 'Removal Bundle'].map(bundle => (
                <Radio key={bundle} value={bundle}>
                  {bundle}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          {/* Insert the rest of your form fields here as necessary */}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {submitStatus === 'success' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Audit saved successfully!</span>
                </>
              )}
              {submitStatus === 'error' && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Error saving audit. Please try again.</span>
                </>
              )}
            </div>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Save className="mr-2" /> Save Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CLABSIForm;
