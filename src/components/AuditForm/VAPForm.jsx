import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  calculateVAPCompliance,
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


const { Option } = Select;

const bundleFields = {
  intubationReintubationBundle: [
    // Pre-Procedure Checklist
    { key: 'preSuppliesArranged', label: 'Supplies/Equipment arranged *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'preIndication', label: 'Indication *', type: 'radio', options: ['Shock', 'Respiratory Distress', 'Neurological cause', 'NIV Failure', 'Extubation Failure', 'Desaturation', 'Surfactant Administration', 'Apnoea', 'Secretions/Block requiring Re Intubation', 'Other'], required: true },
    { key: 'preEmergencyElective', label: 'Emergency/Elective *', type: 'radio', options: ['Emergency', 'Elective'], required: true },
    { key: 'preETTubeSize', label: 'ET tube of appropriate size chosen *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'preETTubeDepth', label: 'Depth of ET tube insertion Calculated *', type: 'radio', options: ['Yes', 'No'], required: true },
    // Procedure Checklist
    { key: 'procWearMask', label: 'Wear mask, cap & gloves *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'procHandWash', label: 'Wash hands with soap and water f/b Hand Rub (As per policy) *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'procAsepticPrecautions', label: 'Strict aseptic precautions *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'procAppropriateSteps', label: 'Appropriate steps followed *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'procHandRubAfter', label: 'Handwash or hand rub after removing gloves *', type: 'radio', options: ['Yes', 'No'], required: true },
  ],
  maintenanceBundle: [
    // Humidification
    { key: 'humidHeated', label: 'Heated humidifier used *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'humidGasTemp', label: 'Inspired gas at 37 degrees Celsius and 100% relative humidity *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'humidAutoRefill', label: 'Auto refill technique for the humidifier to fill water *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'humidSterileWater', label: 'Sterile water used *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'humidCondensation', label: 'Condensation in inspiratory limb *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'humidDrainCondensate', label: 'Drain condensate in water trap *', type: 'radio', options: ['Yes', 'No'], required: true },
    // Respiratory Equipment Care
    { key: 'equipCircuits', label: 'Ventilator circuits used *', type: 'radio', options: ['New', 'Reused but sterile', 'Reused Unsterile'], required: true },
    { key: 'equipCircuitsClean', label: 'Ventilator circuits are clean (not visibly soiled) *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'equipHandHygiene', label: 'Hand hygiene followed when handling circuit', type: 'radio', options: ['Yes', 'No'], required: false },
    { key: 'equipCircuitPosition', label: 'Circuit positioned parallel to the baby and in dependent position *', type: 'radio', options: ['Yes', 'No'], required: true },
    // Infant Position
    { key: 'infantHeadElevation', label: '30 degree elevation of head end *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'infantPositionChange', label: 'Frequent changes in position *', type: 'radio', options: ['Yes', 'No'], required: true },
    // Oral Hygiene / Enteral Feeds
    { key: 'oralSuction', label: 'Oral suction if secretions are visible *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'oralColostrum', label: 'Oral application of Colostrum / EBM *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'ogFeeds', label: 'OG Feeds *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'feedType', label: 'Type of Feed *', type: 'radio', options: ['EBM', 'Formula', 'NPO'], required: true },
    // Extubation Assessment
    { key: 'extubSedation', label: 'Sedation *', type: 'radio', options: ['Stopped', 'Ongoing'], required: true },
    { key: 'extubReadiness', label: 'Extubation Readiness Assessment *', type: 'radio', options: ['Yes', 'No'], required: true },
  ],
  etSuctionBundle: [
    { key: 'etSuctionIndicated', label: 'Clinically indicated *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionHandHygiene', label: 'Hand Hygiene As per Policy *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionSterileGloves', label: 'Sterile gloves used *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionNewCatheter', label: 'New Catheter used *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionProtected', label: 'Protected Suction *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionAseptic', label: 'Aseptic procedure *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionNoSaline', label: 'Saline NOT used during suction *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionOralNasal', label: 'Suction of Oral f/b Nasal cavity after ET Suction *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'etSuctionDisposal', label: 'Used Appropriate disposal of Gloves & Catheter *', type: 'radio', options: ['Yes', 'No'], required: true },
  ],
  extubationBundle: [
    { key: 'extubDate', label: 'Date of extubation *', type: 'date', required: true },
    { key: 'extubReason', label: 'Reason for Extubation *', type: 'radio', options: ['IntubatedOutside', 'AccidentalExtubation', 'ETBlock', 'PlannedExtubation'], required: true },
    // Pre-Extubation
    { key: 'preExtubSettings', label: 'Ventilator Settings: *', type: 'radio', options: ['Extubatable', 'NonExtubatable'], required: true },
    { key: 'preExtubDrugs', label: 'Appropriate Drugs Administered *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'preExtubStability', label: 'Clinical stability assessed *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'preExtubSBT', label: 'Spontaneous Breathing Trial *', type: 'radio', options: ['Passed', 'NotPassed', 'NotGiven'], required: true },
    // Extubation Preparation
    { key: 'extubPrepPeople', label: '2 people involved *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'extubPrepSupplies', label: 'Supplies/Equipment arranged *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'extubPrepSteps', label: 'Extubation: Appropriate Steps used *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'extubPrepSupport', label: 'Appropriate respiratory support used Post-Extubation *', type: 'radio', options: ['Yes', 'No'], required: true },
  ],
  postExtubationBundle: [
    { key: 'postExtubSupport', label: 'Respiratory support used *', type: 'radio', options: ['NIPPV', 'CPAP', 'HFNC', 'HOODBOX', 'LFNC', 'RoomAir'], required: true },
    { key: 'postExtubNebulization', label: 'Nebulization *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'postExtubPositionChange', label: 'Position change every 2 hrs (Continue every 2 hrs) *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'postExtubSuction', label: 'Suction *', type: 'radio', options: ['Yes', 'No'], required: true },
    { key: 'postExtubMonitoring', label: 'Monitoring (From Radar: Vitals, RDS Score) *', type: 'radio', options: ['Yes', 'No'], required: true },
  ],
};

const bundleOptions = [
  { key: 'intubationReintubationBundle', label: 'Intubation Bundle' },
  { key: 'intubationReintubationBundle', label: 'Reintubation Bundle' },
  { key: 'maintenanceBundle', label: 'Maintenance Bundle' },
  { key: 'etSuctionBundle', label: 'ET Suction Bundle' },
  { key: 'extubationBundle', label: 'Extubation Bundle' },
  { key: 'postExtubationBundle', label: 'Post-Extubation Care Bundle' },
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
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuArea)?.name || 'Unknown Area',
        nicuAreasId: values.nicuArea,
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
  const isLow = complianceData.score < 80;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ bundleSelection: '', nicuArea: '' }}
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
              <h1 className="text-2xl font-semibold">VAP Bundle Audit</h1>
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
                label="Patient Name *"
                name="patientName"
                rules={[{ required: true, message: 'Please enter patient name' }]}
              >
                <Input placeholder="Enter patient name" />
              </Form.Item>
              <Form.Item
                label="Bedside Staff Name"
                name="staffName"
              >
                <Input placeholder="Enter staff name" />
              </Form.Item>
              <Form.Item
                label="NICU Area"
                name="nicuArea"
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
              label="Select Bundle *"
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
