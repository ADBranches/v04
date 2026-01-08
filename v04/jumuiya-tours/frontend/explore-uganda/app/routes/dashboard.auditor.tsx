import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import type { Destination } from '../services/dashboard.types';

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const [pendingDestinations, setPendingDestinations] = useState<Destination[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== 'auditor') {
      navigate('/auth/login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingDestinations(),
        loadPendingVerifications()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingDestinations = async () => {
    try {
      const response = await dashboardService.getPendingDestinations({ limit: 10 });
      setPendingDestinations(response.destinations);
    } catch (err: any) {
      setError(`Failed to load destinations: ${err.message}`);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      const response = await dashboardService.getVerifications({ limit: 10 });
      setPendingVerifications(response.verifications || []);
    } catch (err: any) {
      setError(`Failed to load verifications: ${err.message}`);
    }
  };

  const approveDestination = async (id: number) => {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await dashboardService.approveDestination(id, notes || '');
      setSuccess('Destination approved successfully');
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve destination');
    }
  };

  const rejectDestination = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      setError('Rejection reason is required');
      return;
    }
    try {
      await dashboardService.rejectDestination(id, reason);
      setSuccess('Destination rejected successfully');
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject destination');
    }
  };

  const approveVerification = async (id: number) => {
    const notes = prompt('Enter approval notes (optional):');
    try {
      await dashboardService.approveVerification(id, notes || '');
      setSuccess('Verification approved successfully');
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve verification');
    }
  };

  const rejectVerification = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      setError('Rejection reason is required');
      return;
    }
    try {
      await dashboardService.rejectVerification(id, reason);
      setSuccess('Verification rejected successfully');
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject verification');
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

        {/* Pending Destinations Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-display text-uganda-black mb-6">Pending Destinations for Review</h2>
          
          {pendingDestinations.length === 0 ? (
            <p className="text-gray-600">No pending destinations to review.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingDestinations.map(dest => (
                <div key={dest.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <img 
                    src={dest.images?.[0] || '/images/uganda-placeholder.jpg'} 
                    alt={dest.name} 
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-6">
                    <h3 className="text-lg font-semibold font-display text-uganda-black">{dest.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {dest.short_description || 'Awaiting review.'}
                    </p>
                    <p className="text-sm text-red-600">Status: {dest.status}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button 
                        onClick={() => navigate(`/destinations/${dest.id}`)}
                        className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african text-sm"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => approveDestination(dest.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-african text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => rejectDestination(dest.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Verifications Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold font-display text-uganda-black mb-6">Pending Verifications</h2>
          
          {pendingVerifications.length === 0 ? (
            <p className="text-gray-600">No pending verifications.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingVerifications.map(ver => (
                <div key={ver.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold font-display text-uganda-black">
                      {ver.user?.name || 'Unknown User'}
                    </h3>
                    <p className="text-gray-600 mb-4">Status: {ver.status}</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => navigate(`/guides/verifications/${ver.id}`)}
                        className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african text-sm"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => approveVerification(ver.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-african text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => rejectVerification(ver.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african text-sm"
                      >
                        Reject
                      </button>
                    </div>
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