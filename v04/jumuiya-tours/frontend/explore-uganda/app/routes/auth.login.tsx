import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service'; // ✅ Fixed import path
import LoginForm from '../components/forms/login-form'; // ✅ Fixed import path
import type { LoginResponse } from '../services/types/auth'; // ✅ Fixed import path

export default function Login() {
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const dashboardPath = authService.getDashboardPath();
      navigate(dashboardPath, { replace: true }); // ✅ Added replace for better UX
    }
  }, [navigate]);

  const handleSuccess = (response: LoginResponse) => {
    // Success callback - navigation is already handled in LoginForm
    console.log('✅ Login successful:', response.user?.email);
  };

  const handleError = (error: string) => {
    console.error('❌ Login error:', error);
  };

  return (
    <div className="bg-safari-sand min-h-screen flex items-center justify-center py-8">
      <div className="max-w-md w-full space-y-8 px-4">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center shadow-md">
              <span className="text-uganda-black font-bold text-xl">JT</span>
            </div>
            <span className="text-2xl font-display font-bold text-uganda-black">
              Jumuiya<span className="text-uganda-yellow">Tours</span>
            </span>
          </div>
          <h2 className="text-3xl font-bold text-uganda-black">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {/* Use the shared LoginForm component */}
        <LoginForm onSuccess={handleSuccess} onError={handleError} />
      </div>
    </div>
  );
}