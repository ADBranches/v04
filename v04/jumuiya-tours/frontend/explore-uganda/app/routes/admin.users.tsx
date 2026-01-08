import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/user-service';
import authService from '../services/auth.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'auditor' | 'guide' | 'user';
  guide_status?: 'unverified' | 'pending' | 'verified';
  created_at: string;
  is_verified_guide?: boolean;
}

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  guide_status?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    guide_status: ''
  });
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    new_users_today: 0,
    verified_guides: 0,
    pending_guides: 0
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(filters);
      setUsers(response.users || response.data || []);
      
      // Load stats if available
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleRoleUpdate = async (userId: number, newRole: string) => {
    try {
      await userService.updateUserRole(userId, newRole);
      await loadUsers(); // Reload users to reflect changes
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleGuideStatusUpdate = async (userId: number, status: string) => {
    try {
      await userService.updateUser(userId, { guide_status: status });
      await loadUsers(); // Reload users to reflect changes
    } catch (err: any) {
      setError(err.message || 'Failed to update guide status');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  if (!authService.hasRole('admin')) {
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and guide applications</p>
        </div>
        <div className="bg-uganda-yellow px-4 py-2 rounded-lg">
          <span className="text-uganda-black font-semibold">Total Users: {stats.total_users}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
          <div className="text-gray-600 text-sm">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
          <div className="text-gray-600 text-sm">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{stats.new_users_today}</div>
          <div className="text-gray-600 text-sm">New Today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{stats.verified_guides}</div>
          <div className="text-gray-600 text-sm">Verified Guides</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending_guides}</div>
          <div className="text-gray-600 text-sm">Pending Guides</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="auditor">Auditor</option>
              <option value="guide">Guide</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guide Status</label>
            <select
              value={filters.guide_status}
              onChange={(e) => setFilters(prev => ({ ...prev, guide_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              <option value="">All Status</option>
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-uganda-yellow text-uganda-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guide Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-uganda-yellow"
                      >
                        <option value="user">User</option>
                        <option value="guide">Guide</option>
                        <option value="auditor">Auditor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'guide' && (
                        <select
                          value={user.guide_status || 'unverified'}
                          onChange={(e) => handleGuideStatusUpdate(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-uganda-yellow"
                        >
                          <option value="unverified">Unverified</option>
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                        </select>
                      )}
                      {user.role !== 'guide' && (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-uganda-yellow hover:text-yellow-400">
                        View
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-lg shadow border">
        <div className="text-sm text-gray-700">
          Showing {users.length} users
        </div>
        <div className="flex space-x-2">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}