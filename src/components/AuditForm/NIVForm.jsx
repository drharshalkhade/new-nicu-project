import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { Form, Input, Select, Radio, Button, message, Spin } from 'antd';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { calculateNIVCompliance, getComplianceLevel } from '../../utils/complianceCalculation';

const { Option } = Select;

const respiratorySupportOptions = ['CPAP', 'NIPPV', 'HFNC'];

const nasalTraumaOptions = [
  'No trauma',
  'Stage 1 - Non blanching erythema',
  'Stage 2 - Superficial erosion',
  'Stage 3 - Necrosis of skin',
];

const NIVForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
    const { user } = useAuth();
    const profile = useSelector(state => state.user.userDetails);

  const [nicuAreas, setNicuAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    common: true,
    cpap: false,
    nippv: false,
    hfnc: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id) fetchNicuAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchNicuAreas = async () => {
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
      console.error('Error fetching NICU areas:', error);
      setNicuAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  // const toggleSection = (section) => {
  //   setExpandedSections((prev) => ({
  //     ...prev,
  //     [section]: !prev[section],
  //   }));
  // };

  const handleRespiratorySupportChange = (value) => {
    form.setFieldsValue({ respiratorySupport: value });
    setExpandedSections({
      common: true,
      cpap: value === 'CPAP',
      nippv: value === 'NIPPV',
      hfnc: value === 'HFNC',
    });
  };

  // const calculateCompliance = () => {
  //   try {
  //     const values = form.getFieldsValue();
  //     const result = calculateNIVCompliance(values);
  //     return result.score / 100;
  //   } catch {
  //     return 0;
  //   }
  // };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const auditRecord = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        observerId: user?.id || 'unknown',
        observerName: user?.name || 'Unknown Observer',
        staffRole: 'NIV Audit',
        nicuArea: nicuAreas.find((area) => area.id === values.nicuAreaId)?.name || 'Unknown Area',
        nicuAreaId: values.nicuAreaId,
        moments: {
          beforePatientContact: false,
          beforeAsepticProcedure: false,
          afterBodyFluidExposure: false,
          afterPatientContact: false,
          afterPatientSurroundings: false,
        },
        compliance: calculateNIVCompliance(values).score / 100,
        notes: `NIV ${values.respiratorySupport} Audit - Patient: ${values.patientName}`,
        patientName: values.patientName,
        staffName: values.staffName,
        auditType: 'NIV',
        respiratorySupport: values.respiratorySupport,
        nivData: values,
      };

      await createAudit(auditRecord);

      setShowSuccess(true);
      message.success('NIV Audit submitted successfully! Redirecting...');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting audit:', error);
      message.error('Error submitting audit, please try again.');
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">NIV Audit Submitted Successfully!</h2>
          <p className="text-green-700">Your Non-Invasive Ventilation audit has been recorded. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const complianceDetails = calculateNIVCompliance(form.getFieldsValue());
  const complianceLevel = getComplianceLevel(complianceDetails.score);
  const isLowCompliance = complianceDetails.score / 100 < 0.8;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/audit')}
              className="text-purple-100 hover:text-white transition-colors"
              type="button"
              aria-label="Back to audits"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Non-Invasive Ventilation (CPAP/NIV/HFNC) Audit
              </h1>
              <p className="text-purple-100 mt-1">2025 - Respiratory Support Compliance Assessment</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="p-6 space-y-8"
          onFinish={handleSubmit}
          initialValues={{
            respiratorySupport: '',
          }}
        >
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
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
              rules={[{ required: true, message: 'Please select NICU Area' }]}
            >
              {loadingAreas ? (
                <Spin />
              ) : (
                <Select placeholder="Select NICU Area" allowClear>
                  {nicuAreas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.name}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </div>

          {/* Common Questions / Respiratory Support */}
          <Form.Item
            label="Type of Respiratory Support"
            name="respiratorySupport"
            rules={[{ required: true, message: 'Please select respiratory support type' }]}
          >
            <Select onChange={handleRespiratorySupportChange} placeholder="Select support type" allowClear>
              {respiratorySupportOptions.map((opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Sections: Common, CPAP, NIPPV, HFNC */}
          {/* Common Section */}
          {expandedSections.common && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              {[
                { key: 'appropriateSize', label: 'Appropriate size prongs / mask used' },
                { key: 'skinBarrier', label: 'Skin barrier applied - hydrocolloid/silicon barrier' },
                { key: 'gapNasalSeptum', label: '2 mm gap between nasal septum and prong/septum' },
                { key: 'skinBlanched', label: 'Skin on nasal septum blanched' },
                { key: 'prongsSecured', label: 'Prongs secured with tape to reduce movement' },
                { key: 'tractionInterface', label: 'Traction on the interface' },
                { key: 'circuitSecured', label: 'Circuit is supported and secured' },
                { key: 'gentleMassage', label: 'Gentle massage of nasal septum and bridge done in past 24 hours' },
                { key: 'humidification', label: 'Humidification is on' },
              ].map(({ key, label }) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={label}
                  rules={[{ required: true, message: 'This field is required' }]}
                >
                  <Radio.Group>
                    <Radio value="Yes">Yes</Radio>
                    <Radio value="No">No</Radio>
                  </Radio.Group>
                </Form.Item>
              ))}

              <Form.Item
                label="Nasal Trauma"
                name="nasalTrauma"
                rules={[{ required: true, message: 'Please select nasal trauma assessment' }]}
              >
                <Radio.Group>
                  {nasalTraumaOptions.map((option) => (
                    <Radio key={option} value={option}>
                      {option}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* CPAP Section */}
          {expandedSections.cpap && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <Form.Item
                label="Type of CPAP"
                name="typeOfCPAP"
                rules={[{ required: true, message: 'Please select CPAP type' }]}
              >
                <Radio.Group>
                  {['Bubble CPAP', 'Continuous CPAP (Ventilator)', 'Variable CPAP'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Nasal Interface CPAP"
                name="nasalInterfaceCPAP"
                rules={[{ required: true, message: 'Please select nasal interface' }]}
              >
                <Radio.Group>
                  {[
                    'Nasal Mask',
                    'Rams Cannula',
                    'Short Binasal Prongs',
                    'IFD',
                    'Other…',
                  ].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Snug Fit CPAP"
                name="snugFitCPAP"
                rules={[{ required: true, message: 'Please specify snug fit' }]}
              >
                <Radio.Group>
                  {['Yes', 'No'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Bubbling Present" name="bubblingPresent">
                <Radio.Group>
                  {['Yes', 'No'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* NIPPV Section */}
          {expandedSections.nippv && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <Form.Item
                label="Nasal Interface NIPPV"
                name="nasalInterfaceNIPPV"
                rules={[{ required: true, message: 'Please select nasal interface' }]}
              >
                <Radio.Group>
                  {['Rams Cannula', 'Short Binasal Prongs', 'Nasal Mask', 'Other…'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Snug Fit NIPPV"
                name="snugFitNIPPV"
                rules={[{ required: true, message: 'Please specify snug fit' }]}
              >
                <Radio.Group>
                  {['Yes', 'No'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* HFNC Section */}
          {expandedSections.hfnc && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <Form.Item
                label="Nasal Interface HFNC"
                name="nasalInterfaceHFNC"
                rules={[{ required: true, message: 'Please select nasal interface' }]}
              >
                <Radio.Group>
                  {['HFNC Prongs', 'Other…'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="50% of Nares Covered HFNC"
                name="naresCoveredHFNC"
                rules={[{ required: true, message: 'Please indicate coverage' }]}
              >
                <Radio.Group>
                  {['Yes', 'No'].map((opt) => (
                    <Radio key={opt} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* Compliance Rate Display */}
          {form.getFieldValue('respiratorySupport') && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {form.getFieldValue('respiratorySupport')} Compliance
                </h4>
                <div className="text-right">
                  <span
                    className={`text-lg font-bold ${
                      complianceLevel.color === 'green'
                        ? 'text-green-600'
                        : complianceLevel.color === 'yellow'
                        ? 'text-yellow-600'
                        : complianceLevel.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  >
                    {complianceDetails.score.toFixed(0)}%
                  </span>
                  <div className="text-xs text-gray-500">{complianceLevel.level}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    complianceLevel.color === 'green'
                      ? 'bg-green-500'
                      : complianceLevel.color === 'yellow'
                      ? 'bg-yellow-500'
                      : complianceLevel.color === 'orange'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${complianceDetails.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>
                  Fields Completed: {complianceDetails.completedFields}/{complianceDetails.totalFields}
                </span>
                <span>{complianceLevel.description}</span>
              </div>
              {complianceDetails.details.nasalTrauma && (
                <div
                  className={`p-2 rounded text-xs mb-2 ${
                    complianceDetails.details.nasalTrauma.score >= 75 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div
                    className={`font-medium mb-1 ${
                      complianceDetails.details.nasalTrauma.score >= 75
                        ? 'text-green-900'
                        : 'text-red-900'
                    }`}
                  >
                    Nasal Trauma Assessment:
                  </div>
                  <div
                    className={
                      complianceDetails.details.nasalTrauma.score >= 75
                        ? 'text-green-800'
                        : 'text-red-800'
                    }
                  >
                    {complianceDetails.details.nasalTrauma.value} (
                    {complianceDetails.details.nasalTrauma.score}% score)
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="font-medium text-blue-900">Common</div>
                  <div className="text-blue-800">
                    {complianceDetails.details.commonFieldsScore.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="font-medium text-purple-900">Specific</div>
                  <div className="text-purple-800">
                    {complianceDetails.details.specificFieldsScore.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <div className="font-medium text-orange-900">Safety</div>
                  <div className="text-orange-800">
                    {complianceDetails.details.nasalTraumaScore.toFixed(0)}%
                  </div>
                </div>
              </div>
              {isLowCompliance && (
                <div className="flex items-center space-x-2 mt-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Below 80% compliance threshold</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Section */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => navigate('/audit')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={isSubmitting || !form.getFieldValue('respiratorySupport')}
              loading={isSubmitting}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default NIVForm;
