import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/** Extends ProtectedRoute — additionally requires admin or superadmin role. */
export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    console.warn("[AdminRoute] Access denied for role:", user?.role);
    return <Navigate to="/cars" replace />;
  }

  return <Outlet />;
}
