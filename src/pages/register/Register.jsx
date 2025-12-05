"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./Register.css";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);

  // Combined form data for both registrations
  const [formData, setFormData] = useState({
    // Company fields
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyCode: "",

    // Individual fields
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
    iserial: "", // add this
    qq: "", // add this
    email: "", // add this
    parent: "", // add this
    company_code: "", // add this
  });

  // Auto-generate company code when switching to company mode
  useEffect(() => {
    if (registrationType === "company" && !formData.companyCode) {
      setFormData((prev) => ({
        ...prev,
        companyCode: generateCompanyCode(),
      }));
    }
  }, [registrationType]);

  // Auto detect user geolocation for Individual Registration
  useEffect(() => {
    if (registrationType !== "individual" || manualLocation) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lng = position.coords.longitude.toString();

          setFormData((prev) => ({
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
  };

  /* ----------------------------------------------------
     COMPANY REGISTRATION LOGIC
  ---------------------------------------------------- */

  const validateCompanyForm = () => {
    const err = {};

    if (!formData.companyName.trim()) err.companyName = "Company name required";
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

    const payload = {
      user_id: formData.companyCode.toLowerCase(), // FIXED
      company_name: formData.companyName.trim(),
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
        alert(data.message || "OTP sending failed");
        setIsLoading(false);
        return;
      }

      alert("OTP sent to your email");
      setOtpStage(true);
    } catch (err) {
      alert("Network error " + err.message);
    }

    setIsLoading(false);
  };

  // Step 2: Verify OTP & Register
  const verifyCompanyOtp = async () => {
    if (!emailCode.trim()) {
      alert("Enter OTP first");
      return;
    }

    setIsLoading(true);

    const payload = {
      user_id: formData.companyCode.toLowerCase(), // FIXED
      company_name: formData.companyName.trim(),
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
        alert(data.message || "OTP verification failed");
        setIsLoading(false);
        return;
      }

      alert("Company registered successfully");
      router.push("/login");
    } catch (err) {
      alert("Network error " + err.message);
    }

    setIsLoading(false);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();

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

    if (!formData.homeName.trim()) err.homeName = "Home name required";

    if (!formData.inverterSerial.trim())
      err.inverterSerial = "Select inverter model";

    if (!formData.userId.trim()) err.userId = "User ID required";

    if (!formData.password.trim()) err.password = "Password required";
    else if (formData.password.trim().length < 8)
      err.password = "Minimum 8 characters";
    else if (!/[A-Za-z]/.test(formData.password.trim()))
      err.password = "Must include letters";

    if (formData.password.trim() !== formData.confirmPassword.trim())
      err.confirmPassword = "Passwords do not match";

    if (!/^\d{10}$/.test(formData.whatsapp.trim()))
      err.whatsapp = "Enter 10 digit WhatsApp";

    if (!formData.wifiSerial.trim()) err.wifiSerial = "WiFi Serial required";

    if (!formData.city.trim()) err.city = "City required";

    if (!formData.timezone.trim()) err.timezone = "Select timezone";

    if (!formData.stationType.trim()) err.stationType = "Select station type";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();

    if (!validateIndividual()) return;

    const payload = {
      user_id: formData.userId.trim().toLowerCase(), // backend expects lowercase
      password: formData.password.trim(),
      c_password: formData.confirmPassword.trim(),
      whatsapp_no: "91" + formData.whatsapp.trim(), // format required by backend
      wifi_serial_number: formData.wifiSerial.trim(),
      home_name: formData.homeName.trim(),
      inverter_serial_number: formData.inverterSerial.trim(),
      city_name: formData.city.trim().toLowerCase(),
      longitude: formData.longitude?.trim() || "0",
      latitude: formData.latitude?.trim() || "0",

      time_zone: String(formData.timezone).trim(),
      station_type: String(formData.stationType).trim(),
      iserial: "",
      qq: "",
      email: "",
      parent: "",
      company_code: "",
    };

    console.log("INDIVIDUAL PAYLOAD --->", payload);

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};

      try {
        data = JSON.parse(text);
      } catch (err) {
        alert("Invalid server response");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        alert(data.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      alert("Individual registration successful");
      router.push("/login?registered=true");
    } catch (err) {
      alert("Network error: " + err.message);
    }

    setIsLoading(false);
  };

  /* ----------------------------------------------------
     UI RENDER
  ---------------------------------------------------- */

  return (
    <div className="register-page">
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
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Code *</label>
                <div className="company-code-row">
                  <input
                    type="text"
                    className="form-input readonly"
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
                <label className="form-label">Company Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter email"
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
                  : "Register"}
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
                  className="form-input"
                  placeholder="Enter home name"
                  value={formData.homeName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inverter Serial *</label>
                <select
                  name="inverterSerial"
                  className="form-input"
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
                <label className="form-label">User ID *</label>
                <input
                  type="text"
                  name="userId"
                  className="form-input"
                  placeholder="Enter User ID"
                  value={formData.userId}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp *</label>
                <input
                  type="text"
                  maxLength="10"
                  name="whatsapp"
                  className="form-input"
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
                  className="form-input"
                  value={formData.wifiSerial}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              

              <div className="form-group">
                <label className="form-label">Timezone *</label>
                <select
                  name="timezone"
                  className="form-input"
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
                  name="stationType"
                  className="form-input"
                  value={formData.stationType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="0">Solar System</option>
                  <option value="1">Battery Storage</option>
                  <option value="2">Solar with Limitation</option>
                </select>
                <div className="form-group">
                <label className="form-label">Location Mode</label>
                <button
                  type="button"
                  className="form-input"
                  style={{ background: "#e6e6e6", cursor: "pointer" }}
                  onClick={() => setManualLocation(!manualLocation)}
                >
                  {manualLocation
                    ? "Switch to Auto Location"
                    : "Enter Manually"}
                </button>
              </div>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    className="form-input"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={manualLocation ? handleChange : undefined}
                    readOnly={!manualLocation}
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
                    onChange={manualLocation ? handleChange : undefined}
                    readOnly={!manualLocation}
                  />
                </div>
              </div>

              <button className="register-button">Register</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
