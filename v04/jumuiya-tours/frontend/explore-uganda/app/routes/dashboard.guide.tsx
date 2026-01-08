import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import type { Destination } from '../services/dashboard.types';

export default function GuideDashboard() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== 'guide') {
      navigate('/auth/login');
      return;
    }
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      const response = await dashboardService.getDestinations({ 
        created_by: user?.id,
        limit: 20 
      });
      setDestinations(response.destinations);
    } catch (err: any) {
      setError(err.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const deleteDestination = async (id: number) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      await dashboardService.deleteDestination(id);
      setSuccess('Destination deleted successfully');
      loadDestinations();
    } catch (err: any) {
      setError(err.message || 'Failed to delete destination');
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
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-display text-uganda-black">My Destinations</h1>
          <Link 
            to="/destinations/create" 
            className="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african"
          >
            Create New Destination
          </Link>
        </div>

        {destinations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't created any destinations yet.</p>
            <Link 
              to="/destinations/create" 
              className="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african"
            >
              Create Your First Destination
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map(dest => (
              <div key={dest.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <img 
                  src={dest.images?.[0] || '/images/uganda-placeholder.jpg'} 
                  alt={dest.name} 
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold font-display text-uganda-black">{dest.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {dest.short_description || 'Explore this destination.'}
                  </p>
                  <p className={`text-sm ${
                    dest.status === 'pending' ? 'text-yellow-600' :
                    dest.status === 'approved' ? 'text-green-600' :
                    dest.status === 'rejected' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    Status: {dest.status}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => navigate(`/destinations/${dest.id}`)}
                      className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african text-sm"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => navigate(`/destinations/edit/${dest.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-african text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteDestination(dest.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}