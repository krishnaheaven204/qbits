'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import './AuthRegister.css';

const generateCompanyCode = () => {
  const number = [
    'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z',
  ];
  const arr = [...number];
  const result = ['A'];
  for (let i = 0; i < 6; i += 1) {
    const seed = Math.floor(Math.random() * arr.length);
    result.push(arr[seed]);
  }
  result.push('T');
  return result.join('');
};

export default function AuthRegister() {
  const router = useRouter();
  const [registrationType, setRegistrationType] = useState('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [companyCode, setCompanyCode] = useState(() => generateCompanyCode());
  const [formData, setFormData] = useState({
    homeName: '',
    inverterSerial: '',
    userId: '',
    password: '',
    confirmPassword: '',
    city: '',
    wifiSerial: '',
    timezone: 'Asia/Kolkata',
    stationType: '',
    whatsapp: '',
    account: '',
    companyPassword: '',
    companyConfirmPassword: '',
    companyCode,
    email: ''
  });

  useEffect(() => {
    if (registrationType === 'company' && !companyCode) {
      const newCode = generateCompanyCode();
      setCompanyCode(newCode);
      setFormData(prev => ({ ...prev, companyCode: newCode }));
    }
  }, [registrationType, companyCode]);

  const validateIndividualForm = () => {
    const newErrors = {};

    if (!formData.homeName) newErrors.homeName = 'Home name is required';
    if (!formData.inverterSerial) newErrors.inverterSerial = 'Inverter serial number is required';
    
    if (!formData.userId) {
      newErrors.userId = 'User ID is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.userId) && !/^\d{10}$/.test(formData.userId)) {
      newErrors.userId = 'Please enter a valid email or 10-digit mobile number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.wifiSerial) newErrors.wifiSerial = 'WiFi serial number is required';
    if (!formData.stationType) newErrors.stationType = 'Station type is required';
    
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else if (!/^\d{10}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'Please enter a valid 10-digit number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyForm = () => {
    const newErrors = {};

    if (!formData.account) newErrors.account = 'Account name is required';
    
    if (!formData.companyPassword) {
      newErrors.companyPassword = 'Password is required';
    } else if (formData.companyPassword.length < 8) {
      newErrors.companyPassword = 'Password must be at least 8 characters';
    }

    if (formData.companyPassword !== formData.companyConfirmPassword) {
      newErrors.companyConfirmPassword = 'Passwords do not match';
    }

    if (!formData.companyCode) newErrors.companyCode = 'Company code is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = registrationType === 'individual' 
      ? validateIndividualForm() 
      : validateCompanyForm();

    if (!isValid) return;

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const registrationData = {
        type: registrationType,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('registrationData', JSON.stringify(registrationData));
      router.push('/auth/login?registered=true');
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-register-page">
      <div className="auth-register-container">
        {/* Left Side - Branding */}
        <div className="auth-reg-brand-section">
          <div className="auth-reg-brand-content">
            <div className="auth-reg-logo-container">
              <Image
                src="/Qbits.svg"
                alt="Qbits Energy"
                width={180}
                height={60}
                priority
              />
            </div>
            <h1 className="auth-reg-brand-title">Join Qbits Energy</h1>
            <p className="auth-reg-brand-subtitle">
              Start monitoring your solar energy systems today
            </p>
            <div className="auth-reg-benefits">
              <div className="auth-reg-benefit">
                <div className="auth-reg-benefit-icon">✓</div>
                <div className="auth-reg-benefit-text">Free to get started</div>
              </div>
              <div className="auth-reg-benefit">
                <div className="auth-reg-benefit-icon">✓</div>
                <div className="auth-reg-benefit-text">24/7 system monitoring</div>
              </div>
              <div className="auth-reg-benefit">
                <div className="auth-reg-benefit-icon">✓</div>
                <div className="auth-reg-benefit-text">Expert support team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="auth-reg-form-section">
          <div className="auth-reg-form-wrapper">
            <div className="auth-reg-form-header">
              <h2>Create Your Account</h2>
              <p>Choose your registration type to get started</p>
            </div>

            {/* Registration Type Tabs */}
            <div className="auth-reg-tabs">
              <button
                className={`auth-reg-tab ${registrationType === 'individual' ? 'active' : ''}`}
                onClick={() => setRegistrationType('individual')}
                type="button"
              >
                Individual
              </button>
              <button
                className={`auth-reg-tab ${registrationType === 'company' ? 'active' : ''}`}
                onClick={() => setRegistrationType('company')}
                type="button"
              >
                Company
              </button>
            </div>

            {errors.submit && (
              <div className="auth-reg-error-message">
                {errors.submit}
              </div>
            )}

            <form className="auth-reg-form" onSubmit={handleSubmit}>
              {registrationType === 'individual' ? (
                <>
                  <div className="auth-reg-form-group">
                    <label className="auth-reg-label">Home Name *</label>
                    <input
                      type="text"
                      name="homeName"
                      className={`auth-reg-input ${errors.homeName ? 'error' : ''}`}
                      placeholder="e.g., My Solar Home"
                      value={formData.homeName}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.homeName && <span className="auth-reg-error-text">{errors.homeName}</span>}
                  </div>

                  <div className="auth-reg-form-row">
                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Inverter Serial Number *</label>
                      <input
                        type="text"
                        name="inverterSerial"
                        className={`auth-reg-input ${errors.inverterSerial ? 'error' : ''}`}
                        placeholder="Enter serial number"
                        value={formData.inverterSerial}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {errors.inverterSerial && <span className="auth-reg-error-text">{errors.inverterSerial}</span>}
                    </div>

                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">WiFi Serial Number *</label>
                      <input
                        type="text"
                        name="wifiSerial"
                        className={`auth-reg-input ${errors.wifiSerial ? 'error' : ''}`}
                        placeholder="Enter WiFi serial"
                        value={formData.wifiSerial}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {errors.wifiSerial && <span className="auth-reg-error-text">{errors.wifiSerial}</span>}
                    </div>
                  </div>

                  <div className="auth-reg-form-group">
                    <label className="auth-reg-label">Email or Mobile Number *</label>
                    <input
                      type="text"
                      name="userId"
                      className={`auth-reg-input ${errors.userId ? 'error' : ''}`}
                      placeholder="Enter email or 10-digit mobile"
                      value={formData.userId}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.userId && <span className="auth-reg-error-text">{errors.userId}</span>}
                  </div>

                  <div className="auth-reg-form-row">
                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Password *</label>
                      <div className="auth-reg-password-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          className={`auth-reg-input ${errors.password ? 'error' : ''}`}
                          placeholder="Minimum 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="auth-reg-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeSlashIcon className="auth-reg-icon" /> : <EyeIcon className="auth-reg-icon" />}
                        </button>
                      </div>
                      {errors.password && <span className="auth-reg-error-text">{errors.password}</span>}
                    </div>

                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Confirm Password *</label>
                      <div className="auth-reg-password-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className={`auth-reg-input ${errors.confirmPassword ? 'error' : ''}`}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="auth-reg-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="auth-reg-icon" /> : <EyeIcon className="auth-reg-icon" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="auth-reg-error-text">{errors.confirmPassword}</span>}
                    </div>
                  </div>

                  <div className="auth-reg-form-row">
                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">City *</label>
                      <input
                        type="text"
                        name="city"
                        className={`auth-reg-input ${errors.city ? 'error' : ''}`}
                        placeholder="Enter your city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {errors.city && <span className="auth-reg-error-text">{errors.city}</span>}
                    </div>

                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Station Type *</label>
                      <select 
                        name="stationType"
                        className={`auth-reg-input ${errors.stationType ? 'error' : ''}`}
                        value={formData.stationType}
                        onChange={handleChange}
                        disabled={isLoading}
                      >
                        <option value="">Select type</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                      {errors.stationType && <span className="auth-reg-error-text">{errors.stationType}</span>}
                    </div>
                  </div>

                  <div className="auth-reg-form-row">
                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">WhatsApp Number *</label>
                      <div className="auth-reg-whatsapp-input">
                        <span className="auth-reg-country-code">+91</span>
                        <input
                          type="tel"
                          name="whatsapp"
                          className={`auth-reg-input whatsapp ${errors.whatsapp ? 'error' : ''}`}
                          placeholder="10-digit number"
                          value={formData.whatsapp}
                          onChange={handleChange}
                          disabled={isLoading}
                          maxLength="10"
                        />
                      </div>
                      {errors.whatsapp && <span className="auth-reg-error-text">{errors.whatsapp}</span>}
                    </div>

                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Timezone *</label>
                      <input
                        type="text"
                        name="timezone"
                        className="auth-reg-input"
                        value={formData.timezone}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-reg-form-group">
                    <label className="auth-reg-label">Company Name *</label>
                    <input
                      type="text"
                      name="account"
                      className={`auth-reg-input ${errors.account ? 'error' : ''}`}
                      placeholder="Enter company name"
                      value={formData.account}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.account && <span className="auth-reg-error-text">{errors.account}</span>}
                  </div>

                  <div className="auth-reg-form-group">
                    <label className="auth-reg-label">Company Email *</label>
                    <input
                      type="email"
                      name="email"
                      className={`auth-reg-input ${errors.email ? 'error' : ''}`}
                      placeholder="company@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.email && <span className="auth-reg-error-text">{errors.email}</span>}
                  </div>

                  <div className="auth-reg-form-group">
                    <label className="auth-reg-label">Company Code *</label>
                    <div className="auth-reg-password-wrapper">
                      <input
                        type="text"
                        name="companyCode"
                        className={`auth-reg-input ${errors.companyCode ? 'error' : ''}`}
                        placeholder="Enter unique company code"
                        value={companyCode}
                        readOnly
                      />
                      <button
                        type="button"
                        className="auth-reg-password-toggle"
                        onClick={() => {
                          const newCode = generateCompanyCode();
                          setCompanyCode(newCode);
                          setFormData(prev => ({ ...prev, companyCode: newCode }));
                        }}
                        disabled={isLoading}
                        title="Regenerate company code"
                      >
                        ↻
                      </button>
                    </div>
                    {errors.companyCode && <span className="auth-reg-error-text">{errors.companyCode}</span>}
                  </div>

                  <div className="auth-reg-form-row">
                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Password *</label>
                      <div className="auth-reg-password-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="companyPassword"
                          className={`auth-reg-input ${errors.companyPassword ? 'error' : ''}`}
                          placeholder="Minimum 8 characters"
                          value={formData.companyPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="auth-reg-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeSlashIcon className="auth-reg-icon" /> : <EyeIcon className="auth-reg-icon" />}
                        </button>
                      </div>
                      {errors.companyPassword && <span className="auth-reg-error-text">{errors.companyPassword}</span>}
                    </div>

                    <div className="auth-reg-form-group">
                      <label className="auth-reg-label">Confirm Password *</label>
                      <div className="auth-reg-password-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="companyConfirmPassword"
                          className={`auth-reg-input ${errors.companyConfirmPassword ? 'error' : ''}`}
                          placeholder="Re-enter password"
                          value={formData.companyConfirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="auth-reg-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="auth-reg-icon" /> : <EyeIcon className="auth-reg-icon" />}
                        </button>
                      </div>
                      {errors.companyConfirmPassword && <span className="auth-reg-error-text">{errors.companyConfirmPassword}</span>}
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="auth-reg-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="auth-reg-spinner"></span>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="auth-reg-footer">
              <p>
                Already have an account?{' '}
                <Link href="/auth/login" className="auth-reg-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
