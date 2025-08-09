import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  CheckCircle,
  Upload,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  Form,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  message,
  Spin,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useSupabaseAudits } from "../../hooks/useSupabaseAudits";
import { useAuth } from "../../hooks/useAuth";
import { calculateHandWashCompliance, getComplianceLevel } from "../../utils/complianceCalculation";
import { fetchNicuAreas } from '../../store/nicuAreaThunk';
import ComplianceDisplay from '../common-components/ComplianceDisplay';

const { TextArea } = Input;
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

  // Options for selections
  const hcpOptions = ["Doctor", "Nurse", "Housekeeping", "Radiology", "Others"];
  const opportunityOptions = [
    "Moment 1 - Before touching patients",
    "Moment 2 - Before Clean Procedure",
    "Moment 3 - After risk of body fluid exposure",
    "Moment 4 - After touching the Patients",
    "Moment 5 - After touching surroundings",
  ];
  const glovesForOptions = [
    "Intubation",
    "IV",
    "Central line insertion",
    "Central line maintenance",
    "Drug administration",
    "Other",
  ];

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
      // Calculate compliance score and details
      const complianceData = calculateHandWashCompliance(values);
      const auditRecord = {
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        observerId: user?.id || "unknown",
        observerName: user?.name || "Unknown Observer",
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuAreaId)?.name || "Unknown Area",
        nicuAreaId: values.nicuAreaId,
        hospitalName: values.hospitalName,
        complianceScore: complianceData.score,
        complianceLevel: getComplianceLevel(complianceData.score),
        patientName: values.patientName,
        bedsideName: values.bedsideName,
        image: imageFile || null,
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
      <div className="max-w-2xl mx-auto my-20">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Hand Wash Audit Submitted Successfully!
          </h2>
          <p className="text-green-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const currentValues = form.getFieldsValue();
  const complianceData = calculateHandWashCompliance(currentValues);
  const complianceLevel = getComplianceLevel(complianceData.score);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{
            hcp: [],
            opportunityType: [],
            adherence: [],
            duration: [],
            glovesFor: [],
          }}
        >
          <div className="bg-cyan-600 text-white p-6 flex items-center space-x-4 rounded-t-lg">
            <Button
              type="text"
              icon={<ArrowLeft />}
              onClick={() => navigate("/audit")}
              className="text-white"
            />
            <div>
              <h1 className="text-2xl font-bold">Hand Wash Checklist</h1>
              <p className="text-cyan-100 text-sm">
                2025 - SUMANK Protocol Compliance Assessment
              </p>
            </div>
            <div className="ml-auto bg-cyan-800 px-3 py-1 rounded-full text-lg font-semibold">
              {complianceData.score.toFixed(1)}%
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Section */}
            <div className="bg-cyan-50 p-6 rounded-lg">
              <h3 className="text-cyan-900 font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label="Patient Name" name="patientName">
                  <Input placeholder="Enter patient name" />
                </Form.Item>
                <Form.Item label="Bedside Staff Name" name="bedsideName">
                  <Input placeholder="Enter staff name" />
                </Form.Item>
                <Form.Item
                  label="Hospital Name *"
                  name="hospitalName"
                  rules={[{ required: true, message: "Please select a NICU area" }]}
                >
                  {loadingAreas ? (
                    <Spin />
                  ) : (
                    <Select
                      showSearch
                      placeholder="Select NICU Area"
                      filterOption={(input, option) =>
                        option?.children.toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                      onChange={(value, option) => {
                        const selectedArea = nicuAreas.find(area => area.name === value);
                        if (selectedArea) {
                          form.setFieldsValue({ nicuAreaId: selectedArea.id });
                        }
                      }}
                    >
                      {nicuAreas.map((n) => (
                        <Option key={n.id} value={n.name}>
                          {n.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
                <Form.Item
                  label="NICU Area Id"
                  name="nicuAreaId"
                  rules={[{ required: true, message: "NICU Area ID is required" }]}
                  hidden
                >
                  <Input disabled />
                </Form.Item>
              </div>
            </div>



            {/* Hand-Wash Steps */}
            <div className="bg-cyan-50 p-6 rounded-lg">
              <h3 className="text-cyan-900 font-semibold mb-4">Hand Wash Steps</h3>
              {[
                { label: "Wet hands with water *", key: "wetHands" },
                { label: "Applied soap *", key: "appliedSoap" },
                { label: "Rub palm to palm (S) *", key: "rubPalm" },
                { label: "Right palm over left dorsum with interlaced fingers & vice versa (U) *", key: "rightOverLeft" },
                { label: "Palm to palm with fingers interlaced *", key: "palmInterlaced" },
                { label: "Back of fingers to opposing palms with fingers interlocked (M) *", key: "backFingers" },
                { label: "Rotational rubbing of left thumb clasped in right and vice versa (A) *", key: "rotThumb" },
                { label: "Rotational rubbing, backwards & forwards with clasped fingers of right hand in left palm and vice versa (N) *", key: "rotFingers" },
                { label: "Wrist (K) *", key: "wrist" },
                { label: "Rinse hands with water *", key: "rinseHands" },
                { label: "Dry hands thoroughly with a single use towel *", key: "dryHands" },
                { label: "Use an air dryer to thoroughly dry your hands *", key: "airDryer" },
                { label: "Use towel or elbow to turn off faucet *", key: "turnOffFaucet" },
              ].map(({ label, key }) => (
                <Form.Item
                  label={label}
                  name={key}
                  rules={[{ required: true, message: "Please select Yes or No" }]}
                  key={key}
                >
                  <Radio.Group className="flex space-x-8">
                    <Radio value="Yes">Yes</Radio>
                    <Radio value="No">No</Radio>
                  </Radio.Group>
                </Form.Item>
              ))}
            </div>



            {/* Compliance Display */}
            <ComplianceDisplay
              complianceScore={complianceData.score}
              complianceLevel={complianceLevel}
              totalFields={complianceData.totalFields}
              completedFields={complianceData.completedFields}
              lowCompliance={complianceData.score < 80}
            />



            {/* Image Upload */}
            <Form.Item label="Upload Image if any *">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer rounded-md border border-dashed border-gray-300 px-4 py-2 text-gray-500 hover:bg-gray-100"
                >
                  <Upload />
                  <span className="ml-2">Add Image</span>
                </label>
                {imagePreview && (
                  <div className="relative rounded-md border border-gray-300 overflow-hidden w-24 h-24">
                    <img src={imagePreview} alt="preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white p-1 hover:bg-red-700"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </Form.Item>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button onClick={() => navigate("/audit")} disabled={submitting}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                <Save className="mr-2" />
                Submit
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default HandWashForm;
