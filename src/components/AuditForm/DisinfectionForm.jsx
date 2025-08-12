import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  ArrowLeft,
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

const { Option } = Select;

const DisinfectionForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const onTaskTypeChange = (value) => {
    setSelectedTaskType(value);
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
        nicuArea: values.nicuArea || 'Unknown',
        nicuAreaId: values.nicuAreaId,
        taskType: values.taskType,
        taskValues: Object.fromEntries(
          Object.entries(values).filter(([key]) => key !== 'nicuArea' && key !== 'nicuAreaId' && key !== 'taskType' && key !== 'email' && key !== 'staffName')
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
          initialValues={{ taskType: '', nicuArea: '', email: user?.email }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item 
                label="Email *" 
                name="email" 
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
                label="NICU Area *"
                name="nicuArea"
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

            {/* Task Type Selection */}
            <div className="bg-purple-100 p-4 rounded-md">
              <h2 className="text-xl font-semibold mb-4">Type of Task</h2>
              <Form.Item
                label="Select Task Type *"
                name="taskType"
                rules={[{ required: true, message: 'Please select a task type' }]}
              >
                <Radio.Group onChange={(e) => onTaskTypeChange(e.target.value)}>
                  <Radio value="dailyTasks">Daily Disinfection Tasks</Radio>
                  <Radio value="afterUseTasks">After Every Use Disinfection Tasks</Radio>
                  <Radio value="weeklyTasks">Weekly Disinfection Tasks</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* Daily Disinfection Tasks Section */}
            {selectedTaskType === 'dailyTasks' && (
              <div className="bg-purple-100 p-4 rounded-md">
                <h2 className="text-xl font-semibold mb-4">Daily Disinfection Tasks</h2>
                <div className="space-y-4">
                  <Form.Item
                    label="Was Transport Incubator disinfected today using Bacilloid? *"
                    name="transportIncubator"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was Laminar Flow disinfected with Bacillocid twice today? *"
                    name="laminarFlow"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was Neopuff disinfected with Bacillocid today? *"
                    name="neopuff"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the Suction Jars & Tubings cleaned with soap and water, Cidex 2% glutaraldehyde, and packed with a date today? *"
                    name="suctionJars"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was the Intubation Tray disinfected with Bacillocid today? *"
                    name="intubationTray"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was the Bottle Steriliser cleaned with soap and water today? *"
                    name="bottleSteriliser"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the Chitel Forceps disinfected with ETO/Cidex/2% glutaraldehyde today? *"
                    name="chitelForceps"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the Bedside Trays disinfected today? *"
                    name="bedsideTrays"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the Milk Preparation Trays washed with hot water and soap? *"
                    name="milkPrepTrays"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was the Weighing Machine disinfected with Bacillocid today? *"
                    name="weighingMachine"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>
            )}

            {/* After Every Use Disinfection Tasks Section */}
            {selectedTaskType === 'afterUseTasks' && (
              <div className="bg-purple-100 p-4 rounded-md">
                <h2 className="text-xl font-semibold mb-4">After Every Use Disinfection Tasks</h2>
                <div className="space-y-4">
                  <Form.Item
                    label="Was the Laryngoscope disinfected with Chlorhexidine after use? *"
                    name="laryngoscope"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the ventilator circuit disinfected with ETO/Cidex 2% glutaraldehyde and packed with a date after use? *"
                    name="ventilatorCircuit"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Was the Ambu Bag dismantled, disinfected with soap and water, and sent for ETO/Cidex 2% glutaraldehyde after use? *"
                    name="ambuBag"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the Oxygen Jars disinfected with ETO/Cidex 2% glutaraldehyde, packed, and replaced after use? *"
                    name="oxygenJars"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>
            )}

            {/* Weekly Disinfection Tasks Section */}
            {selectedTaskType === 'weeklyTasks' && (
              <div className="bg-purple-100 p-4 rounded-md">
                <h2 className="text-xl font-semibold mb-4">Weekly Disinfection Tasks (Monday/Friday)</h2>
                <div className="space-y-4">
                  <Form.Item
                    label="Was the Fridge disinfected today (Monday/Friday)? *"
                    name="fridge"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the unused CPAP and Ventilators disinfected with Bacillocid today (Monday/Friday)? *"
                    name="cpapVentilators"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the unused Warmers disinfected with Bacillocid 5% ecoshield, 2% cidex or 3% carbolic acid (Monday/Friday)? *"
                    name="warmers"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Were the unused Incubators disinfected with Bacillocid today (Monday/Friday)? *"
                    name="incubators"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      <Radio value="Yes">Yes</Radio>
                      <Radio value="No">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>
            )}

            {/* No Task Type Selected Message */}
            {!selectedTaskType && (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-600">Please select a task type above to view the form fields.</p>
              </div>
            )}

            {/* Submit Section */}
            <Form.Item>
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <Button onClick={() => navigate('/audit')} disabled={isSubmitting}>
                  Back to Top
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={!selectedTaskType}
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
