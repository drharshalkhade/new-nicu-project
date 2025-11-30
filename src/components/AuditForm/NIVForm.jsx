import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  ArrowLeft,
  LayoutDashboard,
  Wind,
  Activity,
  Scan,
  Trash2
} from 'lucide-react';
import { Form, Input, Select, Button, message, Spin, Card, Tag } from 'antd';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { useAuth } from '../../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { calculateNIVCompliance } from '../../utils/complianceCalculation';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import {
  respiratorySupportOptions,
  nasalTraumaOptions,
  cpapTypes,
  nasalInterfaces,
  hfncInterfaces,
  yesNoOptions
} from '../../constant/audit-options';

const { Option } = Select;

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
  const [imagePreview, setImagePreview] = useState(null);
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
        auditImage: values.auditImage || null,
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

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      form.setFieldsValue({ auditImage: file });
    } else {
      setImagePreview(null);
      form.setFieldsValue({ auditImage: null });
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setFieldsValue({ auditImage: null });
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-2">NIV Audit Submitted!</h2>
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
                <h1 className="text-xl font-bold text-gray-900">NIV Audit</h1>
                <p className="text-xs text-gray-500">Respiratory Support Compliance</p>
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
          layout="vertical"
          className="space-y-8"
          onFinish={handleSubmit}
          initialValues={{
            respiratorySupport: '',
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

              <Form.Item label="Patient Name" name="patientName" rules={[{ required: true }]}>
                <Input size="large" placeholder="Patient Name" />
              </Form.Item>

              <Form.Item label="Bedside Staff Name" name="bedsideStaffName">
                <Input size="large" placeholder="Staff Name" />
              </Form.Item>
            </div>
          </Card>

          {/* Section 2: Respiratory Support */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Wind className="text-purple-600" size={20} />
                Respiratory Support
              </h3>
            </div>
            <Form.Item
              name="respiratorySupport"
              rules={[{ required: true, message: 'Please select support type' }]}
            >
              <SelectionCard
                options={respiratorySupportOptions}
                cols={3}
                onChange={handleRespiratorySupportChange}
              />
            </Form.Item>
          </Card>

          {/* Common Section */}
          {expandedSections.common && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="text-purple-600" size={20} />
                  Common Assessment
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  { key: 'appropriateSize', label: 'Appropriate size prongs / mask used' },
                  { key: 'skinBarrier', label: 'Skin barrier applied (hydrocolloid/silicon/Tegaderm)' },
                  { key: 'gapNasalSeptum', label: '2 mm gap between nasal septum and prong/septum' },
                  { key: 'skinBlanched', label: 'Skin on nasal septum blanched' },
                  { key: 'prongsSecured', label: 'Prongs secured with tape' },
                  { key: 'tractionInterface', label: 'Traction on the interface' },
                  { key: 'circuitSecured', label: 'Circuit is supported and secured' },
                  { key: 'gentleMassage', label: 'Gentle massage of nasal septum done in past 24h' },
                  { key: 'humidification', label: 'Humidification is on' },
                ].map(({ key, label }) => (
                  <Form.Item key={key} label={label} name={key} rules={[{ required: true }]}>
                    <SelectionCard cols={2} options={yesNoOptions} />
                  </Form.Item>
                ))}

                <Form.Item label="Nasal septum trauma" name="nasalTrauma" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={nasalTraumaOptions} />
                </Form.Item>
              </div>

              <div className="mt-6">
                <Form.Item label="Audit Image">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="relative h-40 mx-auto rounded-lg overflow-hidden shadow-sm">
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeImage();
                          }}
                          className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="bg-purple-50 p-3 rounded-full mb-3">
                          <Scan className="text-purple-500" size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Click to upload</p>
                        <p className="text-xs text-gray-500">SVG, PNG, JPG</p>
                      </div>
                    )}
                  </div>
                </Form.Item>
              </div>
            </Card>
          )}

          {/* CPAP Section */}
          {expandedSections.cpap && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Wind className="text-purple-600" size={20} />
                  CPAP Specifics
                </h3>
              </div>

              <Form.Item label="Description (optional)" name="cpapDescription">
                <Input.TextArea rows={3} placeholder="Enter CPAP description..." className="rounded-xl" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label="Type of CPAP" name="typeOfCPAP" rules={[{ required: true }]}>
                  <SelectionCard cols={1} options={cpapTypes} />
                </Form.Item>

                <Form.Item label="Nasal Interface used" name="nasalInterfaceCPAP" rules={[{ required: true }]}>
                  <SelectionCard cols={1} options={nasalInterfaces} />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 gap-6 mt-6">
                <Form.Item
                  label="Snugly fitting prongs (80% nares covered)"
                  name="snugFitCPAP"
                  rules={[{ required: true }]}
                >
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>

                <Form.Item label="Bubbling present (for bubble CPAP)" name="bubblingPresent">
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
              </div>
            </Card>
          )}

          {/* NIPPV Section */}
          {expandedSections.nippv && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Wind className="text-purple-600" size={20} />
                  NIPPV Specifics
                </h3>
              </div>

              <Form.Item label="Description (optional)" name="nippvDescription">
                <Input.TextArea rows={3} placeholder="Enter NIPPV description..." className="rounded-xl" />
              </Form.Item>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item label="Nasal Interface used" name="nasalInterfaceNIPPV" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={nasalInterfaces} />
                </Form.Item>

                <Form.Item
                  label="Snugly fitting prongs (80% nares covered)"
                  name="snugFitNIPPV"
                  rules={[{ required: true }]}
                >
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
              </div>
            </Card>
          )}

          {/* HFNC Section */}
          {expandedSections.hfnc && (
            <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Wind className="text-purple-600" size={20} />
                  HFNC Specifics
                </h3>
              </div>

              <Form.Item label="Description (optional)" name="hfncDescription">
                <Input.TextArea rows={3} placeholder="Enter HFNC description..." className="rounded-xl" />
              </Form.Item>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item label="Nasal Interface used" name="nasalInterfaceHFNC" rules={[{ required: true }]}>
                  <SelectionCard cols={2} options={hfncInterfaces} />
                </Form.Item>

                <Form.Item
                  label="50% of Nares Covered by Nasal Prongs"
                  name="naresCoveredHFNC"
                  rules={[{ required: true }]}
                >
                  <SelectionCard cols={2} options={yesNoOptions} />
                </Form.Item>
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
              disabled={isSubmitting || !form.getFieldValue('respiratorySupport')}
              icon={<Save size={18} />}
              className="px-8 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
            >
              Submit Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default NIVForm;
