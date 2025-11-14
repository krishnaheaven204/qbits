'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import './AuthLogin.css';

export default function AuthLogin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email or mobile number is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email) && !/^\d{10}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email or 10-digit mobile number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate API call - Replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem('authToken', 'qbits-token-' + Date.now());
      storage.setItem('userEmail', formData.email);

      router.push('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Login failed. Please check your credentials and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-login-page">
      <div className="auth-login-container">
        {/* Left Side - Branding */}
        <div className="auth-brand-section">
          <div className="auth-brand-content">
            <div className="auth-logo-container">
              <Image
                src="/Qbits.svg"
                alt="Qbits Energy"
                width={180}
                height={60}
                priority
              />
            </div>
            <h1 className="auth-brand-title">Qbits Energy Dashboard</h1>
            <p className="auth-brand-subtitle">
              Monitor and manage your solar energy systems with real-time analytics and insights
            </p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">⚡</div>
                <div className="auth-feature-text">Real-time Monitoring</div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">📊</div>
                <div className="auth-feature-text">Detailed Analytics</div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">🔔</div>
                <div className="auth-feature-text">Instant Alerts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your Qbits Energy account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Email or Mobile Number</label>
                <input
                  type="text"
                  name="email"
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email or mobile number"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && <span className="auth-error-text">{errors.email}</span>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div className="auth-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`auth-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="auth-icon" />
                    ) : (
                      <EyeIcon className="auth-icon" />
                    )}
                  </button>
                </div>
                {errors.password && <span className="auth-error-text">{errors.password}</span>}
              </div>

              <div className="auth-form-options">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="auth-forgot-link">
                  Forgot Password?
                </Link>
              </div>

              {errors.submit && (
                <div className="auth-error-message">
                  {errors.submit}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                New to Qbits Energy?{' '}
                <Link href="/auth/register" className="auth-link">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
