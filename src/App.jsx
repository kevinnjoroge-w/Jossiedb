import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Loading from './components/ui/Loading';

import UsersPage from './pages/UsersPage';
import InventoryPage from './pages/InventoryPage';
import ProjectsPage from './pages/ProjectsPage';
import { SocketProvider } from './context/SocketContext';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LocationsPage from './pages/LocationsPage';
import TransfersPage from './pages/TransfersPage';
import NotificationsPage from './pages/NotificationsPage';
import MaintenancePage from './pages/MaintenancePage';
import ForemanDashboard from './pages/ForemanDashboard';
import ErrorBoundary from './components/ui/ErrorBoundary';

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
  const { user } = useAuth();

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
        <Route index element={<ErrorBoundary name="Dashboard">{user?.role === 'foreman' ? <ForemanDashboard /> : <Dashboard />}</ErrorBoundary>} />
        <Route path="inventory" element={<ErrorBoundary name="Inventory"><InventoryPage /></ErrorBoundary>} />
        <Route path="notifications" element={<ErrorBoundary name="Notifications"><NotificationsPage /></ErrorBoundary>} />
        <Route path="transfers" element={<ErrorBoundary name="Transfers"><TransfersPage /></ErrorBoundary>} />
        <Route path="maintenance" element={<ErrorBoundary name="Maintenance"><MaintenancePage /></ErrorBoundary>} />
        <Route path="projects" element={<ErrorBoundary name="Projects"><ProjectsPage /></ErrorBoundary>} />
        <Route path="analytics" element={<ErrorBoundary name="Analytics"><AnalyticsPage /></ErrorBoundary>} />
        <Route path="locations" element={<ErrorBoundary name="Locations"><LocationsPage /></ErrorBoundary>} />
        {/* Transfers already defined above */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute roles={['admin', 'supervisor']}>
              <ErrorBoundary name="Audit Logs"><AuditLogsPage /></ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <ErrorBoundary name="Users"><UsersPage /></ErrorBoundary>
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
      <ThemeProvider>
        <SocketProvider>
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
        </SocketProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
