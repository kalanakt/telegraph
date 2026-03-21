import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function DashboardLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-700 px-6 py-4">
          <h1 className="text-xl font-bold">⚡ Telegraph</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <Link
            to="/bots"
            className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            🤖 Bots
          </Link>
        </nav>
        <div className="border-t border-gray-700 px-4 py-4">
          <div className="mb-2 truncate px-3 text-xs text-gray-400">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
