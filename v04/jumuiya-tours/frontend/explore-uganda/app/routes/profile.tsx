import React, { useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import userService from "../services/user-service";
import ProfileForm from "../components/profile/profile-form";
import SettingsPanel from "../components/profile/settings-panel";

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleSave = async (updates: Partial<any>) => {
    await userService.updateProfile(updates);
    const updated = { ...user, ...updates };
    authService.saveUser(updated); // optional if your service caches user
    setUser(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-safari-sand p-6">
      <h1 className="text-2xl font-bold text-uganda-black mb-6">
        My Profile
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <ProfileForm user={user} onSave={handleSave} />
        </div>
        <SettingsPanel />
      </div>
    </div>
  );
}
