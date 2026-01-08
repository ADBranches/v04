import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import Footer from "./footer";

interface DashboardLayoutProps {
  role?: "admin" | "auditor" | "guide" | "user";
  children: React.ReactNode;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-safari-sand">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
