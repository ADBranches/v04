import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { guideService, type Guide } from "../services/guide.service";
import { authService } from "../services/auth.service";
import {
  CheckBadgeIcon,
  MapPinIcon,
  LanguageIcon,
  CurrencyDollarIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

export default function GuideProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchGuide = async () => {
      try {
        const response = await guideService.getGuide(Number(id));
        setGuide(response.guide);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load guide details");
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [id, navigate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-safari-sand flex flex-col items-center justify-center">
        <svg
          className="animate-spin h-12 w-12 text-uganda-yellow mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
          />
        </svg>
        <p className="text-gray-600">Loading guide profile...</p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-safari-sand">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-uganda-black mb-4">Guide not found</h1>
          <Link to="/guides" className="text-uganda-yellow hover:underline">
            ← Back to Guides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative">
            <img
              src={guide.user?.avatar || "/images/guide-placeholder.jpg"}
              alt={guide.user?.name || "Tour Guide"}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-3xl font-bold font-display mb-2">
                  {guide.user?.name || "Unknown Guide"}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    guide.verification_status
                  )}`}
                >
                  {guide.verification_status || "unverified"} Guide
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-uganda-black mb-3 flex items-center">
                  <StarIcon className="w-5 h-5 text-uganda-yellow mr-2" />
                  About Me
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {guide.bio ||
                    "Experienced tour guide passionate about showcasing Uganda’s wildlife, culture, and beauty to the world."}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                {guide.experience_years && (
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 text-uganda-yellow mr-2" />
                    <span>{guide.experience_years} years of experience</span>
                  </div>
                )}

                {guide.languages?.length > 0 && (
                  <div className="flex items-center">
                    <LanguageIcon className="w-5 h-5 text-uganda-yellow mr-2" />
                    <span>{guide.languages.join(", ")}</span>
                  </div>
                )}

                {guide.hourly_rate && (
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-uganda-yellow mr-2" />
                    <span>${guide.hourly_rate}/hour</span>
                  </div>
                )}

                <div className="flex items-center">
                  <div className="flex text-uganda-yellow">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(guide.rating) ? "fill-current" : "fill-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {guide.rating} ({guide.review_count} reviews)
                  </span>
                </div>
              </div>

              {/* Specialties */}
              {guide.specialties?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-uganda-black mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {guide.specialties.map((s, i) => (
                      <span
                        key={i}
                        className="bg-uganda-yellow bg-opacity-20 text-uganda-black px-3 py-1 rounded-full text-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-uganda-black mb-4">Book This Guide</h3>
                {authService.isAuthenticated() ? (
                  <button
                    onClick={() => navigate(`/bookings/create?guide_id=${guide.id}`)}
                    className="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african mb-3"
                  >
                    Book Now
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">
                      Sign in to book this guide
                    </p>
                    <button
                      onClick={() => navigate("/auth/login")}
                      className="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african"
                    >
                      Sign In to Book
                    </button>
                  </div>
                )}

                <div className="mt-4 text-center text-sm text-gray-500">
                  Response time: Usually within 24 hours
                </div>
              </div>

              {/* Verification */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-uganda-black mb-3">
                  Verification & Credentials
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Verified Identity</li>
                  <li>✓ Background Checked</li>
                  <li>✓ Professional Certification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            to="/guides"
            className="text-uganda-yellow hover:underline font-african transition-colors"
          >
            ← Back to All Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
