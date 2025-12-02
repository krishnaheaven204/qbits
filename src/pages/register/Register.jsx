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
      setFormData((prev) => ({ ...prev, companyCode: newCode }));
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

    if (!formData.homeName) newErrors.homeName = "Home name is required";
    if (!formData.inverterSerial)
      newErrors.inverterSerial = "Inverter serial number is required";

    if (!formData.userId) {
      newErrors.userId = "User ID is required";
    } else if (
      !/\S+@\S+\.\S+/.test(formData.userId) &&
      !/^\d{10}$/.test(formData.userId)
    ) {
      newErrors.userId = "Please enter a valid email or 10-digit mobile number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.city) newErrors.city = "City is required";
    if (!formData.wifiSerial)
      newErrors.wifiSerial = "WiFi serial number is required";
    if (!formData.timezone) newErrors.timezone = "Timezone is required";
    if (!formData.stationType)
      newErrors.stationType = "Station type is required";

    if (!formData.whatsapp) {
      newErrors.whatsapp = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "Please enter a valid 10-digit number";
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

  const handleSubmit = async (e) => {
    e.preventDefault();


    const validateIndividualEmailForOtp = () => {
      const newErrors = {};
    
      if (!formData.userId) {
        newErrors.userId = "User ID is required";
      } else if (
        !/\S+@\S+\.\S+/.test(formData.userId) &&
        !/^\d{10}$/.test(formData.userId)
      ) {
        newErrors.userId = "Enter valid email or 10 digit mobile";
      }
    
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    const isValid =
      registrationType === "individual"
      ? otpStage
      ? validateIndividualForm()
      : validateIndividualEmailForOtp()
    : otpStage
    ? validateCompanyForm()
    : validateCompanyEmailForOtp();

    if (!isValid) return;

       
      if (registrationType === "company") {

        // FIRST CLICK, SEND OTP
        if (!otpStage) {
      
          const isEmailValid = validateCompanyEmailForOtp();
          if (!isEmailValid) return;
      
          const payload = {
            user_id: formData.account,
            company_name: formData.account,
            email: formData.email,
            password: formData.companyPassword,
            c_password: formData.companyConfirmPassword,
            company_code: formData.companyCode,
            email_code: "",
          };
      
          setServerData(payload);
          setOtpStage(true);
          setIsLoading(true);
      
          try {
            const res = await fetch(`${API_BASE}/company/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      
            const text = await res.text();
            let data;
      
            try {
              data = JSON.parse(text);
            } catch {
              alert("Invalid response from server");
              setIsLoading(false);
              return;
            }
      
            if (data.requires_otp) {
              alert("OTP sent to your email");
            } else if (!res.ok) {
              alert(data.message || "Error sending OTP");
              setOtpStage(false);
              setServerData(null);
            }
      
          } catch (err) {
            alert(err.message);
            setOtpStage(false);
            setServerData(null);
          }
      
          setIsLoading(false);
          return;
        }
      
        // SECOND CLICK, VERIFY OTP + FULL FORM
        if (otpStage) {
      
          if (!emailCode.trim()) {
            setErrors((prev) => ({ ...prev, emailCode: "OTP is required" }));
            return;
          }
      
          // VALIDATE FULL FORM NOW
          const fullValid = validateCompanyForm();
          if (!fullValid) return;
      
          setIsLoading(true);
      
          try {
            const finalPayload = {
              ...serverData,
              email_code: emailCode,
            };
      
            const res2 = await fetch(`${API_BASE}/company/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalPayload),
            });
      
            const text2 = await res2.text();
            let data2;
      
            try {
              data2 = JSON.parse(text2);
            } catch {
              alert("Invalid response from server");
              setIsLoading(false);
              return;
            }
      
            if (res2.ok) {
              alert("Registration successful");
              router.push("/login?registered=true");
            } else {
              alert(data2.message || "Invalid OTP");
            }
      
          } catch (err) {
            alert(err.message);
          }
      
          setIsLoading(false);
          return;
        }
      }
      
  
 // INDIVIDUAL USER FLOW
if (registrationType === "individual") {

  // STEP 1, SEND OTP
  if (!otpStage) {

    const emailValid = validateIndividualEmailForOtp();
    if (!emailValid) return;

    const payload = {
      user_id: formData.userId,
      home_name: formData.homeName,
      city: formData.city,
      timezone: formData.timezone,
      station_type: formData.stationType,
      wifi_serial: formData.wifiSerial,
      inverter_serial: formData.inverterSerial,
      
      email_code: "",  // VERY IMPORTANT → tell server "send OTP"
    };

    setServerData(payload);
    setOtpStage(true);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/individual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        alert("Server sent invalid response");
        setIsLoading(false);
        return;
      }

      if (data.requires_otp) {
        alert("OTP sent to your email or mobile");
      } else if (!res.ok) {
        alert(data.message || "Unable to send OTP");
        setOtpStage(false);
      }

    } catch (error) {
      alert(error.message);
      setOtpStage(false);
    }

    setIsLoading(false);
    return;
  }

  // STEP 2, USER MUST ENTER OTP
  if (!emailCode.trim()) {
    setErrors(prev => ({ ...prev, emailCode: "OTP is required" }));
    return;
  }

  const fullValid = validateIndividualForm();
  if (!fullValid) return;

  setIsLoading(true);

  try {
    const finalPayload = {
      ...serverData,
      email_code: emailCode,  // VERIFY OTP AND REGISTER
    };

    const res2 = await fetch(`${API_BASE}/individual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });

    const raw2 = await res2.text();
    let data2;

    try {
      data2 = JSON.parse(raw2);
    } catch {
      alert("Server sent invalid response");
      setIsLoading(false);
      return;
    }

    if (res2.ok) {
      alert("Registration successful");
      router.push("/login?registered=true");
    } else {
      alert(data2.message || "Invalid OTP");
    }

  } catch (error) {
    alert(error.message);
  }

  setIsLoading(false);
  return;
}


     
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const registrationData = {
        type: "individual",
        data: {
          homeName: formData.homeName,
          userId: formData.userId,
          city: formData.city,
          timezone: formData.timezone,
          stationType: formData.stationType,
        },
        otp: emailCode,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(
        "registrationData",
        JSON.stringify(registrationData)
      );
      setOtpStage(false);
      setEmailCode("");
      setErrors((prev) => ({ ...prev, emailCode: "" }));
      router.push("/login?registered=true");
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
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

                <div className="form-group">
                  <label className="form-label">Inverter Serial Number *</label>
                  <input
                    type="text"
                    name="inverterSerial"
                    className={`form-input ${
                      errors.inverterSerial ? "error" : ""
                    }`}
                    placeholder="Enter inverter serial number"
                    value={formData.inverterSerial}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.inverterSerial && (
                    <span className="error-text">{errors.inverterSerial}</span>
                  )}
                </div>

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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      name="password"
                      className={`form-input ${errors.password ? "error" : ""}`}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <span className="error-text">{errors.password}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className={`form-input ${
                        errors.confirmPassword ? "error" : ""
                      }`}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <span className="error-text">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

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

                <div className="form-group">
                  <label className="form-label">Timezone *</label>
                  <input
                    type="text"
                    name="timezone"
                    className={`form-input ${errors.timezone ? "error" : ""}`}
                    placeholder="Enter timezone (e.g., Asia/Kolkata)"
                    value={formData.timezone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.timezone && (
                    <span className="error-text">{errors.timezone}</span>
                  )}
                </div>

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
                    <option value="">Select station type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                  {errors.stationType && (
                    <span className="error-text">{errors.stationType}</span>
                  )}
                </div>

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
                {/* OTP field starts */}
                {otpStage && (
                  <div className="form-group">
                    <label className="form-label">Enter OTP *</label>
                    <input
                      type="text"
                      className={`form-input ${
                        errors.emailCode ? "error" : ""
                      }`}
                      placeholder="Enter OTP sent to your email"
                      value={emailCode}
                      onChange={(e) => {
                        setEmailCode(e.target.value);
                        if (errors.emailCode) {
                          setErrors((prev) => ({ ...prev, emailCode: "" }));
                        }
                      }}
                      disabled={isLoading}
                      maxLength="6"
                    />
                    {errors.emailCode && (
                      <span className="error-text">{errors.emailCode}</span>
                    )}
                  </div>
                )}
                {/* OTP field ends */}

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

            <div className="register-footer">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="login-link">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
