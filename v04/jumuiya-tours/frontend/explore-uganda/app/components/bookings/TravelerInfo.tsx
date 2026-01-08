import { useState } from "react";
import { isEmail, isPhone } from "../../utils/validation";

export default function TravelerInfo({ onNext }: { onNext: () => void }) {
    
  console.log("🚀 UPDATED TravelerInfo Component IS RUNNING!");
  
  const [fullName, setFullName] = useState("edwin k");
  const [email, setEmail] = useState("xyz@gmail.com");
  const [countryCode, setCountryCode] = useState("+256");
  const [phone, setPhone] = useState("786673468");
  const [numTravelers, setNumTravelers] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    // Combine country code and phone before validating
    const fullPhone = `${countryCode}${phone}`.replace(/\s+/g, "");
    
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Start Date:", startDate, "Type:", typeof startDate);
    console.log("End Date:", endDate, "Type:", typeof endDate);
    console.log("Destination:", destination, "Type:", typeof destination);
    console.log("Destination trimmed:", destination.trim(), "Length:", destination.trim().length);

    // Validate email
    if (!isEmail(email)) {
      newErrors.push("Invalid email format.");
    }

    // Validate phone
    if (!isPhone(fullPhone)) {
      newErrors.push("Invalid phone number.");
    }

    // Validate travel dates - FIXED: Check if strings are empty
    if (!startDate || startDate.trim() === "" || !endDate || endDate.trim() === "") {
      console.log("❌ Date validation failed - empty strings");
      newErrors.push("Please select both start and end travel dates.");
    } else {
      console.log("✅ Dates are set:", { startDate, endDate });
    }

    // Validate destination - FIXED: Check if string is empty after trim
    if (!destination || destination.trim() === "") {
      console.log("❌ Destination validation failed - empty string");
      newErrors.push("Destination is required.");
    } else {
      console.log("✅ Destination is set:", destination);
    }

    // Stop here if any validation failed
    if (newErrors.length > 0) {
      console.log("🚫 Blocking form submission. Errors:", newErrors);
      setErrors(newErrors);
      return; // STOP HERE - don't call onNext()
    }

    // Clear errors and advance to the next step
    console.log("✅ ALL VALIDATION PASSED! Moving to next step...");
    setErrors([]);
    onNext();
  };

  // Helper to check if form is ready for debugging
  const isFormReady = startDate && endDate && destination.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8 bg-gray-900 text-white rounded-2xl space-y-6"
    >
      <h2 className="text-center text-2xl font-bold text-green-500">
        Traveler Information
      </h2>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/50 p-4 rounded-lg border border-red-500">
          <p className="font-bold mb-2 text-red-300">Please fix the following:</p>
          {errors.map((err, i) => (
            <p key={i} className="text-red-300 text-sm">
              • {err}
            </p>
          ))}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm mb-1 font-medium">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm mb-1 font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Country Code + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1 font-medium">Country Code</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="+256">Uganda (+256)</option>
            <option value="+254">Kenya (+254)</option>
            <option value="+255">Tanzania (+255)</option>
            <option value="+250">Rwanda (+250)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Travelers Count */}
      <div>
        <label className="block text-sm mb-1 font-medium">Number of Travelers</label>
        <input
          type="number"
          min="1"
          max="20"
          value={numTravelers}
          onChange={(e) => setNumTravelers(Number(e.target.value))}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Start / End Dates - FIXED: Added proper onChange handlers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1 font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              console.log("Start date selected:", e.target.value);
              setStartDate(e.target.value);
            }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              console.log("End date selected:", e.target.value);
              setEndDate(e.target.value);
            }}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Destination - FIXED: Added proper onChange handler */}
      <div>
        <label className="block text-sm mb-1 font-medium">Destination</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => {
            console.log("Destination typed:", e.target.value);
            setDestination(e.target.value);
          }}
          className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g., Kampala, Entebbe, Jinja, etc."
          required
        />
      </div>

      {/* Debug Info - Only show when form has some data */}
      {(startDate || endDate || destination) && (
        <div className="bg-blue-900/30 p-3 rounded text-xs">
          <p><strong>Form State Debug:</strong></p>
          <p>Start Date: {startDate || "Not set"}</p>
          <p>End Date: {endDate || "Not set"}</p>
          <p>Destination: {destination || "Not set"}</p>
          <p>All Required Fields Set: {isFormReady ? "✅ YES" : "❌ NO"}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          className="bg-green-600 px-8 py-3 rounded font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isFormReady}
        >
          Next →
        </button>
      </div>

      {/* Quick Help */}
      <div className="text-center text-sm text-gray-400">
        <p>💡 Make sure to select dates and enter a destination to continue</p>
      </div>
    </form>
  );
}