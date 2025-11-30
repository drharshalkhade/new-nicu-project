import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  LayoutDashboard,
  Syringe,
  Activity,
  Wind,
  Trash2,
  ClipboardList,
  Save,
  AlertCircle
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
import { useAuth } from '../../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import { vapBundleOptions, yesNoOptions } from '../../constant/audit-options';

const { Option } = Select;

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
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      const auditRecord = {
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        observerId: user?.id || 'unknown',
        observerName: user?.name || 'Unknown Observer',
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuArea)?.name || 'Unknown Area',
        nicuAreasId: values.nicuArea,
        bundleSelection: values.bundleSelection,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-2">VAP Audit Submitted!</h2>
          <p className="text-gray-500 mb-8">Your audit has been successfully recorded.</p>
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
                <h1 className="text-xl font-bold text-gray-900">VAP Bundle Audit</h1>
                <p className="text-xs text-gray-500">Ventilator-Associated Pneumonia Prevention</p>
              </div>
            </div>
            <Tag color="green" className="px-3 py-1 rounded-full">
              {new Date().toLocaleDateString()}
            </Tag>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ bundleSelection: '', nicuArea: '' }}
          className="space-y-8"
        >
          {/* Section 1: Context */}
          <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-green-600" size={20} />
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
                  >
                    {nicuAreas.map(area => (
                      <Option key={area.id} value={area.id}>{area.name}</Option>
                    ))}
                  </Select>
                )}
              </Form.Item>

              <Form.Item label="Patient Name" name="patientName" rules={[{ required: true }]}>
                <Input size="large" placeholder="Patient Name" />
              </Form.Item>

              <Form.Item label="Bedside Staff Name" name="staffName">
                <Input size="large" placeholder="Staff Name" />
              </Form.Item>
            </div>
          </Card>

          {/* Section 2: Bundle Selection */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="text-green-600" size={20} />
                Bundle Selection
              </h3>
            </div>
            <Form.Item
              name="bundleSelection"
              rules={[{ required: true, message: 'Please select a bundle' }]}
            >
              <SelectionCard
                options={vapBundleOptions.map(opt => ({
                  value: opt.key,
                  label: opt.label,
                  icon: opt.icon
                }))}
                cols={3}
                onChange={handleBundleSelection}
              />
            </Form.Item>
          </Card>

          {/* Intubation Bundle */}
          {visibleSection === 'intubationReintubationBundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Syringe className="text-green-600" size={20} />
                  Intubation / Reintubation Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item label="Supplies/Equipment arranged" name="preSuppliesArranged" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>

                <Form.Item label="Indication" name="preIndication" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'Shock', label: 'Shock' },
                      { value: 'Respiratory Distress', label: 'Respiratory Distress' },
                      { value: 'Neurological cause', label: 'Neurological cause' },
                      { value: 'NIV Failure', label: 'NIV Failure' },
                      { value: 'Extubation Failure', label: 'Extubation Failure' },
                      { value: 'Desaturation', label: 'Desaturation' },
                      { value: 'Surfactant Administration', label: 'Surfactant Admin' },
                      { value: 'Apnoea', label: 'Apnoea' },
                      { value: 'Secretions/Block', label: 'Secretions/Block' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Type" name="preEmergencyElective" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'Emergency', label: 'Emergency', icon: <AlertCircle size={18} /> },
                      { value: 'Elective', label: 'Elective', icon: <CheckCircle size={18} /> }
                    ]}
                  />
                </Form.Item>

                {[
                  { label: "ET tube of appropriate size chosen", name: "preETTubeSize" },
                  { label: "Depth of ET tube insertion Calculated", name: "preETTubeDepth" },
                  { label: "Wear mask, cap & gloves", name: "procWearMask" },
                  { label: "Wash hands with soap and water f/b Hand Rub", name: "procHandWash" },
                  { label: "Strict aseptic precautions", name: "procAsepticPrecautions" },
                  { label: "Appropriate steps followed", name: "procAppropriateSteps" },
                  { label: "Handwash or hand rub after removing gloves", name: "procHandRubAfter" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* Maintenance Bundle */}
          {visibleSection === 'maintenanceBundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="text-green-600" size={20} />
                  Maintenance Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Heated humidifier used", name: "humidHeated" },
                  { label: "Inspired gas at 37°C and 100% relative humidity", name: "humidGasTemp" },
                  { label: "Auto refill technique for the humidifier", name: "humidAutoRefill" },
                  { label: "Sterile water used", name: "humidSterileWater" },
                  { label: "Condensation in inspiratory limb", name: "humidCondensation" },
                  { label: "Drain condensate in water trap", name: "humidDrainCondensate" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}

                <Form.Item label="Ventilator circuits used" name="equipCircuits" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={1}
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Reused but sterile', label: 'Reused but sterile' },
                      { value: 'Reused Unsterile', label: 'Reused Unsterile' }
                    ]}
                  />
                </Form.Item>

                {[
                  { label: "Ventilator circuits are clean (not visibly soiled)", name: "equipCircuitsClean" },
                  { label: "Hand hygiene followed when handling circuit", name: "equipHandHygiene" },
                  { label: "Circuit positioned parallel to baby & in dependent position", name: "equipCircuitPosition" },
                  { label: "30 degree elevation of head end", name: "infantHeadElevation" },
                  { label: "Frequent changes in position", name: "infantPositionChange" },
                  { label: "Oral suction if secretions are visible", name: "oralSuction" },
                  { label: "Oral application of Colostrum / EBM", name: "oralColostrum" },
                  { label: "OG Feeds", name: "ogFeeds" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}

                <Form.Item label="Type of Feed" name="feedType" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={3}
                    options={[
                      { value: 'EBM', label: 'EBM' },
                      { value: 'Formula', label: 'Formula' },
                      { value: 'NPO', label: 'NPO' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Sedation" name="extubSedation" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'Stopped', label: 'Stopped' },
                      { value: 'Ongoing', label: 'Ongoing' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Extubation Readiness Assessment" name="extubReadiness" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
              </div>
            </Card>
          )}

          {/* ET Suction Bundle */}
          {visibleSection === 'etSuctionBundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Wind className="text-green-600" size={20} />
                  ET Suction Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Clinically indicated", name: "etSuctionIndicated" },
                  { label: "Hand Hygiene As per Policy", name: "etSuctionHandHygiene" },
                  { label: "Sterile gloves used", name: "etSuctionSterileGloves" },
                  { label: "New Catheter used", name: "etSuctionNewCatheter" },
                  { label: "Protected Suction", name: "etSuctionProtected" },
                  { label: "Aseptic procedure", name: "etSuctionAseptic" },
                  { label: "Saline NOT used during suction", name: "etSuctionNoSaline" },
                  { label: "Suction of Oral f/b Nasal cavity after ET Suction", name: "etSuctionOralNasal" },
                  { label: "Used Appropriate disposal of Gloves & Catheter", name: "etSuctionDisposal" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* Extubation Bundle */}
          {visibleSection === 'extubationBundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Trash2 className="text-green-600" size={20} />
                  Extubation Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item label="Date of extubation" name="extubDate" rules={[{ required: true }]}>
                  <Input size="large" type="date" />
                </Form.Item>

                <Form.Item label="Reason for Extubation" name="extubReason" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'IntubatedOutside', label: 'Intubated Outside' },
                      { value: 'AccidentalExtubation', label: 'Accidental' },
                      { value: 'ETBlock', label: 'ET Block' },
                      { value: 'PlannedExtubation', label: 'Planned' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Ventilator Settings" name="preExtubSettings" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={2}
                    options={[
                      { value: 'Extubatable', label: 'Extubatable' },
                      { value: 'NonExtubatable', label: 'Non-Extubatable' }
                    ]}
                  />
                </Form.Item>

                {[
                  { label: "Appropriate Drugs Administered", name: "preExtubDrugs" },
                  { label: "Clinical stability assessed", name: "preExtubStability" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}

                <Form.Item label="Spontaneous Breathing Trial" name="preExtubSBT" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={3}
                    options={[
                      { value: 'Passed', label: 'Passed' },
                      { value: 'NotPassed', label: 'Not Passed' },
                      { value: 'NotGiven', label: 'Not Given' }
                    ]}
                  />
                </Form.Item>

                {[
                  { label: "2 people involved", name: "extubPrepPeople" },
                  { label: "Supplies/Equipment arranged", name: "extubPrepSupplies" },
                  { label: "Extubation: Appropriate Steps used", name: "extubPrepSteps" },
                  { label: "Appropriate respiratory support used Post-Extubation", name: "extubPrepSupport" },
                ].map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}
              </div>
            </Card>
          )}

          {/* Post-Extubation Bundle */}
          {visibleSection === 'postExtubationBundle' && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="text-green-600" size={20} />
                  Post-Extubation Care Bundle
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item label="Respiratory support used" name="postExtubSupport" rules={[{ required: true }]}>
                  <SelectionCard
                    cols={3}
                    options={[
                      { value: 'NIPPV', label: 'NIPPV' },
                      { value: 'CPAP', label: 'CPAP' },
                      { value: 'HFNC', label: 'HFNC' },
                      { value: 'HOODBOX', label: 'HOODBOX' },
                      { value: 'LFNC', label: 'LFNC' },
                      { value: 'RoomAir', label: 'Room Air' }
                    ]}
                  />
                </Form.Item>

                {[
                  { label: "Nebulization", name: "postExtubNebulization" },
                  { label: "Position change every 2 hrs", name: "postExtubPositionChange" },
                  { label: "Suction", name: "postExtubSuction" },
                  { label: "Monitoring (Vitals, RDS Score)", name: "postExtubMonitoring" },
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
              disabled={isSubmitting || !visibleSection}
              icon={<Save size={18} />}
              className="px-8 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
            >
              Submit Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default VAPForm;
