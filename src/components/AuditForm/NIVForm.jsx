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
import { useAuth } from '../../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { calculateNIVCompliance } from '../../utils/complianceCalculation';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';


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
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

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
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const handleRespiratorySupportChange = (value) => {
    form.setFieldsValue({ respiratorySupport: value });
    setExpandedSections({
      common: true,
      cpap: value === 'CPAP',
      nippv: value === 'NIPPV',
      hfnc: value === 'HFNC',
    });
  };

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
        nicuArea: values.nicuArea || 'Unknown Area',
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
        bedsideStaffName: values.bedsideStaffName,
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
              label="Patient Name *"
              name="patientName"
              rules={[{ required: true, message: 'Please enter patient name' }]}
            >
              <Input placeholder="Enter patient name" />
            </Form.Item>
            <Form.Item label="Bedside Staff Name" name="bedsideStaffName">
              <Input placeholder="Enter bedside staff name" />
            </Form.Item>
            <Form.Item
              label="NICU Area"
              name="nicuArea"
              rules={[{ required: true, message: 'Please select NICU Area' }]}
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

          {/* Common Questions / Respiratory Support */}
          <Form.Item
            label="Type of Respiratory Support *"
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
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Common Questions</h3>
              {[
                { key: 'appropriateSize', label: 'Appropriate size prongs / mask used *' },
                { key: 'skinBarrier', label: 'Skin barrier applied- hydrocolloid/silicon barrier (Tegaderm is an alternative) *' },
                { key: 'gapNasalSeptum', label: '2 mm gap between nasal septum and the prong/ septum *' },
                { key: 'skinBlanched', label: 'Skin on nasal septum blanched *' },
                { key: 'prongsSecured', label: 'Prongs secured with a tape - to reduce moment *' },
                { key: 'tractionInterface', label: 'Traction on the interface *' },
                { key: 'circuitSecured', label: 'Circuit is supported and secured *' },
                { key: 'gentleMassage', label: 'Gentle massage of nasal septum and bridge done in past 24 hours *' },
                { key: 'humidification', label: 'Humidification is on *' },
              ].map(({ key, label }) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={label}
                  rules={[{ required: true, message: 'This field is required' }]}
                >
                  <Radio.Group className="flex space-x-8">
                    <Radio value="Yes">Yes</Radio>
                    <Radio value="No">No</Radio>
                  </Radio.Group>
                </Form.Item>
              ))}
              <Form.Item
                label="Nasal septum trauma *"
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
              
              {/* Audit Image Upload */}
              <Form.Item label="Audit Image" name="auditImage">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      form.setFieldsValue({ auditImage: file });
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </Form.Item>
            </div>
          )}

          {/* CPAP Section */}
          {expandedSections.cpap && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">CPAP</h3>
              
              {/* Description (optional) */}
              <Form.Item label="Description (optional)" name="cpapDescription">
                <Input.TextArea rows={3} placeholder="Enter CPAP description..." />
              </Form.Item>
              
              <Form.Item
                label="Type of CPAP *"
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
                label="Nasal Interface used *"
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
                label="Snugly fitting prongs, (If Rams cannula 80% of nares covered) (Checked with the camera focused and ascertained) *"
                name="snugFitCPAP"
                rules={[{ required: true, message: 'Please specify snug fit' }]}
              >
                <Radio.Group className="flex space-x-8">
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="Bubbling present (for bubble CPAP)" name="bubblingPresent">
                <Radio.Group className="flex space-x-8">
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* NIPPV Section */}
          {expandedSections.nippv && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">NIPPV</h3>
              
              {/* Description (optional) */}
              <Form.Item label="Description (optional)" name="nippvDescription">
                <Input.TextArea rows={3} placeholder="Enter NIPPV description..." />
              </Form.Item>
              
              <Form.Item
                label="Nasal Interface used *"
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
                label="Snugly fitting prongs, (If Rams cannula 80% of nares covered) (Checked with the camera focused and ascertained) *"
                name="snugFitNIPPV"
                rules={[{ required: true, message: 'Please specify snug fit' }]}
              >
                <Radio.Group className="flex space-x-8">
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
          )}

          {/* HFNC Section */}
          {expandedSections.hfnc && (
            <div className="bg-purple-50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">HFNC</h3>
              
              {/* Description (optional) */}
              <Form.Item label="Description (optional)" name="hfncDescription">
                <Input.TextArea rows={3} placeholder="Enter HFNC description..." />
              </Form.Item>
              
              <Form.Item
                label="Nasal Interface used *"
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
                label="50% of Nares Covered by Nasal Prongs (Checked with the camera focused and ascertained) *"
                name="naresCoveredHFNC"
                rules={[{ required: true, message: 'Please indicate coverage' }]}
              >
                <Radio.Group className="flex space-x-8">
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
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
