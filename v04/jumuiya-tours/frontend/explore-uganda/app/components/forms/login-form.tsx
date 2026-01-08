import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import type { LoginRequest, LoginResponse } from "../../services/types/auth";

interface LoginFormProps {
  onSuccess?: (response: LoginResponse) => void;
  onError?: (error: string) => void;
  className?: string; // optional: let the page control width/placement
}

export default function LoginForm({ onSuccess, onError, className = "" }: LoginFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const handleBlur = (field: keyof LoginRequest) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof LoginRequest, value: string): boolean => {
    let isValid = true;
    const next = { ...errors };
    if (field === "email") {
      if (!value.trim()) next.email = "Email is required";
      else if (!authService.validateEmail(value.trim())) next.email = "Please enter a valid email address";
      else next.email = undefined;
    } else if (field === "password") {
      if (!value) next.password = "Password is required";
      else if (value.length < 6) next.password = "Password must be at least 6 characters";
      else next.password = undefined;
    }
    setErrors(next);
    return !next.email && !next.password;
  };

  const validateForm = () => validateField("email", formData.email) && validateField("password", formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: undefined }));
    try {
      const result = await authService.login(formData.email, formData.password);
      if (result.success && result.user && result.token) {
        onSuccess?.(result);
        navigate(authService.getDashboardPath());
      } else handleLoginError(result);
    } catch {
      const msg = "An unexpected error occurred. Please try again.";
      setErrors({ general: msg }); onError?.(msg);
    } finally { setIsLoading(false); }
  };

  const handleLoginError = (result: LoginResponse) => {
    let msg = result.error || "Login failed";
    if (result.code === 401) msg = "Invalid email or password.";
    else if (result.code === 403) msg = "Account not verified. Please check your email.";
    else if (result.code === 429) msg = "Too many login attempts. Try again later.";
    else if (result.code && result.code >= 500) msg = "Server error. Please try again later.";
    else if (result.error?.toLowerCase().includes("network")) msg = "Network error. Check your connection.";
    setErrors({ general: msg });
    setFormData((p) => ({ ...p, password: "" }));
    onError?.(msg);
  };

  const getDisabled = () => {
    const hasErrors = Object.values(errors).some((e) => e !== undefined);
    const hasValues = formData.email.trim() && formData.password;
    return !hasValues || hasErrors || isLoading;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-md bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8 ${className}`}
    >
      {/* Email */}
      <div className="mb-5">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">Email address</label>
        <input
          id="email" name="email" type="email" required value={formData.email}
          onChange={handleChange} onBlur={() => handleBlur("email")}
          placeholder="you@example.com"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.email && touched.email ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.email && touched.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="mb-5">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
        <input
          id="password" name="password" type="password" required value={formData.password}
          onChange={handleChange} onBlur={() => handleBlur("password")}
          placeholder="Enter your password"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.password && touched.password ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.password && touched.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
      </div>

      {/* General error */}
      {errors.general && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-center mb-4 shadow-sm">
          {errors.general}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit" disabled={getDisabled()}
        className="w-full py-3 mt-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg shadow-md transition-all focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="inline-flex items-center">
            <svg className="animate-spin h-5 w-5 text-black mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in...
          </span>
        ) : ("Sign in")}
      </button>

      {/* Links */}
      <div className="mt-6 text-center space-y-3">
        <p className="text-gray-700 text-sm">
          Don’t have an account?{" "}
          <Link to="/auth/register" className="font-semibold text-yellow-600 hover:text-yellow-500 transition">Sign up</Link>
        </p>
        <Link to="/auth/forgot-password" className="text-sm text-gray-600 hover:text-yellow-500 transition">
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}
