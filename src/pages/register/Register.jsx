"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./Register.css";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function generateCompanyCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "A";
  for (let i = 0; i < 6; i++) {
    result += letters[Math.floor(Math.random() * letters.length)];
  }
  return result + "T";
}

export default function Register() {
  const router = useRouter();
  const [registrationType, setRegistrationType] = useState("individual");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Individual fields
    homeName: "",
    inverterSerial: "",
    userId: "",
    password: "",
    confirmPassword: "",
    city: "",
    wifiSerial: "",
    timezone: "",
    stationType: "",
    whatsapp: "",
    longitude: "",
    latitude: "",

    // Company fields
    account: "",
    companyPassword: "",
    companyConfirmPassword: "",
    companyCode: "",
    email: "",
  });

  const [otpStage, setOtpStage] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [serverData, setServerData] = useState(null);

  useEffect(() => {
    if (registrationType === "company" && !formData.companyCode) {
      const newCode = generateCompanyCode();
      setFormData((prev) => ({
        ...prev,
        companyCode: newCode,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationType]);

  useEffect(() => {
    setOtpStage(false);
    setEmailCode("");
    setServerData(null);
    setErrors((prev) => ({ ...prev, emailCode: "" }));
  }, [registrationType]);

  const validateIndividualForm = () => {
    const newErrors = {};

    const trimmedHomeName = formData.homeName?.trim();
    const trimmedInverterSerial = formData.inverterSerial?.trim();
    const trimmedUserId = formData.userId?.trim();
    const trimmedPassword = formData.password?.trim();
    const trimmedConfirmPassword = formData.confirmPassword?.trim();
    const trimmedCity = formData.city?.trim();
    const trimmedWifiSerial = formData.wifiSerial?.trim();
    const trimmedTimezone = formData.timezone?.trim();
    const trimmedStationType = formData.stationType?.trim();
    const trimmedWhatsapp = formData.whatsapp?.trim();

    if (!trimmedHomeName) {
      newErrors.homeName = "Home name is required";
    }

    if (!trimmedInverterSerial) {
      newErrors.inverterSerial = "Inverter serial number is required";
    }

    if (!trimmedUserId) {
      newErrors.userId = "User ID is required";
    } else if (
      !/\S+@\S+\.\S+/.test(trimmedUserId) &&
      !/^\d{10}$/.test(trimmedUserId)
    ) {
      newErrors.userId = "Please enter a valid email or 10-digit mobile number";
    }

    if (!trimmedPassword) {
      newErrors.password = "Password is required";
    } else if (trimmedPassword.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!trimmedConfirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!trimmedCity) {
      newErrors.city = "City is required";
    }

    if (!trimmedWifiSerial) {
      newErrors.wifiSerial = "WiFi serial number is required";
    }

    if (!trimmedTimezone) {
      newErrors.timezone = "Timezone is required";
    } else if (isNaN(Number(trimmedTimezone))) {
      newErrors.timezone = "Timezone must be a valid number";
    }

    if (!trimmedStationType) {
      newErrors.stationType = "Station type is required";
    } else if (isNaN(Number(trimmedStationType))) {
      newErrors.stationType = "Station type must be a valid number";
    }

    if (!trimmedWhatsapp) {
      newErrors.whatsapp = "WhatsApp number is required";
    } else {
      // Allow 10-digit local, or with optional +91/91 prefix
      const whatsappDigits = trimmedWhatsapp.replace(/\D/g, "");
      const whatsappPattern = /^(91)?\d{10}$/;
      if (!whatsappPattern.test(whatsappDigits)) {
        newErrors.whatsapp =
          "Please enter a valid WhatsApp number (10 digits, with optional 91 country code)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyEmailForOtp = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyForm = () => {
    const newErrors = {};

    if (!formData.account) newErrors.account = "Account name is required";

    if (!formData.companyPassword) {
      newErrors.companyPassword = "Password is required";
    } else if (formData.companyPassword.length < 6) {
      newErrors.companyPassword = "Password must be at least 6 characters";
    }

    if (formData.companyPassword !== formData.companyConfirmPassword) {
      newErrors.companyConfirmPassword = "Passwords do not match";
    }

    if (!formData.companyCode)
      newErrors.companyCode = "Company code is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Normalize WhatsApp number to always be `91` + 10-digit local number (total 12 digits)
  const normalizeWhatsapp = (rawValue = "") => {
    if (!rawValue) return "";

    // Keep only digits
    let digits = String(rawValue).replace(/\D/g, "");

    // If it starts with 91 and is longer than 10, keep the last 10 as local part
    if (digits.startsWith("91") && digits.length >= 12) {
      digits = digits.slice(-10);
    } else if (digits.length > 10) {
      // Fallback: if more than 10 digits without clear prefix, keep last 10
      digits = digits.slice(-10);
    }

    // At this point we expect exactly 10 local digits
    if (digits.length !== 10) {
      return "";
    }

    return `91${digits}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (registrationType !== "individual") return;
  
    const valid = validateIndividualForm();
    if (!valid) return;
  
    setIsLoading(true);
  
    const trimmedUserId = formData.userId?.trim() || "";
    const trimmedPassword = formData.password?.trim() || "";
    const trimmedConfirmPassword = formData.confirmPassword?.trim() || "";
    const trimmedWhatsapp = formData.whatsapp?.trim() || "";
    const trimmedWifiSerial = formData.wifiSerial?.trim() || "";
    const trimmedHomeName = formData.homeName?.trim() || "";
    const trimmedInverterSerial = formData.inverterSerial?.trim() || "";
    const trimmedCity = formData.city?.trim() || "";
    const trimmedLongitude = formData.longitude?.trim() || "";
    const trimmedLatitude = formData.latitude?.trim() || "";
  
    const normalizedTimezone = formData.timezone?.trim() || "";
    const normalizedStationType = formData.stationType?.trim() || "";
  
    // FIXED WHATSAPP: must send 12 digits (91 + 10 digits)
    function normalizeWhatsapp(num) {
      let n = num.replace(/\D/g, ""); // remove all non digits
      n = n.replace(/^91/, ""); // remove leading 91 if typed
      return "91" + n; // always prepend 91
    }
  
    // Build final payload EXACTLY as backend expects
    const payload = {
      user_id: trimmedUserId,
      password: trimmedPassword,
      c_password: trimmedConfirmPassword,
  
      whatsapp_no: normalizeWhatsapp(trimmedWhatsapp),
      wifi_serial_number: trimmedWifiSerial,
      home_name: trimmedHomeName,
      inverter_serial_number: trimmedInverterSerial,
      city_name: trimmedCity,
  
      longitude: trimmedLongitude,
      latitude: trimmedLatitude,
  
      time_zone: String(normalizedTimezone),
      station_type: String(normalizedStationType),
  
      iserial: "",
      qq: "",
      email: "",
      parent: "",
      company_code: ""
    };
  
    console.log("FINAL PAYLOAD SENT TO API:", payload);
  
    try {
      const res = await fetch(`${API_BASE}/individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      const text = await res.text();
      let data = {};
  
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.log("SERVER RAW RESPONSE:", text);
        alert("Invalid server response");
        setIsLoading(false);
        return;
      }
  
      console.log("SERVER RESPONSE PARSED:", data);
  
      if (res.ok && data.success) {
        alert("Registration successful");
        router.push("/login?registered=true");
        return;
      }
  
      // Laravel validation error handling
      if (data?.data && typeof data.data === "object") {
        const apiErrors = {};
        Object.entries(data.data).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length) {
            apiErrors[field] = messages[0];
          }
        });
        setErrors(apiErrors);
  
        console.log("VALIDATION ERRORS:", apiErrors);
        alert("Some fields are invalid, please check");
      } else {
        alert(data.message || "Registration failed");
      }
  
    } catch (error) {
      console.log("NETWORK ERROR:", error.message);
      alert("Network error: " + error.message);
    }
  
    setIsLoading(false);
  };
  
   
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <Link href="/dashboard" className="register-logo-link">
            <Image
              src="/Qbits.svg"
              alt="Qbits Energy"
              height={80}
              width={220}
              className="register-logo"
              priority
            />
          </Link>
        </div>

        <div className="register-card">
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

          <div className="register-content">
            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            {registrationType === "individual" ? (
              <form className="register-form" onSubmit={handleSubmit}>
                {/* Home Name */}
                <div className="form-group">
                  <label className="form-label">Home Name *</label>
                  <input
                    type="text"
                    name="homeName"
                    className={`form-input ${errors.homeName ? "error" : ""}`}
                    placeholder="Enter home name"
                    value={formData.homeName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.homeName && (
                    <span className="error-text">{errors.homeName}</span>
                  )}
                </div>

                {/* Inverter Serial Dropdown */}
                <div className="form-group">
                  <label className="form-label">Inverter Serial Number *</label>
                  <select
                    name="inverterSerial"
                    className={`form-input ${
                      errors.inverterSerial ? "error" : ""
                    }`}
                    value={formData.inverterSerial}
                    onChange={handleChange}
                    disabled={isLoading}
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
                  {errors.inverterSerial && (
                    <span className="error-text">{errors.inverterSerial}</span>
                  )}
                </div>

                {/* User ID */}
                <div className="form-group">
                  <label className="form-label">
                    User ID (Email or Mobile) *
                  </label>
                  <input
                    type="text"
                    name="userId"
                    className={`form-input ${errors.userId ? "error" : ""}`}
                    placeholder="Enter email or mobile number"
                    value={formData.userId}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.userId && (
                    <span className="error-text">{errors.userId}</span>
                  )}
                </div>

                {/* Password + Confirm */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`form-input ${
                          errors.password ? "error" : ""
                        }`}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />

                      <span
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "✖" : "👁"}
                      </span>
                    </div>
                    {errors.password && (
                      <span className="error-text">{errors.password}</span>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        className={`form-input ${
                          errors.confirmPassword ? "error" : ""
                        }`}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                      />

                      <span
                        className="password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? "✖" : "👁"}
                      </span>
                    </div>
                    {errors.confirmPassword && (
                      <span className="error-text">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label">Your City *</label>
                  <input
                    type="text"
                    name="city"
                    className={`form-input ${errors.city ? "error" : ""}`}
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <span className="error-text">{errors.city}</span>
                  )}
                </div>

                {/* WiFi Serial */}
                <div className="form-group">
                  <label className="form-label">WiFi Serial Number *</label>
                  <input
                    type="text"
                    name="wifiSerial"
                    className={`form-input ${errors.wifiSerial ? "error" : ""}`}
                    placeholder="Enter WiFi serial number"
                    value={formData.wifiSerial}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.wifiSerial && (
                    <span className="error-text">{errors.wifiSerial}</span>
                  )}
                </div>

                {/* Timezone Dropdown */}
                <div className="form-group">
                  <label className="form-label">Timezone *</label>
                  <select
                    name="timezone"
                    className={`form-input ${errors.timezone ? "error" : ""}`}
                    value={formData.timezone}
                    onChange={handleChange}
                    disabled={isLoading}
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
                  {errors.timezone && (
                    <span className="error-text">{errors.timezone}</span>
                  )}
                </div>

                {/* Solar Station Type */}
                <div className="form-group">
                  <label className="form-label">Station Type *</label>
                  <select
                    name="stationType"
                    className={`form-input ${
                      errors.stationType ? "error" : ""
                    }`}
                    value={formData.stationType}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Select Station Type</option>
                    <option value="0">Solar System</option>
                    <option value="1">Battery Storage System</option>
                    <option value="2">
                      {" "}
                      Solar System (with output-limition){" "}
                    </option>
                  </select>
                  {errors.stationType && (
                    <span className="error-text">{errors.stationType}</span>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="form-group">
                  <label className="form-label">WhatsApp Number *</label>
                  <div className="whatsapp-input-group">
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      name="whatsapp"
                      className={`form-input whatsapp-input ${
                        errors.whatsapp ? "error" : ""
                      }`}
                      placeholder="Enter WhatsApp number"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      disabled={isLoading}
                      maxLength="10"
                    />
                  </div>
                  {errors.whatsapp && (
                    <span className="error-text">{errors.whatsapp}</span>
                  )}
                </div>

                {/* Longitude */}
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    className="form-input"
                    placeholder="Enter longitude or leave blank"
                    value={formData.longitude}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Latitude */}
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    className="form-input"
                    placeholder="Enter latitude or leave blank"
                    value={formData.latitude}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="register-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register"}
                </button>
              </form>
            ) : (
              <form className="register-form" onSubmit={handleSubmit}>
                {/* Account */}
                <div className="form-group">
                  <label className="form-label">Account *</label>
                  <input
                    type="text"
                    name="account"
                    className={`form-input ${errors.account ? "error" : ""}`}
                    placeholder="Enter account name"
                    value={formData.account}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.account && (
                    <span className="error-text">{errors.account}</span>
                  )}
                </div>

                {/* Password + Confirm */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      name="companyPassword"
                      className={`form-input ${
                        errors.companyPassword ? "error" : ""
                      }`}
                      placeholder="Enter password"
                      value={formData.companyPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.companyPassword && (
                      <span className="error-text">
                        {errors.companyPassword}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      name="companyConfirmPassword"
                      className={`form-input ${
                        errors.companyConfirmPassword ? "error" : ""
                      }`}
                      placeholder="Confirm password"
                      value={formData.companyConfirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.companyConfirmPassword && (
                      <span className="error-text">
                        {errors.companyConfirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                {/* Company Code */}
                <div className="form-group">
                  <label className="form-label">Company Code *</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      className={`form-input ${
                        errors.companyCode ? "error" : ""
                      }`}
                      style={{
                        flex: 1,
                        minHeight: "48px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {formData.companyCode || "Generating..."}
                    </div>

                    <button
                      className="geneButton"
                      type="button"
                      onClick={() => {
                        const newCode = generateCompanyCode();
                        setFormData((prev) => ({
                          ...prev,
                          companyCode: newCode,
                        }));
                      }}
                      disabled={isLoading}
                    >
                      <ArrowPathIcon
                        style={{ width: 22, height: 22, color: "white" }}
                      />
                    </button>
                  </div>
                  {errors.companyCode && (
                    <span className="error-text">{errors.companyCode}</span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Mail *</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? "error" : ""}`}
                    placeholder="Enter company email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                {/* OTP FIELD BELOW EMAIL FIELD */}
                {otpStage && (
                  <div className="form-group otp-box">
                    <label className="form-label">Email OTP *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter OTP sent to your email"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      disabled={isLoading}
                      maxLength="6"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="register-button"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Processing..."
                    : otpStage
                    ? "Verify OTP"
                    : "Register"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
