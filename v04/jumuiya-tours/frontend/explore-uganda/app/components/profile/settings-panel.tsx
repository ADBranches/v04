import React, { useState } from "react";
import userService from "../../services/user-service";

export default function SettingsPanel() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updatePassword(oldPassword, newPassword);
      setMessage("Password updated successfully ✅");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.message || "Failed to update password ❌");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold font-display text-uganda-black mb-4">
        Security Settings
      </h3>
      {message && (
        <div className="bg-safari-sand/50 text-uganda-black px-4 py-2 rounded-lg mb-4">
          {message}
        </div>
      )}
      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
        >
          {saving ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
