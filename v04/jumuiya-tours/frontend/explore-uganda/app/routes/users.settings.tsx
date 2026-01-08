import React from "react";
import SettingsPanel from "../components/profile/settings-panel";

export default function UserSettings() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 font-african">
      <h1 className="text-3xl font-bold font-display text-uganda-black mb-6">
        Account Settings
      </h1>
      <SettingsPanel />
    </div>
  );
}
