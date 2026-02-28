import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CarsPage } from "@/pages/CarsPage";
import { AdminCarsPage } from "@/pages/AdminCarsPage";
import { AdminRentalsPage } from "@/pages/AdminRentalsPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";

/** Log navigation events for debugging  */
function NavigationLogger() {
  const location = useLocation();
  useEffect(() => {
    console.debug("[App] User navigated to:", location.pathname);
  }, [location.pathname]);
  return null;
}

/** Public routes redirect to /cars when already authenticated */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/cars" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <NavigationLogger />
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected — regular users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cars" element={<CarsPage />} />

            {/* Admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/cars" element={<AdminCarsPage />} />
              <Route path="/admin/rentals" element={<AdminRentalsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/cars" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
