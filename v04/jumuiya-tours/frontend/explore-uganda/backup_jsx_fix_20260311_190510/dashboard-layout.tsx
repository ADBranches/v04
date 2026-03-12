import { useState, type ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import Footer from "./footer";

interface DashboardLayoutProps {
  role?: "admin" | "auditor" | "guide" | "user";
  children: ReactNode;
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-safari-sand">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          role={role}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>

        <Footer />
      </div>
    </div>
  );
}