import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  LayoutDashboard,
  Syringe,
  Activity,
  Trash2,
  Calendar,
  FileText
} from 'lucide-react';
import { Form, Input, Select, Button, message, Spin, Card, Tag } from 'antd';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import {
  clabsiBundleOptions,
  catheterTypes,
  catheterSites,
  sides,
  limbs,
  yesNoOptions,
  removalReasons
} from '../../constant/audit-options';

const { Option } = Select;

const CLABSIForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState('');

  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id]);

  const onBundleChange = (value) => {
    setSelectedBundle(value);
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const auditData = {
        type: 'clabsi',
        patientName: values.patientName,
        nicuAreaId: values.nicuAreaId,
        nicuArea: values.nicuArea,
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
                <h1 className="text-xl font-bold text-gray-900">CLABSI Checklist</h1>
                <p className="text-xs text-gray-500">Central Line-Associated Bloodstream Infection Prevention</p>
              </div>
            </div>
            <Tag color="purple" className="px-3 py-1 rounded-full">
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
          className="space-y-8"
          initialValues={{
            bundleChecklist: '',
          }}
        >
          {/* Section 1: Context */}
          <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-purple-600" size={20} />
                Audit Context
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label="NICU Area"
                name="nicuArea"
                rules={[{ required: true, message: 'Required' }]}
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
                    {nicuAreas.map(area => (
                      <Option key={area.id} value={area.name}>{area.name}</Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
              <Form.Item name="nicuAreaId" hidden><Input /></Form.Item>

              <Form.Item label="Patient Name" name="patientName" rules={[{ required: true, message: 'Required' }]}>
                <Input size="large" placeholder="Patient Name" />
              </Form.Item>

              <Form.Item label="Staff Name" name="staffName">
                <Input size="large" placeholder="Staff Name" />
              </Form.Item>
            </div>
          </Card>

          {/* Section 2: Bundle Selection */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-purple-600" size={20} />
                Bundle Selection
              </h3>
            </div>
            <Form.Item
              name="bundleChecklist"
              rules={[{ required: true, message: 'Please select a bundle' }]}
            >
              <SelectionCard
                options={clabsiBundleOptions}
                cols={3}
                onChange={onBundleChange}
              />
            </Form.Item>
          </Card>

          {/* Insertion Bundle */}
          {selectedBundle === 'Insertion Bundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Syringe className="text-purple-600" size={20} />
                  Insertion Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label="Indication" name="indication" rules={[{ required: true }]}>
                  <Input size="large" placeholder="Indication" />
                </Form.Item>

                <Form.Item label="Type" name="electiveEmergency" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'Elective', label: 'Elective', icon: <Calendar size={18} /> },
                      { value: 'Emergency', label: 'Emergency', icon: <AlertCircle size={18} /> }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Supplies Arranged" name="suppliesArranged" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>

                <Form.Item label="Catheter Type" name="catheterTypes" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={catheterTypes} />
                </Form.Item>

                <Form.Item label="Site" name="site" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={catheterSites} />
                </Form.Item>

                <Form.Item label="Side" name="side" rules={[{ required: true }]}>
                  <SelectionCard cols={3} options={sides} />
                </Form.Item>

                <Form.Item label="Limb" name="limb" rules={[{ required: true }]}>
                  <SelectionCard cols={3} options={limbs} />
                </Form.Item>

                <Form.Item label="2 People Involved" name="twoPeople" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>

                <Form.Item label="Measurement Done" name="measurementDone" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
              </div>

              <div className="mt-8 mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">During Procedure</h4>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { label: "Wash hands & Hand Rub", name: "washHandsDuring" },
                    { label: "PPE and strict asepsis", name: "ppeAsepsis" },
                    { label: "Check Equipment / Sterile Tray", name: "checkEquipment" },
                    { label: "All Lumens Flushed", name: "allLumensFlushed" },
                    { label: "Appropriate Site preparation", name: "sitePreparation" },
                    { label: "Strict aseptic precautions", name: "asepticPrecautions" },
                    { label: "Appropriate steps followed", name: "appropriateSteps" },
                    { label: "Number of Pricks <= 2", name: "numberOfPricks" },
                    { label: "Haemostasis Achieved", name: "haemostasisAchieved" },
                    { label: "Fixed with sterile Pad", name: "fixedWithPad" },
                    { label: "Needle free connector used", name: "needleFreeConnector" },
                    { label: "Handwash after removing gloves", name: "handwashAfterGloves" },
                    { label: "Ultrasound Guidance Used", name: "ultrasoundGuidance" },
                  ].map(field => (
                    <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                      <SelectionCard cols={2} options={yesNoOptions} />
                    </Form.Item>
                  ))}
                </div>
              </div>

              <div className="mt-8 mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">After Procedure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item label="Position Confirm on CXR" name="positionConfirm" rules={[{ required: true }]}>
                    <SelectionCard
                      cols={3}
                      options={[
                        { value: 'USG', label: 'USG', icon: <Activity size={18} /> },
                        { value: 'CXR', label: 'CXR', icon: <Activity size={18} /> },
                        { value: 'Unconfirmed', label: 'Unconfirmed', icon: <AlertCircle size={18} /> }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item label="Repositioning Required" name="repositioningRequired" rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>

                  <Form.Item label="Fixed at (cm)" name="fixedAt" rules={[{ required: true }]}>
                    <Input size="large" type="number" placeholder="Depth in cm" />
                  </Form.Item>

                  <Form.Item label="Date/Time of Insertion" name="dateTimeInsertion" rules={[{ required: true }]}>
                    <Input size="large" type="datetime-local" />
                  </Form.Item>
                </div>
              </div>
            </Card>
          )}

          {/* Maintenance Bundle */}
          {selectedBundle === 'Maintenance Bundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="text-purple-600" size={20} />
                  Maintenance Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Wash hands & Hand Rub", name: "washHandsMaintenance" },
                  { label: "Assessed need of central lines", name: "assessedNeed" },
                  { label: "Sterile semipermeable dressing intact", name: "sterileDressing" },
                  { label: "Each lumen flushed", name: "eachLumenFlushed" },
                  { label: "No Signs of Erythema / Infection", name: "noErythema" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>

              <div className="mt-8 mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Hub Care Bundle</h4>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { label: "Wash hands & Hand Rub", name: "washHandsHubCare" },
                    { label: "Wear sterile gloves", name: "wearSterileGloves" },
                    { label: "Scrub access port for 15s & dry", name: "scrubPort" },
                    { label: "Sterile field maintained", name: "sterileField" },
                  ].map(field => (
                    <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                      <SelectionCard cols={2} options={yesNoOptions} />
                    </Form.Item>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Removal Bundle */}
          {selectedBundle === 'Removal Bundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Trash2 className="text-purple-600" size={20} />
                  Removal Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label="Date of Removal" name="dateOfRemoval" rules={[{ required: true }]}>
                  <Input size="large" type="date" />
                </Form.Item>

                <Form.Item label="Reason for Removal" name="reasonForRemoval" rules={[{ required: true }]}>
                  <SelectionCard cols={1} options={removalReasons} />
                </Form.Item>

                <Form.Item label="Tip culture sent" name="tipCultureSent" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
              </div>
            </Card>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 pb-20">
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
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting || !selectedBundle}
              icon={<Save size={18} />}
              className="px-8 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
            >
              Save Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CLABSIForm;
