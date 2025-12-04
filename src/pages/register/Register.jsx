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

  const [registrationType, setRegistrationType] = useState("company");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpStage, setOtpStage] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  // ✅ ADD THESE TWO LINES
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyCode: "",
  });

  useEffect(() => {
    if (registrationType !== "company") return;
    setFormData(prev => ({
      ...prev,
      companyCode: prev.companyCode || generateCompanyCode(),
    }));
  }, [registrationType]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateCompanyForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) newErrors.email = "Enter valid email";

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.trim().length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password.trim() !== formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtpRequest = async () => {
    setIsLoading(true);

    const payload = {
      user_id: formData.email.trim(),
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

      const dataText = await res.text();
      let data = {};

      try {
        data = JSON.parse(dataText);
      } catch (err) {
        alert("Invalid server response");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        alert(data.message || "Failed to send OTP");
        setIsLoading(false);
        return;
      }

      alert("OTP sent to your email");
      setOtpStage(true);
      setIsLoading(false);
    } catch (err) {
      alert("Network error: " + err.message);
      setIsLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (!emailCode.trim()) {
      alert("Enter OTP first");
      return;
    }

    setIsLoading(true);

    const payload = {
      user_id: formData.email.trim(),
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

      const dataText = await res.text();
      let data = {};

      try {
        data = JSON.parse(dataText);
      } catch {
        alert("Invalid server response");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        alert(data.message || "OTP verification failed");
        setIsLoading(false);
        return;
      }

      alert("Company registered successfully");
      router.push("/login?registered=true");
      setIsLoading(false);
    } catch (err) {
      alert("Network error: " + err.message);
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async e => {
    e.preventDefault();

    if (!otpStage) {
      const valid = validateCompanyForm();
      if (!valid) return;
      await sendOtpRequest();
    } else {
      await verifyOtpAndRegister();
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <Image src="/Qbits.svg" alt="Qbits Energy" width={220} height={180} />
        </div>

        <div className="register-card">

        <form className="company-form" onSubmit={handleCompanySubmit}>

{/* Account / Company Name */}
<div className="form-group">
  <label className="form-label">Account *</label>
  <input
    type="text"
    name="companyName"
    className={`form-input ${errors.companyName ? "error" : ""}`}
    placeholder="Enter company name"
    value={formData.companyName}
    onChange={handleChange}
  />
  {errors.companyName && <p className="error-text">{errors.companyName}</p>}
</div>

{/* Password + Confirm */}
<div className="form-row">
  <div className="form-group">
    <label className="form-label">Password *</label>
    <div className="password-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        className={`form-input ${errors.password ? "error" : ""}`}
        placeholder="Enter password"
        value={formData.password}
        onChange={handleChange}
      />
      <span
        className="password-toggle"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.11-5.78"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.46 18.46 0 0 1-2.16 3.19"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </span>
    </div>
    {errors.password && <p className="error-text">{errors.password}</p>}
  </div>

  <div className="form-group">
    <label className="form-label">Confirm Password *</label>
    <div className="password-wrapper">
      <input
        type={showConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        className={`form-input ${errors.confirmPassword ? "error" : ""}`}
        placeholder="Confirm password"
        value={formData.confirmPassword}
        onChange={handleChange}
      />
      <span
        className="password-toggle"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      >
        {showConfirmPassword ? (
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.11-5.78"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.46 18.46 0 0 1-2.16 3.19"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="#777" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </span>
    </div>
    {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
  </div>
</div>

{/* Company Code */}
<div className="form-group">
  <label className="form-label">Company Code *</label>
  <div className="company-code-row">
    <input
      type="text"
      className="form-input readonly"
      value={formData.companyCode}
      readOnly
    />
    <button
      type="button"
      className="refresh-btn"
      onClick={() =>
        setFormData(prev => ({ ...prev, companyCode: generateCompanyCode() }))
      }
    >
      <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 2v6h-6"/>
        <path d="M3 22v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.75-3.36L21 8"/>
        <path d="M20.49 15a9 9 0 0 1-14.75 3.36L3 16"/>
      </svg>
    </button>
  </div>
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
  />
  {errors.email && <p className="error-text">{errors.email}</p>}
</div>

{/* OTP */}
{otpStage && (
  <div className="form-group">
    <label className="form-label">Email OTP *</label>
    <input
      type="text"
      className="form-input"
      placeholder="Enter OTP"
      maxLength="6"
      value={emailCode}
      onChange={e => setEmailCode(e.target.value)}
    />
  </div>
)}

<button type="submit" className="register-button" disabled={isLoading}>
  {isLoading ? "Processing..." : otpStage ? "Verify OTP" : "Register"}
</button>
</form>


        </div>
      </div>
    </div>
  );
}
