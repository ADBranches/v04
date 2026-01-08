import { Outlet } from 'react-router';
import AdminSidebar from '../components/admin-sidebar';

export default function AdminLayout() {
  return (
    <div className="bg-safari-sand min-h-screen font-african">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
