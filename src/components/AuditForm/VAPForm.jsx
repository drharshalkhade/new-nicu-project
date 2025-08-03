import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
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
import { useSelector } from 'react-redux';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';

const { Option } = Select;

const VAPForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
 const profile = useSelector(state => state.user.userDetails);

  const [form] = Form.useForm();

  const [nicuAreas, setNicuAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Controls which bundle section is expanded
  const [visibleSection, setVisibleSection] = useState('');

  // Submit and success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch NICU Areas from backend - no fallback data
  useEffect(() => {
    if (!profile?.organization_id) return;

    const fetchNICUAreas = async () => {
      setLoadingAreas(true);
      try {
        const { data, error } = await supabase
          .from('nicu_areas_with_org')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setNicuAreas(data || []);
      } catch (error) {
        console.error('Failed to fetch NICU areas:', error.message);
        setNicuAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchNICUAreas();
  }, [profile?.organization_id]);

  // Handle navigation to sections on bundle selection
  const handleBundleSelection = (val) => {
    setVisibleSection(val);
    form.setFieldsValue({ bundleSelection: val });

    setTimeout(() => {
      const el = document.getElementById(val);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // const toggleSection = (section) => {
  //   if (visibleSection === section) {
  //     setVisibleSection('');
  //   } else {
  //     setVisibleSection(section);
  //   }
  // };

  // Scroll back to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form submit handler
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
        moments: {
          beforePatientContact: false,
          beforeAsepticProcedure: false,
          afterBodyFluidExposure: false,
          afterPatientContact: false,
          afterPatientSurroundings: false,
        },
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

  // For compliance display
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
                {[
                  { key: 'intubationBundle', label: 'Intubation Bundle' },
                  { key: 'reintubationBundle', label: 'Re-intubation Bundle' },
                  { key: 'maintenanceBundle', label: 'Maintenance Bundle' },
                  { key: 'etSuctionBundle', label: 'ET Suction Bundle' },
                  { key: 'extubationBundle', label: 'Extubation Bundle' },
                  { key: 'postExtubationBundle', label: 'Post Extubation Bundle' },
                ].map(({ key, label }) => (
                  <Radio.Button key={key} value={key} className="mb-2">
                    {label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            {/* Dynamic Bundle Sections */}

            {visibleSection === 'intubationBundle' && (
              <BundleSection
                id="intubationBundle"
                title="Intubation Bundle"
                fields={[
                  { key: 'preSuppliesArranged', label: 'Supplies Arranged' },
                  { key: 'preIndication', label: 'Indication' },
                  { key: 'preEmergencyElective', label: 'Emergency/Elective' },
                  { key: 'preETSize', label: 'ET Tube Size' },
                  { key: 'preETDepth', label: 'ET Tube Depth' },
                  { key: 'procWearMask', label: 'Wear Mask/Gloves' },
                  { key: 'procHandWash', label: 'Hand Wash' },
                  { key: 'procAseptic', label: 'Aseptic Precautions' },
                  { key: 'procAppropriateSteps', label: 'Appropriate Steps' },
                ]}
              />
            )}
            {visibleSection === 'reintubationBundle' && (
              <BundleSection id="reintubationBundle" title="Re-intubation Bundle" fields={/* similar*/[]} />
            )}
            {visibleSection === 'maintenanceBundle' && (
              <BundleSection id="maintenanceBundle" title="Maintenance Bundle" fields={/* similar*/[]} />
            )}
            {visibleSection === 'etSuctionBundle' && (
              <BundleSection id="etSuctionBundle" title="ET Suction Bundle" fields={/* similar*/[]} />
            )}
            {visibleSection === 'extubationBundle' && (
              <BundleSection id="extubationBundle" title="Extubation Bundle" fields={/* similar*/[]} />
            )}
            {visibleSection === 'postExtubationBundle' && (
              <BundleSection id="postExtubationBundle" title="Post Extubation Bundle" fields={/* similar*/[]} />
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

const BundleSection = ({ id, title, fields }) => {

  return (
    <div id={id} className="bg-purple-100 rounded-md p-4">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ key, label }) => (
          <Form.Item
            key={key}
            label={label}
            name={key}
            rules={[{ required: true, message: 'This field is required.' }]}
          >
            <Radio.Group>
              <Radio value="Yes">Yes</Radio>
              <Radio value="No">No</Radio>
            </Radio.Group>
          </Form.Item>
        ))}
      </div>
    </div>
  );
};

const ComplianceDisplay = ({ complianceScore, complianceLevel, totalFields, completedFields, lowCompliance }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex justify-between mb-2">
      <h4 className="text-sm font-semibold">Compliance</h4>
      <div className={`text-lg font-bold text-${complianceLevel.color}-600`}>
        {complianceScore.toFixed(1)}%
      </div>
    </div>
    <div className="w-full rounded-full bg-gray-200 h-2 mb-2">
      <div
        className={`rounded-full h-2 transition-all duration-300 bg-${complianceLevel.color}-500`}
        style={{ width: `${complianceScore}%` }}
      />
    </div>
    <div className="flex justify-between text-xs text-gray-600 mb-2">
      <span>
        Completed {completedFields}/{totalFields}
      </span>
      <span>{complianceLevel.description}</span>
    </div>
    {lowCompliance && (
      <div className="flex items-center text-red-600 space-x-2 mt-1">
        <AlertCircle size={16} />
        <span className="text-sm">Below 80% compliance threshold</span>
      </div>
    )}
  </div>
);


export default VAPForm;
