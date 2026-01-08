import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/user-service";
import { authService } from "../services/auth.service";
import type { UserProfile } from "../services/user-service";
import ProfileForm from "../components/profile/profile-form";

export default function UserProfile() {
  const navigate = useNavigate();

  /* ─────────── STATE ─────────── */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, any>>({});

  /* ─────────── INIT ─────────── */
  useEffect(() => {
    const current = authService.getCurrentUser();
    if (!authService.isAuthenticated() || !current) {
      navigate("/auth/login");
      return;
    }
    loadProfile();
  }, []);

  /* ─────────── LOAD PROFILE ─────────── */
  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userService.getProfile();
      setUser(data);
      setPreferences(data.preferences || {});
    } catch (err: any) {
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── UPDATE PROFILE ─────────── */
  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await userService.updateProfile(updates);
      setUser(updated);
      setSuccess("✅ Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Profile update failed");
    }
  };

  /* ─────────── AVATAR UPLOAD ─────────── */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await userService.uploadProfileImage(file);
      setUser((prev) => (prev ? { ...prev, profile_image: res.image_url } : prev));
      setSuccess("✅ Profile image updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload profile image");
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ─────────── UPDATE PREFERENCES ─────────── */
  const handlePreferencesChange = async (key: string, value: any) => {
    try {
      const updated = await userService.updatePreferences({ [key]: value });
      setPreferences(updated.preferences);
      setSuccess("✅ Preferences updated");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to update preferences");
    }
  };

  /* ─────────── LOADING STATES ─────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center font-african text-gray-600">
        <svg
          className="animate-spin h-10 w-10 text-uganda-yellow mr-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 font-african">
        <p>{error}</p>
        <button
          onClick={loadProfile}
          className="mt-4 bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ─────────── MAIN VIEW ─────────── */
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 font-african">
      <header className="flex flex-col md:flex-row items-center gap-6 mb-8">
        {/* Avatar */}
        <div className="relative">
          <img
            src={user?.profile_image || "/default-avatar.png"}
            alt="Profile"
            className="w-32 h-32 object-cover rounded-full shadow-md border-2 border-safari-sand"
          />
          <label
            htmlFor="avatar-upload"
            className={`absolute bottom-0 right-0 bg-uganda-yellow text-uganda-black rounded-full p-2 cursor-pointer shadow-md ${
              avatarUploading && "opacity-50 cursor-not-allowed"
            }`}
          >
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={avatarUploading}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </label>
        </div>

        {/* Header Info */}
        <div>
          <h1 className="text-3xl font-bold font-display text-uganda-black">{user?.name}</h1>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500 mt-1 capitalize">{user?.role}</p>
        </div>
      </header>

      {/* Feedback Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Form */}
      {user && <ProfileForm user={user} onSave={handleProfileUpdate} />}

      {/* Preferences */}
      <section className="mt-10">
        <h2 className="text-xl font-display font-semibold text-uganda-black mb-4">
          Preferences
        </h2>
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span>Dark Mode</span>
            <input
              type="checkbox"
              checked={preferences.dark_mode || false}
              onChange={(e) => handlePreferencesChange("dark_mode", e.target.checked)}
              className="w-5 h-5 accent-uganda-yellow"
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Email Notifications</span>
            <input
              type="checkbox"
              checked={preferences.email_notifications || false}
              onChange={(e) => handlePreferencesChange("email_notifications", e.target.checked)}
              className="w-5 h-5 accent-uganda-yellow"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
