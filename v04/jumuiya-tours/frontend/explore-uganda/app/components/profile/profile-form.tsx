import React, { useState } from "react";
import type {User} from "../../services/types/user.types"

interface Props {
  user: User;
  onSave: (updates: Partial<User>) => Promise<void>;
}

export default function ProfileForm({ user, onSave }: Props) {
  const [form, setForm] = useState<Partial<User>>(user);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setMessage("Profile updated successfully ✅");
    } catch (err: any) {
      setMessage(err.message || "Failed to update profile ❌");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="bg-safari-sand/50 text-uganda-black px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-uganda-black">Full Name</label>
        <input
          type="text"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-uganda-black">Email</label>
        <input
          type="email"
          value={form.email || ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-uganda-black">Phone</label>
        <input
          type="text"
          value={form.phone_number || ""}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
