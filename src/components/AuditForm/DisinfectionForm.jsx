import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Form,
  Input,
  Select,
  Radio,
  Button,
  Spin,
  message,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { calculateDisinfectionCompliance, getComplianceLevel } from '../../utils/complianceCalculation';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import ComplianceDisplay from '../common-components/ComplianceDisplay';

const { Option } = Select;

const taskDefinitions = {
  daily: [
    { key: 'transportIncubator', label: 'Was Transport Incubator disinfected using Bacilloid?' },
    { key: 'laminarFlow', label: 'Was Laminar Flow disinfected with Bacillocid twice today?' },
    { key: 'neopuff', label: 'Was Neopuff disinfected with Bacillocid?' },
    { key: 'suctionJars', label: 'Were Suction Jars and Tubings cleaned and dated?' },
    { key: 'intubationTray', label: 'Was Intubation Tray disinfected with Bacillocid?' },
    { key: 'bottleSteriliser', label: 'Was Bottle Steriliser cleaned with soap?' },
    { key: 'chitelForceps', label: 'Were Chitel Forceps disinfected appropriately?' },
    { key: 'bedsideTrays', label: 'Were Bedside Trays disinfected?' },
    { key: 'milkPrepTrays', label: 'Were Milk Preparation Trays washed with hot water?' },
    { key: 'weighingMachine', label: 'Was Weighing Machine disinfected?' },
  ],
  afterUse: [
    { key: 'laryngoscope', label: 'Was Laryngoscope disinfected after use?' },
    { key: 'ventilatorCircuit', label: 'Was Ventilator Circuit disinfected and replaced after use?' },
    { key: 'ambuBag', label: 'Was Ambu Bag dismantled, cleaned, and disinfected after use?' },
    { key: 'oxygenJars', label: 'Were Oxygen Jars replaced and disinfected after use?' },
  ],
  weekly: [
    { key: 'fridge', label: 'Was Fridge disinfected on scheduled days?' },
    { key: 'cpapVentilators', label: 'Were CPAP Ventilators disinfected on scheduled days?' },
    { key: 'warmers', label: 'Were Warmers disinfected on scheduled days?' },
    { key: 'incubators', label: 'Were Incubators disinfected on scheduled days?' },
  ],
};

const DisinfectionForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [expandedSections, setExpandedSections] = useState({
    daily: false,
    afterUse: false,
    weekly: false,
  });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onTaskTypeChange = (value) => {
    form.setFieldsValue({ taskType: value });
    setExpandedSections({
      daily: value === 'daily',
      afterUse: value === 'afterUse',
      weekly: value === 'weekly',
    });
  };

  const computeCompliance = (values) => {
    try {
      const result = calculateDisinfectionCompliance(values);
      return result;
    } catch {
      return { score: 0, ...getComplianceLevel(0) };
    }
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const complianceObj = computeCompliance(values);
      const auditData = {
        type: 'disinfection',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        observerId: user?.id || 'unknown',
        observerName: user?.name || 'Unknown Observer',
        nicuArea: values.hospitalName || 'Unknown',
        nicuAreaId: values.nicuAreaId,
        taskType: values.taskType,
        taskValues: Object.fromEntries(
          Object.entries(values).filter(([key]) => key !== 'hospitalName' && key !== 'nicuAreaId' && key !== 'taskType')
        ),
        complianceScore: complianceObj.score,
        complianceLevel: complianceObj,
        notes: `Disinfection audit - Staff: ${values.staffName || 'N/A'}`,
      };
      await createAudit(auditData);
      setSubmitStatus('success');
      message.success('Disinfection audit submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
      message.error('Failed to submit audit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const complianceObj = computeCompliance(form.getFieldsValue());
  const complianceLevel = getComplianceLevel(complianceObj.score);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          scrollToFirstError
          initialValues={{ taskType: '', nicuArea: '', taskValues: {} }}
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                onClick={() => navigate('/audit')}
                icon={<ArrowLeft />}
                className="text-orange-100 hover:text-white"
              />
              <div>
                <h1 className="text-white text-2xl font-bold">Disinfection Audits</h1>
                <p className="text-orange-100 text-sm">2025 - Equipment and Environment Disinfection</p>
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
              {complianceObj.score.toFixed(1)}% Compliance
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item 
                  label="Email *" 
                  name="email" 
                  initialValue={user?.email}
                  rules={[{ required: true, message: 'Email is required' }]}
                >
                  <Input disabled />
                </Form.Item>
                <Form.Item 
                  label="Name of Staff / Supervisor *" 
                  name="staffName"
                  rules={[{ required: true, message: 'Please enter staff/supervisor name' }]}
                >
                  <Input placeholder="Enter staff/supervisor name" />
                </Form.Item>
                <Form.Item
                  label="Hospital Name *"
                  name="hospitalName"
                  rules={[{ required: true, message: 'Please select a NICU area' }]}
                >
                  {loadingAreas ? (
                    <Spin />
                  ) : (
                    <Select 
                      placeholder="Select NICU area" 
                      allowClear
                      onChange={(value, option) => {
                        const selectedArea = nicuAreas.find(area => area.name === value);
                        if (selectedArea) {
                          form.setFieldsValue({ nicuAreaId: selectedArea.id });
                        }
                      }}
                    >
                      {nicuAreas.map((area) => (
                        <Option key={area.id} value={area.name}>
                          {area.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
                <Form.Item
                  label="NICU Area Id"
                  name="nicuAreaId"
                  rules={[{ required: true, message: 'NICU Area ID is required' }]}
                  hidden
                >
                  <Input disabled />
                </Form.Item>
              </div>
            </div>

            {/* Task Type */}
            <Form.Item
              label="Select Task Type *"
              name="taskType"
              rules={[{ required: true, message: 'Please select a task type' }]}
            >
              <Select placeholder="Choose task type" onChange={onTaskTypeChange}>
                {taskDefinitions &&
                  Object.entries(taskDefinitions).map(([key]) => {
                    return (
                      <Option key={key} value={key}>
                        {key === 'daily'
                          ? 'Daily Disinfection Tasks'
                          : key === 'afterUse'
                          ? 'After Every Use Disinfection Tasks'
                          : 'Weekly Disinfection Tasks'}
                      </Option>
                    );
                  })}
              </Select>
            </Form.Item>

            {/* Task Sections */}
            {Object.entries(taskDefinitions).map(([sectionKey, tasks]) => (
              <div key={sectionKey} className="bg-orange-50 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-orange-900 font-semibold">
                    {sectionKey === 'daily'
                      ? 'Daily Disinfection Tasks'
                      : sectionKey === 'afterUse'
                      ? 'After Every Use Disinfection Tasks'
                      : 'Weekly Disinfection Tasks'}
                  </h3>
                  {expandedSections[sectionKey] ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections[sectionKey] && (
                  <div className="p-6 space-y-4">
                    {tasks.map(({ key, label }) => (
                      <Form.Item
                        key={key}
                        label={label}
                        name={key}
                        rules={[
                          {
                            required: form.getFieldValue('taskType') === sectionKey,
                            message: 'Required',
                          },
                        ]}
                      >
                        <Radio.Group className="flex space-x-8">
                          <Radio value="Yes">Yes</Radio>
                          <Radio value="No">No</Radio>
                        </Radio.Group>
                      </Form.Item>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Compliance Display */}
            {form.getFieldValue('taskType') && (
              <ComplianceDisplay
                complianceScore={complianceObj.score}
                complianceLevel={complianceLevel}
                totalFields={complianceObj.totalFields}
                completedFields={complianceObj.completedFields}
                lowCompliance={complianceObj.score < 80}
              />
            )}

            {/* Submit Section */}
            <Form.Item>
              <div className="flex justify-end space-x-4 border-t border-gray-200 pt-4">
                <Button onClick={() => navigate('/audit')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={!form.getFieldValue('taskType')}
                >
                  <Save className="mr-2" />
                  Submit
                </Button>
              </div>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DisinfectionForm;
