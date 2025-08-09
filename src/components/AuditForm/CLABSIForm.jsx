import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Form, Input, Select, Radio, Button, message, Spin } from 'antd';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { useSelector, useDispatch } from 'react-redux';
import { calculateCLABSICompliance, getComplianceLevel } from '../../utils/complianceCalculation';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import ComplianceDisplay from '../common-components/ComplianceDisplay';

const { Option } = Select;
const { TextArea } = Input;

const CLABSIForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [expandedSections, setExpandedSections] = useState({
    insertion: false,
    maintenance: false,
    removal: false,
  });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id]);

  const onBundleChange = val => {
    form.setFieldsValue({ bundleChecklist: val });
    setExpandedSections({
      insertion: val === 'Insertion Bundle',
      maintenance: val === 'Maintenance Bundle',
      removal: val === 'Removal Bundle',
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const auditData = {
        type: 'clabsi',
        patientName: values.patientName,
        nicuAreaId: values.nicuAreaId,
        hospitalName: values.hospitalName,
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
              label="Patient Name *"
              name="patientName"
              rules={[{ required: true, message: 'Please enter patient name' }]}
            >
              <Input placeholder="Enter patient name" />
            </Form.Item>

            <Form.Item label="Staff Name" name="staffName">
              <Input placeholder="Enter staff name" />
            </Form.Item>

            <Form.Item
              label="Hospital Name *"
              name="hospitalName"
              rules={[{ required: true, message: 'Please select NICU area' }]}
            >
              {loadingAreas ? (
                <Spin />
              ) : (
                <Select 
                  placeholder="Select NICU Area" 
                  allowClear
                  onChange={(value, option) => {
                    const selectedArea = nicuAreas.find(area => area.name === value);
                    if (selectedArea) {
                      form.setFieldsValue({ nicuAreaId: selectedArea.id });
                    }
                  }}
                >
                  {nicuAreas.map(area => (
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

          {/* Bundle Selection */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <Form.Item
              label="Bundle Checklist *"
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
          </div>

          {/* Insertion Bundle */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('insertion')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Insertion Bundle</h3>
              {expandedSections.insertion ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.insertion && (
              <div className="p-6 border-t border-gray-200 space-y-6">
                {/* Basic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Indication *"
                    name="indication"
                    rules={[{ required: true, message: 'Please enter indication' }]}
                  >
                    <Input placeholder="Enter indication" />
                  </Form.Item>
                  
                  <Form.Item
                    label="Elective/Emergency *"
                    name="electiveEmergency"
                    rules={[{ required: true, message: 'Please select type' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      {['Elective', 'Emergency'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>

                {/* Yes/No Fields */}
                <div className="space-y-4">
                  {[
                    { key: 'suppliesArranged', label: 'Supplies/Equipment arranged *' },
                    { key: 'twoPeopleInvolved', label: '2 People involved *' },
                    { key: 'measurementDone', label: 'Measurement done *' },
                    { key: 'washHandsDuring', label: 'Wash hands with soap and water f/b Hand Rub (As per policy) *' },
                    { key: 'ppeAsepsis', label: 'PPE and strict asepsis (Cap, Mask, Gloves, Gown, Drape) *' },
                    { key: 'checkEquipment', label: 'Check Equipment / Sterile Tray *' },
                    { key: 'allLumensFlushed', label: 'All Lumens Flushed *' },
                    { key: 'sitePreparation', label: 'Appropriate Site preparation *' },
                    { key: 'asepticPrecautions', label: 'Strict aseptic precautions *' },
                    { key: 'appropriateSteps', label: 'Appropriate steps followed *' },
                    { key: 'numberOfPricks', label: 'Number of Pricks < or = 2 *' },
                    { key: 'haemostasisAchieved', label: 'Haemostasis Achieved *' },
                    { key: 'fixedWithPad', label: 'Fixed with sterile Pad *' },
                    { key: 'needleFreeConnector', label: 'Needle free connector used *' },
                    { key: 'handwashAfterGloves', label: 'Handwash or hand rub after removing gloves *' },
                    { key: 'ultrasoundGuidance', label: 'Ultrasound Guidance Used *' }
                  ].map((field) => (
                    <div key={field.key} className="bg-white p-4 rounded-md border border-gray-200">
                      <Form.Item
                        label={field.label}
                        name={field.key}
                        rules={[{ required: true, message: 'Please select an option' }]}
                      >
                        <Radio.Group className="flex space-x-8">
                          {['Yes', 'No'].map(option => (
                            <Radio key={option} value={option}>
                              <span className={option === 'Yes' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                {option}
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  ))}
                </div>

                {/* Categorical Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Catheter types *"
                    name="catheterTypes"
                    rules={[{ required: true, message: 'Please select catheter type' }]}
                  >
                    <Radio.Group>
                      {['CVC', 'PICC', 'Umbilical catheter', 'Feeding Tube'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Site *"
                    name="site"
                    rules={[{ required: true, message: 'Please select site' }]}
                  >
                    <Radio.Group>
                      {['Umbilical', 'Peripheral', 'Femoral', 'IJV', 'Subclavian'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>

                {/* Additional Categorical Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Side *"
                    name="side"
                    rules={[{ required: true, message: 'Please select side' }]}
                  >
                    <Radio.Group>
                      {['Right', 'Left', 'NA'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Limb *"
                    name="limb"
                    rules={[{ required: true, message: 'Please select limb' }]}
                  >
                    <Radio.Group>
                      {['Upper', 'Lower', 'NA'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Position Confirm on CXR"
                    name="positionConfirm"
                    rules={[{ required: true, message: 'Please select position confirmation' }]}
                  >
                    <Radio.Group>
                      {['USG', 'CXR', 'Unconfirmed'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Repositioning Required *"
                    name="repositioningRequired"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      {['Yes', 'No'].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label="Fixed at ____ cm *"
                    name="fixedAt"
                    rules={[{ required: true, message: 'Please enter depth' }]}
                  >
                    <Input placeholder="Enter depth in cm" />
                  </Form.Item>

                  <Form.Item
                    label="Date/Time of insertion *"
                    name="dateTimeInsertion"
                    rules={[{ required: true, message: 'Please enter date and time' }]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Bundle */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('maintenance')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Bundle</h3>
              {expandedSections.maintenance ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
                          {expandedSections.maintenance && (
                <div className="p-6 border-t border-gray-200 space-y-4">
                  {[
                    { key: 'washHandsMaintenance', label: 'Wash hands with soap and water f/b Hand Rub (As per policy) *' },
                    { key: 'assessedNeed', label: 'Assessed the need of central lines *' },
                    { key: 'sterileDressing', label: 'Used sterile semipermeable dressing and is intact *' },
                    { key: 'eachLumenFlushed', label: 'Each lumen flushed *' },
                    { key: 'noErythema', label: 'No Signs of Erythema / Infection *' },
                    { key: 'washHandsHubCare', label: 'Hub Care: Wash hands with soap and water f/b Hand Rub (As per policy) *' },
                    { key: 'wearSterileGloves', label: 'Wear sterile gloves *' },
                    { key: 'scrubPort', label: 'Scrub access port for 15s & allow it to dry *' },
                    { key: 'sterileField', label: 'Sterile field maintained *' }
                  ].map((field) => (
                    <div key={field.key} className="bg-white p-4 rounded-md border border-gray-200">
                      <Form.Item
                        label={field.label}
                        name={field.key}
                        rules={[{ required: true, message: 'Please select an option' }]}
                      >
                        <Radio.Group className="flex space-x-8">
                          {['Yes', 'No'].map(option => (
                            <Radio key={option} value={option}>
                              <span className={option === 'Yes' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                {option}
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Removal Bundle */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('removal')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Removal Bundle</h3>
              {expandedSections.removal ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
                          {expandedSections.removal && (
                <div className="p-6 border-t border-gray-200 space-y-6">
                  <Form.Item
                    label="Date of Removal *"
                    name="dateOfRemoval"
                    rules={[{ required: true, message: 'Please enter date of removal' }]}
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Form.Item
                    label="Reason for Removal *"
                    name="reasonForRemoval"
                    rules={[{ required: true, message: 'Please select reason for removal' }]}
                  >
                    <Radio.Group>
                      {[
                        'Insertion outside',
                        'Suspected/Confirmed infection at central line insertion site',
                        'Patient no longer needs central line',
                        'Central line blocked/not working',
                        'Reached maximum days'
                      ].map(option => (
                        <Radio key={option} value={option}>
                          {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    label="Tip culture sent *"
                    name="tipCultureSent"
                    rules={[{ required: true, message: 'Please select an option' }]}
                  >
                    <Radio.Group className="flex space-x-8">
                      {['Yes', 'No'].map(option => (
                        <Radio key={option} value={option}>
                          <span className={option === 'Yes' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                            {option}
                          </span>
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>
              )}
          </div>

          {/* Compliance Display */}
          <ComplianceDisplay
            complianceScore={compliance.score}
            complianceLevel={complianceLevel}
            totalFields={compliance.totalFields}
            completedFields={compliance.completedFields}
            lowCompliance={compliance.score < 80}
          />

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
