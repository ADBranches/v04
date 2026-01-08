import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="bg-safari-sand min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-uganda-yellow rounded-full flex items-center justify-center">
              <span className="text-uganda-black font-bold text-xl">JT</span>
            </div>
            <span className="text-2xl font-display font-bold text-uganda-black">
              Jumuiya<span className="text-uganda-yellow">Tours</span>
            </span>
          </div>
        </div>
        {/* Outlet for nested auth routes */}
        <Outlet />
      </div>
    </div>
  );
}
