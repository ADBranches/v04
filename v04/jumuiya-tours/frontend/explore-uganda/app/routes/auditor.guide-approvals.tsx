import React, { useState, useEffect } from 'react';
import { guideService } from '../services/guide.service';
import authService from '../services/auth.service';

interface GuideApplication {
  id: number;
  name: string;
  email: string;
  guide_status: 'pending' | 'verified' | 'unverified';
  verification_submitted_at: string;
  created_at: string;
  verification_documents?: string[];
}

interface ModerationRequest {
  id: number;
  content_type: string;
  content_id: number;
  action: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  moderator?: {
    name: string;
    email: string;
  };
  content?: any;
}

export default function AuditorGuideApprovals() {
  const [pendingApplications, setPendingApplications] = useState<GuideApplication[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ModerationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<{ [key: number]: string }>({});
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: number]: string }>({});

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pending guide applications
      const appsResponse = await guideService.getPendingGuides();
      setPendingApplications(appsResponse.pending_applications || appsResponse.pendingGuides || []);
      
      // Load moderation queue for guide verifications
      const moderationResponse = await guideService.getPendingGuides(); // Using same endpoint for now
      setModerationQueue(moderationResponse.pending_applications || []);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load guide applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (applicationId: number, notes: string = '') => {
    try {
      setActionLoading(applicationId);
      await guideService.verifyGuide(applicationId, notes);
      await loadData(); // Reload data
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to approve guide application');
    } finally {
      setActionLoading(null);
      setApprovalNotes(prev => ({ ...prev, [applicationId]: '' }));
    }
  };

  const handleReject = async (applicationId: number, reason: string) => {
    try {
      setActionLoading(applicationId);
      await guideService.rejectGuide(applicationId, reason);
      await loadData(); // Reload data
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject guide application');
    } finally {
      setActionLoading(null);
      setRejectionReasons(prev => ({ ...prev, [applicationId]: '' }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      verified: { color: 'bg-green-100 text-green-800', label: 'Verified' },
      unverified: { color: 'bg-gray-100 text-gray-800', label: 'Unverified' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!authService.hasAnyRole(['admin', 'auditor'])) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guide Approvals</h1>
          <p className="text-gray-600 mt-2">Review and manage guide verification applications</p>
        </div>
        <div className="bg-uganda-yellow px-4 py-2 rounded-lg">
          <span className="text-uganda-black font-semibold">
            Pending Applications: {pendingApplications.length}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
          <div className="text-gray-600 text-sm">Pending Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {pendingApplications.filter(app => app.guide_status === 'verified').length}
          </div>
          <div className="text-gray-600 text-sm">Verified Guides</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{moderationQueue.length}</div>
          <div className="text-gray-600 text-sm">In Moderation</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-600">
            {pendingApplications.filter(app => app.guide_status === 'unverified').length}
          </div>
          <div className="text-gray-600 text-sm">Unverified</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Pending Applications */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Guide Applications</h2>
          <p className="text-gray-600 text-sm">Applications waiting for review and approval</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading guide applications...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {pendingApplications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-lg">No pending guide applications</p>
                <p className="text-sm">All applications have been processed.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.guide_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.verification_submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.verification_documents ? (
                          <div className="space-y-1">
                            {application.verification_documents.map((doc, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                  {doc}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No documents</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                        {application.guide_status === 'pending' && (
                          <>
                            {/* Approval Section */}
                            <div className="space-y-2">
                              <textarea
                                placeholder="Approval notes (optional)"
                                value={approvalNotes[application.id] || ''}
                                onChange={(e) => setApprovalNotes(prev => ({
                                  ...prev,
                                  [application.id]: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-uganda-yellow"
                                rows={2}
                              />
                              <button
                                onClick={() => handleApprove(application.id, approvalNotes[application.id])}
                                disabled={actionLoading === application.id}
                                className="w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === application.id ? 'Approving...' : 'Approve Guide'}
                              </button>
                            </div>

                            {/* Rejection Section */}
                            <div className="space-y-2 mt-2">
                              <input
                                type="text"
                                placeholder="Rejection reason (required)"
                                value={rejectionReasons[application.id] || ''}
                                onChange={(e) => setRejectionReasons(prev => ({
                                  ...prev,
                                  [application.id]: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-uganda-yellow"
                              />
                              <button
                                onClick={() => handleReject(application.id, rejectionReasons[application.id])}
                                disabled={actionLoading === application.id || !rejectionReasons[application.id]}
                                className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === application.id ? 'Rejecting...' : 'Reject Application'}
                              </button>
                            </div>
                          </>
                        )}
                        {application.guide_status !== 'pending' && (
                          <span className="text-gray-400">Already processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={loadData}
            className="bg-uganda-yellow text-uganda-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Refresh Data
          </button>
          <button className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Export Reports
          </button>
          <button className="bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
            View Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}