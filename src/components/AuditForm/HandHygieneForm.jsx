import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  X,
  ArrowLeft,
  Scan,
  Users,
  Activity,
  ShieldAlert,
  LayoutDashboard,
  Trash2
} from 'lucide-react';
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Card,
  Tag,
  Divider
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useSupabaseAudits } from '../../hooks/useSupabaseAudits';
import { calculateHandHygieneCompliance } from '../../utils/complianceCalculation';
import { useAuth } from '../../hooks/useAuth';
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import {
  hcpOptions,
  opportunityTypes,
  adherenceStepsOptions,
  handRubDurationOptions,
  glovesRequiredForOptions,
  yesNoOptions
} from '../../constant/audit-options';

const { TextArea } = Input;
const { Option } = Select;

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
  const watchedNicuArea = Form.useWatch('nicuArea', form);
  const watchedHcp = Form.useWatch('hcp', form);
  const watchedOpportunityType = Form.useWatch('opportunityType', form);

  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  const onFinish = async (values) => {
    try {
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
        adherenceSteps: values.adherenceSteps || '',
        handRubDuration: values.handRubDuration || '',
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit Submitted!</h2>
          <p className="text-gray-500 mb-8">Your hand hygiene audit has been successfully recorded.</p>
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
                <h1 className="text-xl font-bold text-gray-900">Hand Hygiene Audit</h1>
                <p className="text-xs text-gray-500">WHO 5 Moments Protocol</p>
              </div>
            </div>
            <Tag color="blue" className="px-3 py-1 rounded-full">
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
          className="space-y-8"
          initialValues={{
            hcp: [],
            opportunityType: [],
            adherenceSteps: null,
            handRubDuration: null,
            glovesRequiredFor: [],
          }}
        >
          {/* Section 1: Context */}
          <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-blue-600" size={20} />
                Audit Context
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label="NICU Area"
                name="nicuArea"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select
                  size="large"
                  placeholder="Select Area"
                  loading={loadingAreas}
                  onChange={value => form.setFieldsValue({ nicuAreaId: value })}
                  className="w-full"
                >
                  {nicuAreas.map((area) => (
                    <Option key={area.id} value={area.name}>{area.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="nicuAreaId" hidden><Input /></Form.Item>

              <Form.Item label="Patient Name (Optional)" name="patientName">
                <Input size="large" placeholder="Patient Identifier" />
              </Form.Item>

              <Form.Item label="Staff Name (Optional)" name="bedsideStaffName">
                <Input size="large" placeholder="Staff Name" />
              </Form.Item>
            </div>
          </Card>

          {/* Section 2: Healthcare Provider */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                Healthcare Provider <span className="text-red-500">*</span>
              </h3>
            </div>
            <Form.Item
              name="hcp"
              rules={[{ required: true, message: 'Select at least one provider' }]}
            >
              <SelectionCard options={hcpOptions} multi={true} cols={3} />
            </Form.Item>
          </Card>

          {/* Section 3: Moments */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                WHO 5 Moments <span className="text-red-500">*</span>
              </h3>
            </div>
            <Form.Item
              name="opportunityType"
              rules={[{ required: true, message: 'Select at least one moment' }]}
            >
              <SelectionCard options={opportunityTypes} multi={true} cols={2} />
            </Form.Item>
          </Card>

          {/* Section 4: Technique */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={20} />
                Technique Assessment
              </h3>
            </div>

            <div className="space-y-6">
              <Form.Item
                label="Adherence to Steps"
                name="adherenceSteps"
                rules={[{ required: true, message: 'Required' }]}
              >
                <SelectionCard options={adherenceStepsOptions} multi={false} cols={4} />
              </Form.Item>

              <Divider dashed />

              <Form.Item
                label="Duration of Hand Rub"
                name="handRubDuration"
                rules={[{ required: true, message: 'Required' }]}
              >
                <SelectionCard options={handRubDurationOptions} multi={false} cols={4} />
              </Form.Item>
            </div>
          </Card>

          {/* Section 5: Gloves */}
          <Card className="shadow-sm border-gray-100 rounded-2xl bg-gradient-to-br from-purple-50 to-white" bordered={false}>
            <div className="border-b border-purple-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <ShieldAlert className="text-purple-600" size={20} />
                Gloves & Safety
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Form.Item
                  label="Gloves Required?"
                  name="glovesRequired"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <SelectionCard
                    cols={2}
                    options={yesNoOptions}
                  />
                </Form.Item>

                <Form.Item
                  label="Gloves Used?"
                  name="glovesUsed"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <SelectionCard
                    cols={2}
                    options={yesNoOptions}
                  />
                </Form.Item>

                <Form.Item
                  label="Notified Bedside?"
                  name="notifiedBedside"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <SelectionCard
                    cols={2}
                    options={yesNoOptions}
                  />
                </Form.Item>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-100">
                <Form.Item
                  label="Gloves Required For"
                  name="glovesRequiredFor"
                >
                  <SelectionCard options={glovesRequiredForOptions} multi={true} cols={1} />
                </Form.Item>
              </div>
            </div>
          </Card>

          {/* Section 6: Evidence */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Save className="text-blue-600" size={20} />
                Evidence & Notes
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item label="Comments" name="comments">
                <TextArea
                  rows={4}
                  placeholder="Add any additional context..."
                  className="rounded-xl resize-none"
                />
              </Form.Item>

              <Form.Item label="Photo Evidence">
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
                      <div className="bg-blue-50 p-3 rounded-full mb-3">
                        <Scan className="text-blue-500" size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Click to upload</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG</p>
                    </div>
                  )}
                </div>
              </Form.Item>
            </div>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 pb-20">
            <Button
              size="large"
              onClick={() => navigate('/audit')}
              className="px-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<Save size={18} />}
              disabled={!watchedNicuArea || !watchedHcp?.length || !watchedOpportunityType?.length}
              className="px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              Submit Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default HandHygieneForm;
