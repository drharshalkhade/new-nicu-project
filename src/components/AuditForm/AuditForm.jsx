import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, Upload, X } from 'lucide-react';
import { Form, Input, Select, DatePicker, TimePicker, Checkbox, Button, message } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';

const { TextArea } = Input;
const { Option } = Select;

const AuditForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const hcpProviders = ['Doctor', 'Nurse', 'Housekeeping', 'Radiology', 'Others'];
  const hospitalOptions = [
    'General Hospital',
    "Children's Hospital",
    'University Medical Center',
    'Community Hospital',
  ];

  const whoMoments = [
    { key: 'beforePatientContact', label: 'Moment 1: Before touching patients', description: 'When approaching the patient before any contact' },
    { key: 'beforeAsepticProcedure', label: 'Moment 2: Before Clean Procedures', description: 'Before any aseptic task or handling invasive devices' },
    { key: 'afterBodyFluidExposure', label: 'Moment 3: After risk of body fluid exposure', description: 'After contact with body fluids or contaminated surfaces' },
    { key: 'afterPatientContact', label: 'Moment 4: After touching patients', description: 'After any contact with the patient' },
    { key: 'afterPatientSurroundings', label: 'Moment 5: After touching surroundings', description: 'After contact with surfaces near the patient' },
  ];

  const glovesRequiredOptions = [
    'Intubation',
    'IV line insertion',
    'Central line insertion',
    'Central line Maintenance',
    'Drug administration',
    'Other',
  ];

  // On Image Upload
  const handleImageUpload = e => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      message.warning('Maximum 5 images allowed.');
      return;
    }
    const urls = files.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...urls]);
  };

  const removeImage = index => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Compute compliance rate from selected moments
  const computeCompliance = values => {
    const moments = values.moments || {};
    const total = Object.keys(moments).length;
    const compliant = Object.values(moments).filter(Boolean).length;
    return total ? compliant / total : 0;
  };

  // Form Submission
  const onFinish = async values => {
    setSubmitting(true);
    try {
      const compliance = computeCompliance(values);

      const auditData = {
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        email: user?.email || '',
        patientName: values.patientName || '',
        bedsideStaffName: values.bedsideStaffName || '',
        hospitalName: values.hospitalName,
        hcpProvider: values.hcpProvider,
        typeOfOpportunity: Object.entries(values.moments || {})
          .filter(([, checked]) => checked)
          .map(([key]) => key),
        moments: values.moments,
        adherenceToTechnique: values.adherenceToTechnique,
        timeDuration: values.timeDuration,
        glovesRequired: values.glovesRequired,
        glovesRequiredFor: values.glovesRequiredFor || [],
        glovesUsed: values.glovesUsed,
        notifiedBedside: values.notifiedBedside,
        comments: values.comments,
        uploadedImages,
        compliance,
      };

      await createAudit(auditData);

      setShowSuccess(true);
      message.success('Audit submitted successfully! Redirecting...');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      message.error('Failed to submit audit.');
      console.error(error);
    }
    setSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-green-50 border border-green-200 rounded-lg p-10 text-center">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
          <h2 className="text-2xl font-semibold text-green-900 mb-2">Audit Submitted Successfully!</h2>
          <p className="text-green-700">You will be redirected to the dashboard shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Hand Hygiene Audit Form</h1>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{
          date: dayjs(),
          time: dayjs(),
          hcpProvider: '',
          moments: {},
          adherenceToTechnique: '',
          timeDuration: '',
          glovesRequired: '',
          glovesRequiredFor: [],
          glovesUsed: '',
          notifiedBedside: '',
          hospitalName: '',
        }}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Form.Item label="Email" name="email" initialValue={user?.email} rules={[{ required: true, message: 'Please input your email!' }]}>
              <Input disabled />
            </Form.Item>

            <Form.Item label="Patient Name" name="patientName">
              <Input placeholder="Patient full name" />
            </Form.Item>

            <Form.Item label="Bedside Staff Name" name="bedsideStaffName">
              <Input placeholder="Staff name" />
            </Form.Item>

            <Form.Item label="Hospital Name" name="hospitalName" rules={[{ required: true, message: 'Please select hospital!' }]}>
              <Select placeholder="Select Hospital" allowClear>
                {hospitalOptions.map(hospital => (
                  <Option key={hospital} value={hospital}>{hospital}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Select date!' }]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Time" name="time" rules={[{ required: true, message: 'Select time!' }]}>
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
          </div>

          {/* Healthcare Provider */}
          <Form.Item label="Healthcare Provider Type" name="hcpProvider" rules={[{ required: true, message: 'Please select provider!' }]}>
            <Select placeholder="Select provider">
              {hcpProviders.map(provider => (
                <Option key={provider} value={provider}>{provider}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* WHO Moments */}
          <Form.Item label="Type of Opportunity (WHO 5 Moments)" name="moments" valuePropName="checked">
            <div className="space-y-3">
              {whoMoments.map(moment => (
                <Form.Item key={moment.key} name={['moments', moment.key]} valuePropName="checked" noStyle>
                  <Checkbox>
                    <div className="font-semibold">{moment.label}</div>
                    <small className="block text-gray-500">{moment.description}</small>
                  </Checkbox>
                </Form.Item>
              ))}
            </div>
          </Form.Item>

          {/* Technique Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Form.Item label="Adherence to Technique" name="adherenceToTechnique" rules={[{ required: true, message: 'Select adherence!' }]}>
              <Select placeholder="Number of steps">
                {['Less than 3', '3 to 5', '6'].map(opt => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Time Duration" name="timeDuration" rules={[{ required: true, message: 'Select time duration!' }]}>
              <Select placeholder="Duration of hand rub">
                {['<10 sec', '10-20 sec', '>20 sec'].map(opt => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Gloves Section */}
          <Form.Item label="Gloves Required" name="glovesRequired" rules={[{ required: true, message: 'Please select!' }]}>
            <Select placeholder="Are gloves required?">
              {['Yes', 'No'].map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Gloves Required For */}
          <Form.Item shouldUpdate={(prevValues, curValues) => prevValues.glovesRequired !== curValues.glovesRequired}>
            {({ getFieldValue }) => getFieldValue('glovesRequired') === 'Yes' && (
              <Form.Item label="Gloves required for" name="glovesRequiredFor" rules={[{ required: true, message: 'Select at least one' }]}>
                <Checkbox.Group options={glovesRequiredOptions} />
              </Form.Item>
            )}
          </Form.Item>

          {/* Gloves Used */}
          <Form.Item label="Gloves Used" name="glovesUsed" rules={[{ required: true, message: 'Please select!' }]}>
            <Select placeholder="Were gloves used?">
              {['Yes', 'No'].map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Notified Bedside */}
          <Form.Item label="Notified Bedside" name="notifiedBedside" rules={[{ required: true, message: 'Please select!' }]}>
            <Select placeholder="Was bedside notified?">
              {['Yes', 'No'].map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Comments */}
          <Form.Item label="Additional Comments" name="comments">
            <TextArea rows={4} placeholder="Additional observations or notes" />
          </Form.Item>

          {/* Image Upload */}
          <Form.Item label="Upload Images">
            <input
              multiple
              accept="image/*"
              type="file"
              className="hidden"
              id="image-upload"
              onChange={handleImageUpload}
            />
            <label htmlFor="image-upload" className="cursor-pointer inline-block rounded border border-dashed border-gray-300 p-4 w-full text-center text-gray-500 hover:bg-gray-50">
              <Upload className="mx-auto mb-2 text-gray-400" size={36} />
              Click to Upload (Max 5 images, 10MB each)
            </label>
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {uploadedImages.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`upload-${idx}`} className="object-cover w-full h-24 rounded-md" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 hidden group-hover:block"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <div className="flex justify-end space-x-4">
              <Button onClick={() => navigate('/dashboard')} disabled={submitting}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} disabled={!form.isFieldsTouched(true) || !!form.getFieldsError().filter(({ errors }) => errors.length).length}>
                <Save className="mr-2" /> Submit
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AuditForm;
