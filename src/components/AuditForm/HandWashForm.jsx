import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  AlertCircle,
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
import { useSelector } from "react-redux";
import { useSupabaseAudits } from "../../hooks/useSupabaseAudits";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { calculateHandWashCompliance, getComplianceLevel } from "../../utils/complianceCalculation";

const { TextArea } = Input;
const { Option } = Select;

const HandWashForm = () => {
  const navigate = useNavigate();
  const { createAudit } = useSupabaseAudits();
  const { user } = useAuth();
  const profile = useSelector(state => state.user.userDetails);

  const [loadingAreas, setLoadingAreas] = useState(false);
  const [nicuAreas, setNicuAreas] = useState([]);
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
  // const adherenceOptions = [
  //   "Less than 3",
  //   "3 to 5",
  //   "6 Steps",
  //   "0",
  // ];
  // const durationOptions = [
  //   "<10 sec",
  //   "10-20 sec",
  //   ">20 sec",
  //   "0",
  // ];
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
    if (profile?.organization_id) {
      fetchNICUAreas();
    }
  }, [profile]);

  const fetchNICUAreas = async () => {
    setLoadingAreas(true);
    try {
      const { data, error } = await supabase
        .from("nicu_areas")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setNicuAreas(data || []);
    } catch (error) {
      console.error("Error fetching NICU areas:", error.message);
      setNicuAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  // Handle form submission
  const onFinish = async (values) => {
    setSubmitting(true);

    try {
      // Build compliance structure for WHO moments
      const moments = {
        beforePatientContact: values.opportunityType?.includes(
          "Moment 1 - Before touching patients"
        ),
        beforeAsepticProcedure: values.opportunityType?.includes(
          "Moment 2 - Before Clean Procedure"
        ),
        afterBodyFluidExposure: values.opportunityType?.includes(
          "Moment 3 - After risk of body fluid exposure"
        ),
        afterPatientContact: values.opportunityType?.includes(
          "Moment 4 - After touching the Patients"
        ),
        afterPatientSurroundings: values.opportunityType?.includes(
          "Moment 5 - After touching surroundings"
        ),
      };

      // Calculate compliance score and details
      const complianceData = calculateHandWashCompliance(values);

      const auditRecord = {
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        observerId: user?.id || "unknown",
        observerName: user?.name || "Unknown Observer",
        nicuAreas: nicuAreas.find((n) => n.id === values.nicuArea)?.name || "Unknown Area",
        nicuAreaId: values.nicuArea,
        moments,
        complianceScore: complianceData.score,
        complianceLevel: getComplianceLevel(complianceData.score),
        notes: values.comments || "",
        patientName: values.patientName,
        bedsideName: values.bedsideName,
        healthcareProviders: values.hcp,
        adherenceSteps: values.adherence,
        handWashDuration: values.duration,
        gloveRequired: values.glovesRequired,
        glovesFor: values.glovesFor,
        glovesUsed: values.glovesUsed,
        notifiedBedside: values.notifiedBedside,
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
  // const lowCompliance = complianceData.score < 80;

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
              <h1 className="text-2xl font-bold">Hand Wash Compliance Audit</h1>
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
                  label="NICU Area"
                  name="nicuArea"
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
                    >
                      {nicuAreas.map((n) => (
                        <Option key={n.id} value={n.id}>
                          {n.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              </div>
            </div>

            {/* Healthcare Provider */}
            <Form.Item
              label="Healthcare Provider"
              name="hcp"
              rules={[{ required: true, message: "Please select healthcare provider" }]}
            >
              <Radio.Group>
                {hcpOptions.map((hcp) => (
                  <Radio key={hcp} value={hcp}>
                    {hcp}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            {/* WHO Moments */}
            <Form.Item
              label="Type of Opportunity (WHO Moments)"
              name="opportunityType"
              rules={[{ required: true, message: "Please select opportunity type" }]}
            >
              <Radio.Group>
                {opportunityOptions.map((op) => (
                  <Radio key={op} value={op}>
                    {op}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            {/* Hand-Wash Steps */}
            <div className="bg-cyan-50 p-6 rounded-lg">
              <h3 className="text-cyan-900 font-semibold mb-4">Hand Wash Steps</h3>
              {[
                { label: "Wet hands with water", key: "wetHands" },
                { label: "Applied soap", key: "appliedSoap" },
                { label: "Rubbed palm to palm", key: "rubPalm" },
                { label: "Right over left dorsum", key: "rightOverLeft" },
                { label: "Palm to palm interlaced", key: "palmInterlaced" },
                { label: "Back of fingers", key: "backFingers" },
                { label: "Rotational rubbing of thumb", key: "rotThumb" },
                { label: "Rotational rubbing fingers", key: "rotFingers" },
                { label: "Wrist", key: "wrist" },
                { label: "Rinsed hands", key: "rinseHands" },
                { label: "Dried hands with towel", key: "dryHands" },
                { label: "Used air dryer", key: "airDryer" },
                { label: "Turned faucet off", key: "turnOffFaucet" },
              ].map(({ label, key }) => (
                <Form.Item
                  label={label}
                  name={key}
                  rules={[{ required: true, message: "Please select Yes or No" }]}
                  key={key}
                >
                  <Radio.Group>
                    <Radio value="Yes">Yes</Radio>
                    <Radio value="No">No</Radio>
                  </Radio.Group>
                </Form.Item>
              ))}
            </div>

            {/* Gloves Assessment */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-purple-900 font-semibold mb-4">Gloves Assessment</h3>
              <Form.Item
                label="Gloves Required"
                name="glovesRequired"
                rules={[{ required: true, message: "Please select an option" }]}
              >
                <Radio.Group>
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Gloves Required For"
                name="glovesFor"
                dependencies={["glovesRequired"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue("glovesRequired") === "Yes" && (!value || value.length === 0)) {
                        return Promise.reject(new Error("Please select at least one"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Checkbox.Group disabled={form.getFieldValue("glovesRequired") !== "Yes"}>
                  {glovesForOptions.map((g) => (
                    <Checkbox value={g} key={g}>
                      {g}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                label="Gloves Used"
                name="glovesUsed"
                rules={[{ required: true, message: "Please select an option" }]}
              >
                <Radio.Group>
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Notified Bedside"
                name="notifiedBedside"
                rules={[{ required: true, message: "Please select an option" }]}
              >
                <Radio.Group>
                  <Radio value="Yes">Yes</Radio>
                  <Radio value="No">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* Compliance Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">WHO Moments Compliance</h4>
                <div className={`text-lg font-bold text-${complianceLevel.color}-600`}>
                  {complianceData.score.toFixed(0)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 my-2">
                <div
                  className={`h-2 rounded-full bg-${complianceLevel.color}-500 transition-all duration-300`}
                  style={{ width: `${complianceData.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  Completed {complianceData.completedFields}/{complianceData.totalFields}
                </span>
                <span>{complianceLevel.description}</span>
              </div>
              {complianceData.score / 100 < 0.8 && (
                <div className="flex items-center text-red-600 space-x-2 mt-2 text-sm">
                  <AlertCircle />
                  <span>Below 80% compliance threshold</span>
                </div>
              )}
            </div>

            {/* Comments */}
            <Form.Item label="Comments" name="comments">
              <TextArea rows={4} placeholder="Additional observations or notes..." />
            </Form.Item>

            {/* Image Upload */}
            <Form.Item label="Upload Image">
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
