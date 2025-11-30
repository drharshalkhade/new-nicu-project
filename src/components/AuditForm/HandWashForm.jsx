import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  CheckCircle,
  Upload,
  X,
  ArrowLeft,
  LayoutDashboard,
  Droplets,
  Scan,
  Trash2
} from "lucide-react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Spin,
  Card,
  Tag
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useSupabaseAudits } from "../../hooks/useSupabaseAudits";
import { useAuth } from "../../hooks/useAuth";
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import SelectionCard from '../common-components/SelectionCard';
import { handWashSteps, yesNoOptions } from '../../constant/audit-options';

const { Option } = Select;

const HandWashForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);
  const dispatch = useDispatch();
  const nicuAreas = useSelector(state => state.nicuArea.areas);
  const loadingAreas = useSelector(state => state.nicuArea.loading);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();
  const watchedNicuArea = Form.useWatch('nicuArea', form);

  // Fetch NICU Areas for current user's organization
  useEffect(() => {
    if (profile?.organization_id && nicuAreas.length === 0 && !loadingAreas) {
      dispatch(fetchNicuAreas(profile.organization_id));
    }
  }, [profile?.organization_id]);

  // Handle form submission
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const auditRecord = {
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        observerId: user?.id || "unknown",
        observerName: user?.name || "Unknown Observer",
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuAreaId)?.name || "Unknown Area",
        nicuAreaId: values.nicuAreaId,
        nicuArea: values.nicuArea,

        patientName: values.patientName,
        bedsideName: values.bedsideName,
        image: imageFile || null,
        // Include step values
        ...values
      };
      await createAudit(auditRecord);
      message.success("Audit successfully submitted!");
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      message.error("Error submitting audit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle image input and preview
  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setFieldsValue({ imageUpload: null });
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit Submitted!</h2>
          <p className="text-gray-500 mb-8">Your hand wash audit has been successfully recorded.</p>
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
                <h1 className="text-xl font-bold text-gray-900">Hand Wash Checklist</h1>
                <p className="text-xs text-gray-500">SUMANK Protocol Compliance</p>
              </div>
            </div>
            <Tag color="cyan" className="px-3 py-1 rounded-full">
              {new Date().toLocaleDateString()}
            </Tag>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          className="space-y-8"
        >
          {/* Section 1: Context */}
          <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-cyan-600" size={20} />
                Audit Context
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label="NICU Area"
                name="nicuArea"
                rules={[{ required: true, message: "Required" }]}
              >
                {loadingAreas ? (
                  <Spin />
                ) : (
                  <Select
                    size="large"
                    placeholder="Select Area"
                    showSearch
                    filterOption={(input, option) =>
                      option?.children.toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={(value, option) => {
                      const selectedArea = nicuAreas.find(area => area.name === value);
                      if (selectedArea) {
                        form.setFieldsValue({ nicuAreaId: selectedArea.id });
                      }
                    }}
                  >
                    {nicuAreas.map((n) => (
                      <Option key={n.id} value={n.name}>{n.name}</Option>
                    ))}
                  </Select>
                )}
              </Form.Item>

              <Form.Item name="nicuAreaId" hidden><Input /></Form.Item>

              <Form.Item label="Patient Name" name="patientName">
                <Input size="large" placeholder="Patient Identifier" />
              </Form.Item>

              <Form.Item label="Staff Name" name="bedsideName">
                <Input size="large" placeholder="Staff Name" />
              </Form.Item>
            </div>
          </Card>

          {/* Section 2: Steps */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Droplets className="text-cyan-600" size={20} />
                Hand Wash Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {handWashSteps.map(({ label, key, icon }) => (
                <Form.Item
                  key={key}
                  label={
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{icon}</span>
                      <span>{label}</span>
                    </div>
                  }
                  name={key}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <SelectionCard
                    cols={2}
                    options={yesNoOptions}
                  />
                </Form.Item>
              ))}
            </div>
          </Card>

          {/* Section 3: Evidence */}
          <Card className="shadow-sm border-gray-100 rounded-2xl" bordered={false}>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Save className="text-cyan-600" size={20} />
                Evidence
              </h3>
            </div>

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
                    <div className="bg-cyan-50 p-3 rounded-full mb-3">
                      <Scan className="text-cyan-500" size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Click to upload</p>
                    <p className="text-xs text-gray-500">SVG, PNG, JPG</p>
                  </div>
                )}
              </div>
            </Form.Item>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 pb-20">
            <Button
              size="large"
              onClick={() => navigate('/audit')}
              disabled={submitting}
              className="px-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              icon={<Save size={18} />}
              disabled={submitting || !watchedNicuArea}
              className="px-8 rounded-xl bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-200"
            >
              Submit Audit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default HandWashForm;
