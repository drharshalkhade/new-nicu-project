import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  LayoutDashboard,
  CalendarDays,
  Repeat,
  CalendarClock,
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import {
  Form,
  Input,
  Select,
  Button,
  Spin,
  message,
  Card,
  Tag
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import { disinfectionTaskTypes, yesNoOptions } from '../../constant/audit-options';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const onTaskTypeChange = (value) => {
    setSelectedTaskType(value);
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
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

        notes: `Disinfection audit - Staff: ${values.staffName || 'N/A'}`,
      };
      await createAudit(auditData);
      setShowSuccess(true);
      message.success('Disinfection audit submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error(error);
      message.error('Failed to submit audit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-2">Audit Submitted!</h2>
          <p className="text-gray-500 mb-8">Disinfection audit has been successfully recorded.</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[30px] z-10 shadow-sm">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between h-fit">
            <div className="flex items-center gap-4">
              <Button
                type="text"
                shape="circle"
                icon={<ArrowLeft size={20} />}
                onClick={() => navigate('/audit')}
                className="hover:bg-gray-100"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Disinfection Audits</h1>
                <p className="text-xs text-gray-500">Equipment and Environment Disinfection</p>
              </div>
            </div>
            <Tag color="orange" className="px-3 py-1 rounded-full">
              {new Date().toLocaleDateString()}
            </Tag>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          scrollToFirstError
          initialValues={{ taskType: '', nicuArea: '', email: user?.email }}
          className="space-y-8"
        >
          {/* Section 1: Context */}
          <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-orange-600" size={20} />
                Audit Context
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true }]}
              >
                <Input size="large" disabled />
              </Form.Item>

              <Form.Item
                label="Staff / Supervisor Name"
                name="staffName"
                rules={[{ required: true }]}
              >
                <Input size="large" placeholder="Enter name" />
              </Form.Item>

              <Form.Item
                label="NICU Area"
                name="nicuArea"
                rules={[{ required: true }]}
              >
                {loadingAreas ? (
                  <Spin />
                ) : (
                  <Select
                    size="large"
                    placeholder="Select Area"
                    allowClear
                    onChange={(value, option) => {
                      const selectedArea = nicuAreas.find(area => area.name === value);
                      if (selectedArea) {
                        form.setFieldsValue({ nicuAreaId: selectedArea.id });
                      }
                    }}
                  >
                    {nicuAreas.map((area) => (
                      <Option key={area.id} value={area.name}>{area.name}</Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
              <Form.Item name="nicuAreaId" hidden><Input /></Form.Item>
            </div>
          </Card>

          {/* Section 2: Task Type */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="text-orange-600" size={20} />
                Task Type
              </h3>
            </div>
            <Form.Item
              name="taskType"
              rules={[{ required: true, message: 'Please select a task type' }]}
            >
              <SelectionCard
                options={disinfectionTaskTypes}
                cols={3}
                onChange={onTaskTypeChange}
              />
            </Form.Item>
          </Card>

          {/* Daily Disinfection Tasks Section */}
          {selectedTaskType === 'dailyTasks' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="text-orange-600" size={20} />
                  Daily Disinfection Tasks
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Was Transport Incubator disinfected today using Bacilloid?", name: "transportIncubator" },
                  { label: "Was Laminar Flow disinfected with Bacillocid twice today?", name: "laminarFlow" },
                  { label: "Was Neopuff disinfected with Bacillocid today?", name: "neopuff" },
                  { label: "Were Suction Jars & Tubings cleaned with soap/water, Cidex 2% & packed?", name: "suctionJars" },
                  { label: "Was the Intubation Tray disinfected with Bacillocid today?", name: "intubationTray" },
                  { label: "Was the Bottle Steriliser cleaned with soap and water today?", name: "bottleSteriliser" },
                  { label: "Were the Chitel Forceps disinfected with ETO/Cidex/2% glutaraldehyde today?", name: "chitelForceps" },
                  { label: "Were the Bedside Trays disinfected today?", name: "bedsideTrays" },
                  { label: "Were the Milk Preparation Trays washed with hot water and soap?", name: "milkPrepTrays" },
                  { label: "Was the Weighing Machine disinfected with Bacillocid today?", name: "weighingMachine" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* After Every Use Disinfection Tasks Section */}
          {selectedTaskType === 'afterUseTasks' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Repeat className="text-orange-600" size={20} />
                  After Every Use Disinfection Tasks
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Was the Laryngoscope disinfected with Chlorhexidine after use?", name: "laryngoscope" },
                  { label: "Were ventilator circuit disinfected with ETO/Cidex 2% & packed?", name: "ventilatorCircuit" },
                  { label: "Was Ambu Bag dismantled, disinfected & sent for ETO/Cidex 2%?", name: "ambuBag" },
                  { label: "Were Oxygen Jars disinfected with ETO/Cidex 2%, packed & replaced?", name: "oxygenJars" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* Weekly Disinfection Tasks Section */}
          {selectedTaskType === 'weeklyTasks' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CalendarClock className="text-orange-600" size={20} />
                  Weekly Disinfection Tasks (Monday/Friday)
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Was the Fridge disinfected today (Monday/Friday)?", name: "fridge" },
                  { label: "Were unused CPAP and Ventilators disinfected with Bacillocid today?", name: "cpapVentilators" },
                  { label: "Were unused Warmers disinfected with Bacillocid/Cidex/Carbolic acid?", name: "warmers" },
                  { label: "Were unused Incubators disinfected with Bacillocid today?", name: "incubators" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-end gap-4 pt-4 pb-20">
            <Button
              size="large"
              onClick={() => navigate('/audit')}
              disabled={isSubmitting}
              className="px-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting || !selectedTaskType}
              icon={<Save size={18} />}
              className="px-8 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200"
            >
              Submit Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DisinfectionForm;
