import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import authService from '../services/auth.service';
import adminService from '~/services/admin-service';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pages: number;
  limit: number;
}

export default function RoleManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({ role: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.hasRole(['admin'])) {
      navigate('/auth/login');
      return;
    }
    loadUsers();
  }, [navigate]);

  const loadUsers = async (params: any = { page: 1, limit: 10 }) => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({ ...filters, ...params });
      setUsers(response.users || []);
      setPagination(response.pagination || { page: 1, pages: 1, limit: 10 });
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadUsers({ page: 1, limit: 10 });
  };

  const updateRole = async (id: number, role: string) => {
    try {
      await adminService.updateUserRole(id, role);
      setSuccess('Role updated successfully');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display text-uganda-black">Role Management</h1>
        <p className="text-gray-600">Assign roles to users for Jumuiya Tours.</p>
      </header>

      {/* Messages */}
      {error && (
        <div className="bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg font-african mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-safari-forest/10 border border-safari-forest text-safari-forest px-4 py-3 rounded-lg font-african mb-6">
          {success}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-uganda-black font-african">
              Filter by Role
            </label>
            <select 
              id="role"
              name="role"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow font-african"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="guide">Guide</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button 
            type="submit"
            className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-gray-600 mb-2">Email: {user.email}</p>
            <p className="text-sm text-gray-500">Current: {user.role}</p>
            
            <select 
              value={user.role}
              onChange={(e) => updateRole(user.id, e.target.value)}
              className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              <option value="user">User</option>
              <option value="guide">Guide</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2 mt-6">
        {pagination.page > 1 && (
          <button 
            onClick={() => loadUsers({ page: pagination.page - 1, limit: pagination.limit })}
            className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
          >
            Previous
          </button>
        )}
        <span className="px-4 py-2 text-uganda-black font-african">
          Page {pagination.page} of {pagination.pages}
        </span>
        {pagination.page < pagination.pages && (
          <button 
            onClick={() => loadUsers({ page: pagination.page + 1, limit: pagination.limit })}
            className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}