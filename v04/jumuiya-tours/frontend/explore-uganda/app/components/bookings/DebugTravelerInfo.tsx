// Create this file: src/components/booking/DebugTravelerInfo.tsx
import { useState, useEffect } from "react";
import { isEmail, isPhone } from "../../utils/validation";

export default function DebugTravelerInfo({ onNext }: { onNext: () => void }) {
  const [formData, setFormData] = useState({
    fullName: "Edwin k",
    email: "bambiedwins03@gmail.com", 
    countryCode: "+256",
    phone: "75675911", // Fixed your phone number
    numTravelers: 1,
    startDate: "",
    endDate: "",
    destination: ""
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    console.log("🔍 TRAVELERINFO MOUNTED - Current state:", formData);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎯 FORM SUBMITTED - Current data:", formData);
    
    const newErrors: string[] = [];
    const fullPhone = `${formData.countryCode}${formData.phone}`;

    // Debug each validation
    console.log("📧 Email validation:", formData.email, isEmail(formData.email));
    console.log("📞 Phone validation:", fullPhone, isPhone(fullPhone));
    console.log("📅 Start date:", formData.startDate, "End date:", formData.endDate);
    console.log("📍 Destination:", formData.destination);

    if (!isEmail(formData.email)) newErrors.push("Invalid email format.");
    if (!isPhone(fullPhone)) newErrors.push("Invalid phone number.");
    if (!formData.startDate || !formData.endDate) newErrors.push("Please select both start and end travel dates.");
    if (!formData.destination.trim()) newErrors.push("Destination is required.");

    console.log("❌ Validation errors:", newErrors);
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("✅ VALIDATION PASSED - Calling onNext()");
    setErrors([]);
    onNext();
  };

  const updateField = (field: string, value: any) => {
    console.log(`🔄 Updating ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-gray-900 text-white rounded-2xl space-y-6">
      <h2 className="text-center text-2xl font-bold text-green-500">Traveler Information</h2>
      
      {errors.length > 0 && (
        <div className="bg-red-900/50 p-4 rounded-lg">
          {errors.map((err, i) => <p key={i} className="text-red-300">• {err}</p>)}
        </div>
      )}

      {/* Simplified form with heavy logging */}
      <div>
        <label>Full Name</label>
        <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
      </div>

      <div>
        <label>Email</label>
        <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Country Code</label>
          <select value={formData.countryCode} onChange={(e) => updateField('countryCode', e.target.value)} className="w-full p-2 bg-gray-800 rounded">
            <option value="+256">Uganda (+256)</option>
          </select>
        </div>
        <div>
          <label>Phone</label>
          <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
        </div>
      </div>

      <div>
        <label>Number of Travelers</label>
        <input type="number" value={formData.numTravelers} onChange={(e) => updateField('numTravelers', Number(e.target.value))} className="w-full p-2 bg-gray-800 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Start Date</label>
          <input type="date" value={formData.startDate} onChange={(e) => updateField('startDate', e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
        </div>
        <div>
          <label>End Date</label>
          <input type="date" value={formData.endDate} onChange={(e) => updateField('endDate', e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
        </div>
      </div>

      <div>
        <label>Destination</label>
        <input type="text" value={formData.destination} onChange={(e) => updateField('destination', e.target.value)} className="w-full p-2 bg-gray-800 rounded" placeholder="Enter destination" />
      </div>

      <button type="submit" className="w-full bg-green-600 p-3 rounded font-bold">Next →</button>
    </form>
  );
}