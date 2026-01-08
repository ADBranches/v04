import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api-service";
import authService from "../services/auth.service";
import Loading from "../components/ui/loading";
import type { Destination } from "../services/destination.types";


interface DestinationsResponse {
  destinations: Destination[];
  success: boolean;
  total?: number;
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.get<{ destinations: Destination[] }>("/destinations", {
          params: { 
            featured: true, 
            limit: 6,
            status: "approved"
           },
        });
        setDestinations(response.destinations);
      } catch (err) {
        setError("Failed to load destinations. Please try again later.");
        console.error("Error fetching destinations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-safari-sand">
      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-uganda-yellow via-yellow-400 to-orange-400 py-20 lg:py-28">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative container mx-auto px-4 text-center">
          {/* Logo */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-uganda-black rounded-full flex items-center justify-center shadow-lg">
              <span className="text-uganda-yellow font-bold text-2xl">JT</span>
            </div>
            <span className="text-4xl font-display font-bold text-uganda-black">
              Jumuiya<span className="text-white">Tours</span>
            </span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-uganda-black mb-6 leading-tight">
            Discover Uganda's
            <span className="block text-white bg-uganda-black px-4 py-2 rounded-full inline-block mt-2">
              Hidden Gems
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-uganda-black mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience authentic Ugandan adventures with verified local guides. From wildlife safaris to cultural encounters, 
            create memories that last a lifetime with <span className="font-semibold">Jumuiya Tours</span>.
          </p>
          
          {/* Auth Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <>
                <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                  <div className="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
                    <span className="text-uganda-black font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-uganda-black font-semibold">Welcome, {user.name}!</span>
                </div>
                <div className="flex gap-3">
                  <Link 
                    to="/dashboard"
                    className="bg-uganda-black text-uganda-yellow px-6 py-3 rounded-full font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="border-2 border-uganda-black text-uganda-black px-6 py-3 rounded-full font-semibold hover:bg-uganda-black hover:text-white transition-all duration-300"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/auth/login"
                  className="border-2 border-uganda-black text-uganda-black px-8 py-3 rounded-full font-semibold hover:bg-uganda-black hover:text-white transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth/register"
                  className="bg-uganda-black text-uganda-yellow px-8 py-3 rounded-full font-semibold hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Start Your Adventure
                </Link>
              </>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/destinations"
              className="inline-flex items-center bg-white text-uganda-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              🏞️ Explore Destinations
            </Link>
            <Link
              to="/bookings/create"
              className="inline-flex items-center bg-white text-uganda-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              📅 Book a Tour
            </Link>
            <Link
              to="/guides"
              className="inline-flex items-center bg-white text-uganda-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              👨‍🏫 Find Guides
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-uganda-black text-center mb-4">
            Why Choose Jumuiya Tours?
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're committed to providing authentic, safe, and unforgettable Ugandan experiences
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-uganda-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold text-uganda-black mb-3">Local Expertise</h3>
              <p className="text-gray-600 leading-relaxed">
                Our verified local guides know the best spots and hidden treasures of Uganda. 
                Experience authentic culture beyond tourist routes.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-uganda-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-uganda-black mb-3">Verified Guides</h3>
              <p className="text-gray-600 leading-relaxed">
                All our guides undergo thorough background checks and training to ensure 
                your safety and the highest quality experiences.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-uganda-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-uganda-black mb-3">Easy Booking</h3>
              <p className="text-gray-600 leading-relaxed">
                Simple online booking with secure payments and flexible cancellation policies. 
                Your adventure is just a few clicks away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-uganda-black mb-4">
              Featured Destinations
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover Uganda's most breathtaking locations curated by our local experts
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Loading text="Loading amazing destinations..." />
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-center">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-8 rounded-xl max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-xl">🔍</span>
                  <span className="text-lg font-semibold">No Featured Destinations</span>
                </div>
                <p className="text-yellow-600">Check back soon for amazing destinations!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {destinations.map((destination) => (
                  <div
                    key={destination.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-100"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={destination.images?.[0] || "/images/uganda-placeholder.jpg"}
                        alt={destination.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <span className="bg-uganda-yellow text-uganda-black px-3 py-1 rounded-full text-sm font-semibold">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-uganda-black mb-3 group-hover:text-uganda-yellow transition-colors">
                        {destination.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {destination.short_description || destination.description?.substring(0, 120)}...
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {destination.region}
                        </span>
                        <span className="text-sm font-semibold text-uganda-yellow">
                          {destination.price_range}
                        </span>
                      </div>
                      <Link
                        to={`/destinations/${destination.id}`}
                        className="block w-full bg-uganda-yellow text-uganda-black text-center py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors shadow-md hover:shadow-lg"
                      >
                        Explore Destination
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Destinations CTA */}
              <div className="text-center">
                <Link
                  to="/destinations"
                  className="inline-flex items-center space-x-2 bg-uganda-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span>View All Destinations</span>
                  <span>→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-uganda-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-uganda-yellow mb-2">50+</div>
              <div className="text-gray-300">Verified Guides</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-uganda-yellow mb-2">100+</div>
              <div className="text-gray-300">Destinations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-uganda-yellow mb-2">5K+</div>
              <div className="text-gray-300">Happy Travelers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-uganda-yellow mb-2">98%</div>
              <div className="text-gray-300">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-uganda-yellow to-yellow-400">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-uganda-black mb-6">
            Ready for Your Ugandan Adventure?
          </h2>
          <p className="text-lg text-uganda-black mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered the beauty of Uganda with our trusted local guides. 
            Your unforgettable journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link 
                to="/auth/register"
                className="bg-uganda-black text-uganda-yellow px-8 py-4 rounded-full font-semibold hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
              >
                Create Your Account
              </Link>
            )}
            <Link 
              to="/destinations"
              className="border-2 border-uganda-black text-uganda-black px-8 py-4 rounded-full font-semibold hover:bg-uganda-black hover:text-white transition-all duration-300 text-lg"
            >
              Browse All Destinations
            </Link>
          </div>
          <p className="text-uganda-black mt-6 opacity-80">
            No commitment required • Free cancellation • Best price guarantee
          </p>
        </div>
      </section>
    </div>
  );
}