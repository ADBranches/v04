import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import ProtectedRoute from '../components/navigation/protected-route';
import DashboardLayout from '../components/layout/dashboard-layout'; // ADDED IMPORT

interface DashboardStats {
  totalUsers: number;
  totalDestinations: number;
  pendingApprovals: number;
  totalBookings: number;
  revenue: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDestinations: 0,
    pendingApprovals: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // ENHANCED: Simulate API calls with more realistic data
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        totalDestinations: 89,
        pendingApprovals: 23,
        totalBookings: 456,
        revenue: 125430
      };
      
      const mockActivity = [
        { id: 1, action: 'New guide application', user: 'John Doe', time: '2 hours ago', type: 'verification' },
        { id: 2, action: 'Destination approved', user: 'Sarah Guide', time: '4 hours ago', type: 'approval' },
        { id: 3, action: 'New user registered', user: 'Mike Tourist', time: '6 hours ago', type: 'registration' },
        { id: 4, action: 'Booking completed', user: 'Emma Traveler', time: '1 day ago', type: 'booking' }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link, format }: { 
    title: string; 
    value: number; 
    icon: string; 
    color: string; 
    link?: string;
    format?: 'number' | 'currency';
  }) => {
    const formattedValue = format === 'currency' 
      ? `$${value.toLocaleString()}`
      : value.toLocaleString();

    const content = (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formattedValue}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-green-600 font-medium">↑ 12%</span>
            <span className="text-xs text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${color} shadow-sm`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    );

    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 ${link ? 'cursor-pointer group hover:border-uganda-yellow' : ''}`}>
        {link ? (
          <Link to={link} className="block transform group-hover:scale-[1.02] transition-transform duration-200">
            {content}
          </Link>
        ) : content}
      </div>
    );
  };

  const ActivityItem = ({ activity }: { activity: any }) => (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
        activity.type === 'verification' ? 'bg-blue-500' :
        activity.type === 'approval' ? 'bg-green-500' :
        activity.type === 'registration' ? 'bg-purple-500' :
        'bg-orange-500'
      }`}>
        {activity.type === 'verification' ? '👨‍🏫' :
         activity.type === 'approval' ? '✅' :
         activity.type === 'registration' ? '👤' : '💰'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
        <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout> {/* WRAPPED WITH LAYOUT */}
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uganda-yellow mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout> {/* WRAPPED WITH LAYOUT */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-uganda-yellow to-yellow-400 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard</h1>
                <p className="text-yellow-100 opacity-90">Welcome back! Here's what's happening with your platform today.</p>
              </div>
              <div className="hidden md:block">
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="bg-white text-uganda-black px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-md"
                >
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon="👥"
              color="bg-blue-100 text-blue-600"
              link="/admin/users"
            />
            <StatCard
              title="Destinations"
              value={stats.totalDestinations}
              icon="🏞️"
              color="bg-green-100 text-green-600"
              link="/admin/destinations"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              icon="⏳"
              color="bg-yellow-100 text-yellow-600"
              link="/admin/approvals"
            />
            <StatCard
              title="Revenue"
              value={stats.revenue}
              icon="💰"
              color="bg-purple-100 text-purple-600"
              format="currency"
            />
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Link to="/admin/activity" className="text-sm text-uganda-yellow hover:text-yellow-400 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/admin/users"
                  className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-all duration-200 group border border-blue-100"
                >
                  <div className="text-blue-600 text-xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                  <p className="text-sm font-medium text-blue-900">User Management</p>
                </Link>
                <Link
                  to="/admin/approvals"
                  className="p-4 bg-yellow-50 rounded-xl text-center hover:bg-yellow-100 transition-all duration-200 group border border-yellow-100"
                >
                  <div className="text-yellow-600 text-xl mb-2 group-hover:scale-110 transition-transform">✅</div>
                  <p className="text-sm font-medium text-yellow-900">Approvals</p>
                </Link>
                <Link
                  to="/admin/analytics"
                  className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-all duration-200 group border border-green-100"
                >
                  <div className="text-green-600 text-xl mb-2 group-hover:scale-110 transition-transform">📈</div>
                  <p className="text-sm font-medium text-green-900">Analytics</p>
                </Link>
                <Link
                  to="/admin/settings"
                  className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-all duration-200 group border border-purple-100"
                >
                  <div className="text-purple-600 text-xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
                  <p className="text-sm font-medium text-purple-900">Settings</p>
                </Link>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-800 font-medium">API Status</span>
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-800 font-medium">Database</span>
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-yellow-800 font-medium">Cache</span>
                <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">Warning</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}