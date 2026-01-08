import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import type { RegisterRequest, LoginResponse, PasswordValidation } from "../../services/types/auth";

interface RegisterFormProps {
  onSuccess?: (response: LoginResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface RegisterFormData extends RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterForm({ onSuccess, onError, className = "" }: RegisterFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [passwordStrength, setPasswordStrength] = useState<PasswordValidation | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
    if (success) setSuccess("");
    if (name === "password") setPasswordStrength(authService.validatePassword(value));
    if ((name === "password" || name === "confirmPassword") && formData.password && formData.confirmPassword) {
      validatePasswordMatch();
    }
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof RegisterFormData, value: string): boolean => {
    let ok = true; const next = { ...errors };
    if (field === "name") {
      if (!value.trim()) { next.name = "Full name is required"; ok = false; }
      else if (value.trim().length < 2) { next.name = "Name must be at least 2 characters"; ok = false; }
      else next.name = undefined;
    } else if (field === "email") {
      if (!value.trim()) { next.email = "Email is required"; ok = false; }
      else if (!authService.validateEmail(value.trim())) { next.email = "Please enter a valid email address"; ok = false; }
      else next.email = undefined;
    } else if (field === "password") {
      if (!value) { next.password = "Password is required"; ok = false; }
      else {
        const v = authService.validatePassword(value);
        if (!v.isValid) {
          const req: string[] = [];
          if (!v.requirements.minLength) req.push("at least 6 characters");
          if (!v.requirements.hasUpperCase) req.push("one uppercase letter");
          if (!v.requirements.hasLowerCase) req.push("one lowercase letter");
          if (!v.requirements.hasNumbers) req.push("one number");
          if (!v.requirements.hasSpecialChar) req.push("one special character");
          next.password = `Password needs: ${req.join(", ")}`; ok = false;
        } else next.password = undefined;
      }
    } else if (field === "confirmPassword") {
      if (!value) { next.confirmPassword = "Please confirm your password"; ok = false; }
      else if (value !== formData.password) { next.confirmPassword = "Passwords do not match"; ok = false; }
      else next.confirmPassword = undefined;
    }
    setErrors(next);
    return ok;
  };

  const validatePasswordMatch = () => {
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors((p) => ({ ...p, confirmPassword: "Passwords do not match" })); return false;
    } else if (formData.confirmPassword) {
      setErrors((p) => ({ ...p, confirmPassword: undefined })); return true;
    }
    return true;
  };

  const validateForm = () => (
    validateField("name", formData.name) &&
    validateField("email", formData.email) &&
    validateField("password", formData.password) &&
    validateField("confirmPassword", formData.confirmPassword) &&
    validatePasswordMatch()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((p) => ({ ...p, general: undefined }));
    try {
      const result = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (result.success) {
        setSuccess("Account created successfully! Redirecting to dashboard...");
        onSuccess?.(result);
        setTimeout(() => navigate(authService.getDashboardPath()), 2000);
      } else handleRegistrationError(result);
    } catch {
      const msg = "An unexpected error occurred. Please try again.";
      setErrors({ general: msg }); onError?.(msg);
    } finally { setIsLoading(false); }
  };

  const handleRegistrationError = (result: LoginResponse) => {
    let msg = result.error || "Registration failed";
    if (result.code === 409) msg = "An account with this email already exists.";
    else if (result.code === 400) msg = "Please check your information and try again.";
    else if (result.code === 429) msg = "Too many registration attempts. Please wait a few minutes.";
    else if (result.code && result.code >= 500) msg = "Server error. Please try again later.";
    setErrors({ general: msg });
    setFormData((p) => ({ ...p, password: "", confirmPassword: "" }));
    setPasswordStrength(null);
    onError?.(msg);
  };

  const getDisabled = () => {
    const hasErrors = Object.values(errors).some((e) => e !== undefined);
    const hasValues = formData.name.trim() && formData.email.trim() && formData.password && formData.confirmPassword;
    return !hasValues || hasErrors || isLoading;
  };

  const renderPasswordStrength = () => {
    if (!passwordStrength || !formData.password) return null;
    const { strength, score } = passwordStrength;
    const colors = { weak: "bg-red-500", medium: "bg-yellow-500", strong: "bg-green-500" } as const;
    const labels = { weak: "Weak password", medium: "Medium strength", strong: "Strong password" } as const;
    return (
      <div className="space-y-2 mt-2">
        <div className="flex space-x-1">{[1,2,3,4,5].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i <= score ? colors[strength] : "bg-gray-200"}`} />
        ))}</div>
        <p className={`text-sm ${strength==="weak"?"text-red-600":strength==="medium"?"text-yellow-600":"text-green-600"}`}>
          {labels[strength]}
        </p>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-md bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8 ${className}`}>
      <div className="mb-5">
        <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">Full Name</label>
        <input
          id="name" name="name" type="text" required value={formData.name}
          onChange={handleChange} onBlur={() => handleBlur("name")} placeholder="Enter your full name"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.name && touched.name ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.name && touched.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="mb-5">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">Email address</label>
        <input
          id="email" name="email" type="email" required value={formData.email}
          onChange={handleChange} onBlur={() => handleBlur("email")} placeholder="you@example.com"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.email && touched.email ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.email && touched.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div className="mb-5">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
        <input
          id="password" name="password" type="password" required minLength={6} value={formData.password}
          onChange={handleChange} onBlur={() => handleBlur("password")} placeholder="Create a strong password"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.password && touched.password ? "border-red-400" : "border-gray-300"}`}
        />
        {renderPasswordStrength()}
        {errors.password && touched.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div className="mb-5">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">Confirm Password</label>
        <input
          id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword}
          onChange={handleChange} onBlur={() => handleBlur("confirmPassword")} placeholder="Confirm your password"
          className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 bg-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 ${errors.confirmPassword && touched.confirmPassword ? "border-red-400" : "border-gray-300"}`}
        />
        {errors.confirmPassword && touched.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      {errors.general && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{errors.general}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      <button
        type="submit" disabled={getDisabled()}
        className="w-full py-3 mt-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg shadow-md transition-all focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 disabled:opacity-50"
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </button>

      <div className="text-center mt-6">
        <p className="text-gray-700 text-sm">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-yellow-600 hover:text-yellow-500 transition">Sign in</Link>
        </p>
      </div>
    </form>
  );
}
