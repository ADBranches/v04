import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import type { Destination } from '../services/dashboard.types';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }
    loadFeaturedDestinations();
  }, []);

  const loadFeaturedDestinations = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getDestinations({ 
        featured: true, 
        limit: 6 
      });
      setFeaturedDestinations(response.destinations);
    } catch (err: any) {
      setError(err.message || 'Failed to load featured destinations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-safari-sand">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <svg className="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold font-display text-uganda-black mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600">Manage your tours and explore Uganda's beauty</p>
        </div>

        {/* Featured Destinations */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold font-display text-uganda-black mb-6">
            Featured Uganda Destinations
          </h2>
          
          {featuredDestinations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No featured destinations available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDestinations.map(dest => (
                <div key={dest.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <img 
                    src={dest.images?.[0] || '/images/uganda-placeholder.jpg'} 
                    alt={dest.name} 
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-6">
                    <h3 className="text-lg font-semibold font-display text-uganda-black">
                      {dest.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {dest.short_description || 'Explore this amazing destination.'}
                    </p>
                    <p className="text-sm text-yellow-600 font-semibold">
                      Price: {dest.price_range}
                    </p>
                    <button 
                      onClick={() => navigate(`/destinations/${dest.id}`)}
                      className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 mt-4 font-african w-full"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}