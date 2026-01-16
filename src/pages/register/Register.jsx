"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import "./Register.css";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Generate Company Code
function generateCompanyCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "A";
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code + "T";
}

export default function Register() {
  const router = useRouter();

  const [registrationType, setRegistrationType] = useState("company");
  const [isLoading, setIsLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [errors, setErrors] = useState({});
  const [manualLocation, setManualLocation] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Separate password visibility states for company form
  const [companyShowPassword, setCompanyShowPassword] = useState(false);
  const [companyShowConfirmPassword, setCompanyShowConfirmPassword] = useState(false);

  // Separate password visibility states for individual form
  const [individualShowPassword, setIndividualShowPassword] = useState(false);
  const [individualShowConfirmPassword, setIndividualShowConfirmPassword] = useState(false);

  // Helper to get current password visibility states
  const showPassword = registrationType === "company" ? companyShowPassword : individualShowPassword;
  const setShowPassword = registrationType === "company" ? setCompanyShowPassword : setIndividualShowPassword;
  const showConfirmPassword = registrationType === "company" ? companyShowConfirmPassword : individualShowConfirmPassword;
  const setShowConfirmPassword = registrationType === "company" ? setCompanyShowConfirmPassword : setIndividualShowConfirmPassword;

  // Separate form data for company registration
  const [companyFormData, setCompanyFormData] = useState({
    user_id: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyCode: "",
    email: "",
  });

  // Separate form data for individual registration
  const [individualFormData, setIndividualFormData] = useState({
    homeName: "",
    inverterSerial: "",
    userId: "",
    city: "",
    wifiSerial: "",
    timezone: "",
    stationType: "",
    whatsapp: "",
    longitude: "",
    latitude: "",
    password: "",
    confirmPassword: "",
    iserial: "",
    qq: "",
    email: "",
    parent: "",
    company_code: "",
  });

  // Helper to get current form data
  const formData = registrationType === "company" ? companyFormData : individualFormData;
  const setFormData = registrationType === "company" ? setCompanyFormData : setIndividualFormData;

  // Auto-generate company code when switching to company mode
  useEffect(() => {
    if (registrationType === "company" && !companyFormData.companyCode) {
      setCompanyFormData((prev) => ({
        ...prev,
        companyCode: generateCompanyCode(),
      }));
    }
  }, [registrationType, companyFormData.companyCode]);

  // Auto detect user geolocation for Individual Registration
  useEffect(() => {
    if (registrationType !== "individual" || manualLocation) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();

          setIndividualFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
        },
        (error) => {
          console.warn("Geolocation error", error);
        }
      );
    }
  }, [registrationType, manualLocation]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  // Helper to get input className with validation styling
  const getInputClassName = (fieldName, baseClass = "form-input") => {
    if (validationAttempted && !formData[fieldName]?.trim()) {
      return `${baseClass} validation-empty`;
    }
    return baseClass;
  };

  // Helper to get input className with field error styling
  const getFieldErrorClass = (fieldName, baseClass = "form-input") => {
    if (fieldErrors[fieldName]) {
      return `${baseClass} input-error`;
    }
    return baseClass;
  };

  // Validate Company form fields - UI only
  const validateCompanyFields = () => {
    const requiredFields = {
      user_id: true,
      password: true,
      confirmPassword: true,
      companyCode: true,
      email: true,
    };

    const newFieldErrors = {};
    let hasErrors = false;

    for (const field in requiredFields) {
      if (!formData[field]?.trim()) {
        newFieldErrors[field] = true;
        hasErrors = true;
      } else {
        newFieldErrors[field] = false;
      }
    }

    // Check password match
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      newFieldErrors.password = true;
      newFieldErrors.confirmPassword = true;
      hasErrors = true;
    }

    setFieldErrors(newFieldErrors);

    if (hasErrors) {
      if (formData.password.trim() !== formData.confirmPassword.trim()) {
        toast.error("Passwords do not match");
      } else {
        toast.error("Please fill all required fields");
      }
      return false;
    }

    return true;
  };

  // Validate Individual form fields - UI only
  const validateIndividualFields = () => {
    const requiredFields = {
      homeName: true,
      inverterSerial: true,
      userId: true,
      password: true,
      confirmPassword: true,
      whatsapp: true,
      wifiSerial: true,
      city: true,
      timezone: true,
      stationType: true,
    };

    const newFieldErrors = {};
    let hasErrors = false;

    for (const field in requiredFields) {
      if (!formData[field]?.trim()) {
        newFieldErrors[field] = true;
        hasErrors = true;
      } else {
        newFieldErrors[field] = false;
      }
    }

    // Check password match
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      newFieldErrors.password = true;
      newFieldErrors.confirmPassword = true;
      hasErrors = true;
    }

    setFieldErrors(newFieldErrors);

    if (hasErrors) {
      if (formData.password.trim() !== formData.confirmPassword.trim()) {
        toast.error("Passwords do not match");
      } else {
        toast.error("Please fill all required fields");
      }
      return false;
    }

    return true;
  };

  // UI-only validation for Company form
  const validateCompanyFormUI = () => {
    const requiredFields = {
      companyName: "Company name",
      password: "Password",
      confirmPassword: "Confirm password",
      companyCode: "Company code",
      email: "Email",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        toast.error(`Please fill all required fields`);
        setValidationAttempted(true);
        return false;
      }
    }

    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      toast.error("Passwords do not match");
      setValidationAttempted(true);
      return false;
    }

    return true;
  };

  // UI-only validation for Individual form
  const validateIndividualFormUI = () => {
    const requiredFields = {
      homeName: "Home name",
      inverterSerial: "Inverter model",
      userId: "User ID",
      password: "Password",
      confirmPassword: "Confirm password",
      whatsapp: "WhatsApp number",
      wifiSerial: "WiFi serial",
      city: "City",
      timezone: "Timezone",
      stationType: "Station type",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        toast.error(`Please fill all required fields`);
        setValidationAttempted(true);
        return false;
      }
    }

    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      toast.error("Passwords do not match");
      setValidationAttempted(true);
      return false;
    }

    return true;
  };

  /* ----------------------------------------------------
     COMPANY REGISTRATION LOGIC
  ---------------------------------------------------- */

  const validateCompanyForm = () => {
    const err = {};

    if (!formData.user_id.trim()) err.user_id = "Account name required";
    if (!formData.email.trim()) err.email = "Email required";
    if (!/\S+@\S+\.\S+/.test(formData.email.trim()))
      err.email = "Invalid email format";

    if (!formData.password.trim()) err.password = "Password required";
    else if (formData.password.trim().length < 8)
      err.password = "Minimum 8 characters required";

    if (!formData.confirmPassword.trim())
      err.confirmPassword = "Confirm password required";
    else if (formData.password.trim() !== formData.confirmPassword.trim())
      err.confirmPassword = "Passwords do not match";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Step 1: Send OTP
  const sendCompanyOtp = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Sending OTP…");

    const payload = {
      user_id: formData.user_id.toLowerCase(),
      company_name: formData.companyName.trim() || "-",
      email: formData.email.trim(),
      password: formData.password.trim(),
      c_password: formData.confirmPassword.trim(),
      company_code: formData.companyCode.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/company/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP", { id: toastId });
        setIsLoading(false);
        return;
      }

      toast.success("OTP sent successfully", { id: toastId });
      setOtpStage(true);
    } catch (err) {
      toast.error("Failed to send OTP", { id: toastId });
    }

    setIsLoading(false);
  };

  // Step 2: Verify OTP & Register
  const verifyCompanyOtp = async () => {
    if (!emailCode.trim()) {
      toast.error("Enter OTP first");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying OTP…");

    const payload = {
      user_id: formData.user_id.toLowerCase(),
      company_name: formData.companyName.trim() || "-",
      email: formData.email.trim(),
      password: formData.password.trim(),
      c_password: formData.confirmPassword.trim(),
      company_code: formData.companyCode.trim(),
      email_code: emailCode.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/company/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        toast.error(data.message || "Registration failed, please check the inputs", { id: toastId });
        setIsLoading(false);
        return;
      }

      toast.success("Registration successful", { id: toastId });
      setCompanyFormData({
        user_id: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        companyCode: generateCompanyCode(),
        email: "",
      });
      setOtpStage(false);
      setEmailCode("");
      router.push("/login");
    } catch (err) {
      toast.error("Registration failed, please check the inputs", { id: toastId });
    }

    setIsLoading(false);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();

    // UI field validation - highlight empty fields in red
    if (!validateCompanyFields()) return;

    if (!otpStage) {
      if (!validateCompanyForm()) return;
      await sendCompanyOtp();
    } else {
      await verifyCompanyOtp();
    }
  };

  /* ----------------------------------------------------
     INDIVIDUAL REGISTRATION LOGIC
  ---------------------------------------------------- */

  const validateIndividual = () => {
    const err = {};
    const fieldErrs = { ...fieldErrors };
    let toastMessage = "";

    if (!formData.homeName.trim()) err.homeName = "Home name required";

    if (!formData.inverterSerial.trim())
      err.inverterSerial = "Select inverter model";

    if (!formData.userId.trim()) err.userId = "User ID required";

    if (!formData.password.trim()) {
      err.password = "Password required";
      toastMessage = toastMessage || "Password required";
    } else if (formData.password.trim().length < 8) {
      err.password = "Minimum 8 characters";
      toastMessage = toastMessage || "Password must be at least 8 characters";
    } else if (!/[A-Za-z]/.test(formData.password.trim())) {
      err.password = "Must include letters";
      toastMessage = toastMessage || "Password must include at least one letter";
    }

    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      err.confirmPassword = "Passwords do not match";
      toastMessage = toastMessage || "Passwords do not match";
    }

    if (!/^\d{10}$/.test(formData.whatsapp.trim())) {
      err.whatsapp = "Enter 10 digit WhatsApp";
      toastMessage = toastMessage || "Enter 10 digit WhatsApp";
    }

    if (!formData.wifiSerial.trim()) {
      err.wifiSerial = "WiFi Serial required";
      toastMessage = toastMessage || "WiFi Serial required";
    }

    if (!formData.city.trim()) {
      err.city = "City required";
      toastMessage = toastMessage || "City required";
    }

    if (!formData.timezone.trim()) {
      err.timezone = "Select timezone";
      toastMessage = toastMessage || "Select timezone";
    }

    if (!formData.stationType.trim()) {
      err.stationType = "Select station type";
      toastMessage = toastMessage || "Select station type";
    }

    // mark field errors for visual feedback
    Object.keys(err).forEach((key) => {
      fieldErrs[key] = true;
    });
    setFieldErrors((prev) => ({ ...prev, ...fieldErrs }));
    setErrors(err);

    if (Object.keys(err).length > 0) {
      toast.error(toastMessage || "Please correct highlighted fields");
      return false;
    }

    return true;
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();

    // UI field validation - highlight empty fields in red
    if (!validateIndividualFields()) return;

    if (!validateIndividual()) return;

    // Backend expects raw string values (no decimal conversion) and blank optional fields
    const normalizedTimeZone = String(formData.timezone).trim(); // e.g., "55"
    const normalizedStationType = String(formData.stationType).trim();
    const emailValue = ""; // backend expects empty when not provided
    const parentValue = ""; // backend expects empty when not provided
    const companyCodeValue = formData.company_code?.trim() || "";
    const rawWhatsapp = formData.whatsapp.trim().replace(/^\+/, "");
    const whatsappWithCode = rawWhatsapp.startsWith("91")
      ? rawWhatsapp
      : `91${rawWhatsapp}`;

    const payload = {
      user_id: formData.userId.trim().toLowerCase(), // backend expects lowercase
      password: formData.password.trim(),
      c_password: formData.confirmPassword.trim(),
      whatsapp_no: whatsappWithCode, // ensure single 91 prefix
      wifi_serial_number: formData.wifiSerial.trim(),
      home_name: formData.homeName.trim(),
      inverter_serial_number: formData.inverterSerial.trim(),
      city_name: formData.city.trim(), // keep as provided to match backend sample
      longitude: formData.longitude?.trim() || "0",
      latitude: formData.latitude?.trim() || "0",

      time_zone: normalizedTimeZone,
      station_type: normalizedStationType,
      iserial: "",
      qq: "",
      email: emailValue,
      parent: parentValue,
      company_code: companyCodeValue,
    };

    console.log("INDIVIDUAL PAYLOAD --->", payload);

    setIsLoading(true);
    const toastId = toast.loading("Registering…");
    try {
      const res = await fetch(`${API_BASE}/individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        toast.error("Registration failed, please check the inputs", { id: toastId });
        return;
      }

      if (!res.ok) {
        const message = data.message || text || "Registration failed, please check the inputs";
        toast.error(message, { id: toastId });
        return;
      }

      toast.success("Registration successful", { id: toastId });
      setIndividualFormData({
        homeName: "",
        inverterSerial: "",
        userId: "",
        city: "",
        wifiSerial: "",
        timezone: "",
        stationType: "",
        whatsapp: "",
        longitude: "",
        latitude: "",
        password: "",
        confirmPassword: "",
        iserial: "",
        qq: "",
        email: "",
        parent: "",
        company_code: "",
      });
      router.push("/login?registered=true");
    } catch (err) {
      toast.error("Registration failed, please check the inputs", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------------------------------
     UI RENDER
  ---------------------------------------------------- */

  return (
    <div className="register-page">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="register-container">
        <div className="register-header">
          <Image src="/Qbits.svg" alt="logo" width={220} height={120} />
          <h2 className="form-title">
            {registrationType === "company"
              ? "Company Registration"
              : "Individual Registration"}
          </h2>
        </div>

        <div className="register-card">
          {/* TOP TABS */}
          <div className="register-tabs">
            <button
              className={`register-tab ${
                registrationType === "individual" ? "active" : ""
              }`}
              onClick={() => setRegistrationType("individual")}
            >
              Individual
            </button>

            <button
              className={`register-tab ${
                registrationType === "company" ? "active" : ""
              }`}
              onClick={() => setRegistrationType("company")}
            >
              Company
            </button>
          </div>

          {/* COMPANY FORM */}
          {registrationType === "company" && (
            <form className="company-form" onSubmit={handleCompanySubmit}>
              <div className="form-group">
                <label className="form-label">Account *</label>
                <input
                  type="text"
                  name="user_id"
                  className={getFieldErrorClass("user_id", getInputClassName("user_id"))}
                  placeholder="Account"
                  value={formData.user_id}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={getFieldErrorClass("password", getInputClassName("password"))}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon width={20} height={20} />
                      ) : (
                        <EyeIcon width={20} height={20} />
                      )}
                    </button>
                  </div>
                  {formData.password?.trim().length > 0 &&
                    formData.password.trim().length < 8 && (
                      <p className="inline-error">
                        Password must be at least 8 characters
                      </p>
                    )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className={getFieldErrorClass("confirmPassword", getInputClassName("confirmPassword"))}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon width={20} height={20} />
                      ) : (
                        <EyeIcon width={20} height={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  className={getFieldErrorClass("companyName", getInputClassName("companyName"))}
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Code *</label>
                <div className="company-code-row">
                  <input
                    type="text"
                    className={getFieldErrorClass("companyCode", getInputClassName("companyCode", "form-input readonly"))}
                    readOnly
                    value={formData.companyCode}
                  />
                  <button
                    className="refresh-btn"
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        companyCode: generateCompanyCode(),
                      }))
                    }
                  >
                    <ArrowPathIcon width={20} height={20} color="white" />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mail *</label>
                <input
                  type="email"
                  name="email"
                  className={getFieldErrorClass("email", getInputClassName("email"))}
                  placeholder="Enter Mail Box"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {otpStage && (
                <div className="form-group">
                  <label className="form-label">Email OTP *</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-input"
                    placeholder="Enter OTP"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                </div>
              )}

              <button className="register-button" disabled={isLoading}>
                {isLoading
                  ? "Processing..."
                  : otpStage
                  ? "Verify OTP"
                  : "Send"}
              </button>
            </form>
          )}

          {/* INDIVIDUAL FORM */}
          {registrationType === "individual" && (
            <form
              className="individual-form"
              style={{ padding: "2rem" }}
              onSubmit={handleIndividualSubmit}
            >
              <div className="form-group">
                <label className="form-label">Home Name *</label>
                <input
                  type="text"
                  name="homeName"
                  className={getFieldErrorClass("homeName", getInputClassName("homeName"))}
                  placeholder="Enter home name"
                  value={formData.homeName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inverter Serial *</label>
                <select
                  name="inverterSerial"
                  className={getFieldErrorClass("inverterSerial", getInputClassName("inverterSerial"))}
                  value={formData.inverterSerial}
                  onChange={handleChange}
                >
                  <option value="">Select Inverter Model</option>
                  <option value="QB-2.7KTLS">QB-2.7KTLS</option>
                  <option value="QB-3KTLS">QB-3KTLS</option>
                  <option value="QB-3.3KTLS">QB-3.3KTLS</option>
                  <option value="QB-3.6KTLS">QB-3.6KTLS</option>
                  <option value="QB-4KTLS">QB-4KTLS</option>
                  <option value="QB-4.2KTLD">QB-4.2KTLD</option>
                  <option value="QB-5KTLD">QB-5KTLD</option>
                  <option value="QB-5.3KTLD">QB-5.3KTLD</option>
                  <option value="QB-6KTLC">QB-6KTLC</option>
                  <option value="QB-6KTLD">QB-6KTLD</option>
                  <option value="QB-8KTLC">QB-8KTLC</option>
                  <option value="QB-10KTLC">QB-10KTLC</option>
                  <option value="QB-12KTLC">QB-12KTLC</option>
                  <option value="QB-15KTLC">QB-15KTLC</option>
                  <option value="QB-17KTLC">QB-17KTLC</option>
                  <option value="QB-20KTLC">QB-20KTLC</option>
                  <option value="QB-25KTLC">QB-25KTLC</option>
                  <option value="QB-28KTLC">QB-28KTLC</option>
                  <option value="QB-30KTLC">QB-30KTLC</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">User ID (Email or Mobile) *</label>
                <input
                  type="text"
                  name="userId"
                  className={getFieldErrorClass("userId", getInputClassName("userId"))}
                  placeholder="Enter User ID"
                  value={formData.userId}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Code</label>
                <input
                  type="text"
                  name="company_code"
                  className="form-input"
                  placeholder="Enter company code "
                  value={formData.company_code}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={getFieldErrorClass("password", getInputClassName("password"))}
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon width={20} height={20} />
                      ) : (
                        <EyeIcon width={20} height={20} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className={getFieldErrorClass("confirmPassword", getInputClassName("confirmPassword"))}
                      placeholder="Enter Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon width={20} height={20} />
                      ) : (
                        <EyeIcon width={20} height={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp *</label>
                <input
                  type="text"
                  maxLength="10"
                  name="whatsapp"
                  className={getFieldErrorClass("whatsapp", getInputClassName("whatsapp"))}
                  placeholder="10 digit number"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WiFi Serial *</label>
                <input
                  type="text"
                  name="wifiSerial"
                  className={getFieldErrorClass("wifiSerial", getInputClassName("wifiSerial"))}
                  value={formData.wifiSerial}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className={getFieldErrorClass("city", getInputClassName("city"))}
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              

              <div className="form-group">
                <label className="form-label">Timezone *</label>
                <select
                  name="timezone"
                  className={getFieldErrorClass("timezone", getInputClassName("timezone"))}
                  value={formData.timezone}
                  onChange={handleChange}
                >
                  <option value="">Select Timezone</option>
                  <option value="0">GMT 0</option>
                  <option value="1">GMT 1</option>
                  <option value="2">GMT 2</option>
                  <option value="3">GMT 3</option>
                  <option value="4">GMT 4</option>
                  <option value="5">GMT 5</option>
                  <option value="55">GMT 5.5</option>
                  <option value="6">GMT 6</option>
                  <option value="7">GMT 7</option>
                  <option value="8">GMT 8</option>
                  <option value="9">GMT 9</option>
                  <option value="10">GMT 10</option>
                  <option value="11">GMT 11</option>
                  <option value="12">GMT 12</option>
                  <option value="-1">GMT -1</option>
                  <option value="-2">GMT -2</option>
                  <option value="-3">GMT -3</option>
                  <option value="-4">GMT -4</option>
                  <option value="-5">GMT -5</option>
                  <option value="-6">GMT -6</option>
                  <option value="-7">GMT -7</option>
                  <option value="-8">GMT -8</option>
                  <option value="-9">GMT -9</option>
                  <option value="-10">GMT -10</option>
                  <option value="-11">GMT -11</option>
                  <option value="-12">GMT -12</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Station Type *</label>

                <select
                  className={getFieldErrorClass("stationType", getInputClassName("stationType"))}
                  name="stationType"
                  value={formData.stationType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="0">Solar System</option>
                  <option value="1">Battery Storage</option>
                  <option value="2">Solar with Limitation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  className="form-input"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  className="form-input"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>

              <button className="register-button">Register</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
