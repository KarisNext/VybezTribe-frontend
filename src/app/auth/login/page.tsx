'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, useSession } from '@/components/includes/Session';

interface LoginFormData {
  identifier: string;
  password: string;
}

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormData>>({});
  
  const router = useRouter();
  const { login, isAuthenticated, isLoading: sessionLoading, user } = useSession();

  useEffect(() => {
    if (!sessionLoading && isAuthenticated && user) {
      router.push('/admin');
    }
  }, [isAuthenticated, sessionLoading, user, router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof LoginFormData]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) {
      setError('');
    }
  }, [fieldErrors, error]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<LoginFormData> = {};
    
    if (!formData.identifier.trim()) {
      errors.identifier = 'Username or phone is required' as any;
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required' as any;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters' as any;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await login({
        identifier: formData.identifier.trim(),
        password: formData.password.trim()
      });
      
      if (result.success && result.authenticated && result.user) {
        router.push('/admin');
      } else {
        const errorMsg = result.error || 'Login failed. Please try again.';
        setError(errorMsg);
      }
      
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, isSubmitting, login, router]);

  if (sessionLoading) {
    return (
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-form-panel">
            <div className="loading-state">
              <div className="loading-spinner">⚡</div>
              <p>Checking authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-header">
              <div className="form-logo">
                <div className="form-logo-icon">🚀</div>
              </div>
              <h1 className="form-title">VybezTribe Admin</h1>
              <p className="form-subtitle">Sign in to your dashboard</p>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                <span className="label-icon">👤</span>
                Username or Phone
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your username or phone number"
                required
                disabled={isSubmitting}
                className={`form-input ${fieldErrors.identifier ? 'error' : ''}`}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
              {fieldErrors.identifier && (
                <span className="field-error" role="alert">
                  {fieldErrors.identifier as string}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting}
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error" role="alert">
                  {fieldErrors.password as string}
                </span>
              )}
            </div>

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner">⚡</span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span className="login-button-icon">🔐</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div className="form-footer">
              <button type="button" className="request-access-button" disabled>
                <span>📝</span>
                <span>Request Access</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginForm />
    </SessionProvider>
  );
}