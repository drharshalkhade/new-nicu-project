import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import {
  Form,
  Input,
  Select,
  Radio,
  Button,
  message,
  Checkbox,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { calculateHandHygieneCompliance } from '../../utils/complianceCalculation';
import { useAuth } from '../../hooks/useAuth';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';


const { TextArea } = Input;
const { Option } = Select;

const hcpOptions = ['Doctor', 'Nurse', 'Housekeeping', 'Radiology', 'Others'];
const opportunityTypes = [
  'Moment 1 - Before touching patients',
  'Moment 2 - Before Clean Procedure',
  'Moment 3 - After risk of body fluid exposure',
  'Moment 4 - After touching the Patients',
  'Moment 5 - After touching surroundings',
];
const adherenceStepsOptions = ['Less than 3', '3 to 5 steps', '6 Steps', '0 Steps'];
const handRubDurationOptions = ['<10 sec', '10-20 sec', '>20 sec', '0 sec'];
const glovesRequiredForOptions = [
  'Intubation',
  'IV line insertion',
  'Central line insertion',
  'Central line Maintenance',
  'Drug administration',
  'Other',
];

const HandHygieneForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const calculateCompliance = (values) => {
    try {
      const result = calculateHandHygieneCompliance(values);
      return result;
    } catch (e) {
      return { score: 0, e };
    }
  };

  const onFinish = async (values) => {
    try {
      // Add observerId/Name and compliance calculation
      const moments = {
        beforePatientContact: values.opportunityType?.includes('Moment 1 - Before touching patients') || false,
        beforeAsepticProcedure: values.opportunityType?.includes('Moment 2 - Before Clean Procedure') || false,
        afterBodyFluidExposure: values.opportunityType?.includes('Moment 3 - After risk of body fluid exposure') || false,
        afterPatientContact: values.opportunityType?.includes('Moment 4 - After touching the Patients') || false,
        afterPatientSurroundings: values.opportunityType?.includes('Moment 5 - After touching surroundings') || false,
      };
      const complianceResult = calculateHandHygieneCompliance(values);
      const auditRecord = {
        observerId: user?.id || 'unknown',
        observerName: user?.name || 'Unknown Observer',
        staffRole: values.hcp ? values.hcp.join(', ') : 'Unknown',
        nicuArea: values.nicuArea || 'Unknown Area',
        nicuAreaId: values.nicuAreaId,
        moments,
        compliance: complianceResult.score / 100,
        notes: values.comments || undefined,
        patientName: values.patientName,
        bedsideStaffName: values.bedsideStaffName,
        adherenceSteps: values.adherenceSteps ? values.adherenceSteps.join(', ') : '',
        handRubDuration: values.handRubDuration ? values.handRubDuration.join(', ') : '',
        glovesRequired: values.glovesRequired,
        glovesRequiredFor: values.glovesRequiredFor ? values.glovesRequiredFor.join(', ') : '',
        glovesUsed: values.glovesUsed,
        notifiedBedside: values.notifiedBedside,
        imageUpload: values.imageUpload || null,
      };
      await createAudit(auditRecord);
      message.success('Audit submitted successfully');
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting audit:', err);
      message.error('Failed to submit audit. Please try again.');
    }
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      form.setFieldsValue({ imageUpload: file });
    } else {
      setImagePreview(null);
      form.setFieldsValue({ imageUpload: null });
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setFieldsValue({ imageUpload: null });
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Audit Submitted Successfully!</h2>
          <p className="text-green-700">Your hand hygiene audit has been recorded. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const complianceDetails = calculateCompliance(form.getFieldsValue());
  const isLowCompliance = complianceDetails.score / 100 < 0.8;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              onClick={() => navigate('/audit')}
              icon={<ArrowLeft className="h-6 w-6 text-blue-100" />}
              className="text-blue-100 hover:text-white transition-colors"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">Hand Hygiene Compliance Audit Form</h1>
              <p className="text-blue-100 mt-1">2025 - Based on WHO's 5 Moments for Hand Hygiene</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="p-6 space-y-8"
          initialValues={{
            hcp: [],
            opportunityType: [],
            adherenceSteps: [],
            handRubDuration: [],
            glovesRequiredFor: [],
          }}
        >
          {/* Basic Info Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item label="Patient Name" name="patientName">
                <Input placeholder="Enter patient name" />
              </Form.Item>
              <Form.Item label="Bedside Staff Name" name="bedsideStaffName">
                <Input placeholder="Enter staff name" />
              </Form.Item>
              <Form.Item
                label="NICU Area"
                name="nicuArea"
                rules={[{ required: true, message: 'Please select an NICU area' }]}
              >
                <Select
                  showSearch
                  placeholder="Select NICU Area"
                  loading={loadingAreas}
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={value => form.setFieldsValue({ nicuAreaId: value })}
                >
                  {nicuAreas.map((area) => (
                    <Option key={area.id} value={area.name}>
                      {area.name}
                    </Option>
                  ))}
                </Select>
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
          </div>

          {/* Healthcare Provider Type */}
          <Form.Item
            label="Healthcare Provider (HCP)*"
            name="hcp"
            rules={[{ required: true, message: 'Please select at least one healthcare provider' }]}
          >
            <Checkbox.Group>
              {hcpOptions.map(option => (
                <Checkbox key={option} value={option}>
                  {option}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          {/* WHO 5 Moments */}
          <Form.Item
            label="Type of Opportunity*"
            name="opportunityType"
            rules={[{ required: true, message: 'Please select at least one moment' }]}
          >
            <Checkbox.Group>
              {opportunityTypes.map(option => (
                <Checkbox key={option} value={option}>
                  {option}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          {/* Technique Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              label="Adherence to Technique: Number of Steps*"
              name="adherenceSteps"
              rules={[{ required: true, message: 'Please select your adherence steps' }]}
            >
              <Radio.Group className="flex space-x-8">
                {adherenceStepsOptions.map(option => (
                  <Radio key={option} value={option}>
                    {option}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Time Duration of Hand Rub*"
              name="handRubDuration"
              rules={[{ required: true, message: 'Please select hand rub duration' }]}
            >
              <Radio.Group className="flex space-x-8">
                {handRubDurationOptions.map(option => (
                  <Radio key={option} value={option}>
                    {option}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Gloves Assessment */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Gloves Assessment</h3>
            <Form.Item
              label="Gloves Required?"
              name="glovesRequired"
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
            <Form.Item
              label="Gloves Required For"
              name="glovesRequiredFor"
            >
              <Checkbox.Group>
                {glovesRequiredForOptions.map(option => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Form.Item>
            <Form.Item
              label="Gloves Used"
              name="glovesUsed"
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
            <Form.Item
              label="Notified Bedside*"
              name="notifiedBedside"
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



          {/* Comments */}
          <Form.Item label="Any Comments" name="comments">
            <TextArea rows={4} placeholder="Enter any additional observations or comments..." />
          </Form.Item>

          {/* Image Upload */}
          <Form.Item label="Upload Image if any*">
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="relative mt-3 w-48 h-32 rounded-md overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </Form.Item>

          {/* Submit Buttons */}
          <Form.Item>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button onClick={() => navigate('/audit')}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
              >
                <Save className="mr-2" />
                Submit
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default HandHygieneForm;
