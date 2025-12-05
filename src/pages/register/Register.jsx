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
      err.inverterSerial = "Inverter serial required";
    if (!formData.userId.trim()) err.userId = "User ID required";
    if (!formData.password.trim()) err.password = "Password required";
    if (formData.password.trim().length < 6)
      err.password = "Minimum 6 characters";
    if (formData.password.trim() !== formData.confirmPassword.trim())
      err.confirmPassword = "Passwords do not match";

    if (!/^\d{10}$/.test(formData.whatsapp))
      err.whatsapp = "10-digit WhatsApp required";

    if (!formData.wifiSerial.trim())
      err.wifiSerial = "WiFi Serial required";

    if (!formData.timezone.trim()) err.timezone = "Timezone required";
    if (!formData.stationType.trim()) err.stationType = "Station type required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();

    if (!validateIndividual()) return;

    const payload = {
      user_id: formData.userId.trim(),
      password: formData.password.trim(),
      c_password: formData.confirmPassword.trim(),
      whatsapp_no: "91" + formData.whatsapp.trim(),
      wifi_serial_number: formData.wifiSerial.trim(),
      home_name: formData.homeName.trim(),
      inverter_serial_number: formData.inverterSerial.trim(),
      city_name: formData.city.trim(),
      longitude: formData.longitude || "",
      latitude: formData.latitude || "",
      time_zone: formData.timezone.trim(),
      station_type: formData.stationType.trim(),
      iserial: "",
      qq: "",
      email: "",
      parent: "",
      company_code: "",
    };

    try {
      const res = await fetch(`${API_BASE}/individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Individual registration successful");
      router.push("/login");
    } catch (err) {
      alert("Network error " + err.message);
    }
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
            <form className="individual-form" onSubmit={handleIndividualSubmit}>
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
                <input
                  type="text"
                  name="inverterSerial"
                  className="form-input"
                  placeholder="Enter serial"
                  value={formData.inverterSerial}
                  onChange={handleChange}
                />
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
                <input
                  type="text"
                  name="timezone"
                  className="form-input"
                  value={formData.timezone}
                  onChange={handleChange}
                />
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
              </div>

              <button className="register-button">Register</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
