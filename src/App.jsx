import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Loading from './components/ui/Loading';

import UsersPage from './pages/UsersPage';
import InventoryPage from './pages/InventoryPage';
import CheckoutsPage from './pages/CheckoutsPage';
import ProjectsPage from './pages/ProjectsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LocationsPage from './pages/LocationsPage';
import TransferRequestsPage from './pages/TransferRequestsPage';

// Placeholder pages (we'll create these next)
const MaintenancePage = () => <div className="text-2xl font-bold">Maintenance Page (Coming Soon)</div>;

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="checkouts" element={<CheckoutsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="transfers" element={<TransferRequestsPage />} />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute roles={['admin', 'supervisor']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '0.75rem',
              padding: '1rem',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
