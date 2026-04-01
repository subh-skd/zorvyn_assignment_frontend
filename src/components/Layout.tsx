import { useAuth } from "@/contexts/AuthContext";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, LogOut } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-60 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-base font-semibold text-blue-600">
            Zorvyn Finance
          </h1>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </NavLink>

          <NavLink to="/records" className={navLinkClass}>
            <Receipt className="size-4" />
            Financial Records
          </NavLink>

          {user?.role === "ADMIN" && (
            <NavLink to="/users" className={navLinkClass}>
              <Users className="size-4" />
              User Management
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="mb-2 px-3 py-1">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.email}
            </p>
            <span className="inline-block mt-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
