// app/components/admin/user-management.tsx
import React from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Props {
  users: User[];
  onRoleChange: (id: number, role: string) => void;
}

export default function UserManagement({ users, onRoleChange }: Props) {
  if (users.length === 0)
    return (
      <div className="text-center text-gray-500 py-12">
        No users found in the system.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-uganda-black">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500 mb-2">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
          <select
            value={user.role}
            onChange={(e) => onRoleChange(user.id, e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-uganda-yellow focus:border-uganda-yellow"
          >
            <option value="user">User</option>
            <option value="guide">Guide</option>
            <option value="auditor">Auditor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      ))}
    </div>
  );
}
