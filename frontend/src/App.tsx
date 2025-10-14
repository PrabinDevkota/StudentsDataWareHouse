import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/react-query';
import { useIsAuthenticated, useIsLoading } from './stores/auth.store';

// Pages
import LoginPage from './pages/LoginPage.tsx';
import StudentLoginPage from './pages/StudentLoginPage.tsx';
import FacultyLoginPage from './pages/FacultyLoginPage.tsx';
import UnifiedLoginPage from './pages/UnifiedLoginPage.tsx';
import Dashboard from './pages/Dashboard.tsx';
import StudentsPage from './pages/StudentsPage.tsx';
import StudentDetailPage from './pages/StudentDetailPage.tsx';
import PlacementsPage from './pages/PlacementsPage.tsx';
import ClubsPage from './pages/ClubsPage.tsx';
import ProfilePageWrapper from './pages/ProfilePageWrapper.tsx';
import FacultyProfilePage from './pages/FacultyProfilePage.tsx';
import AdminStudentManagement from './pages/AdminStudentManagement.tsx';
import AdminFacultyManagement from './pages/AdminFacultyManagement.tsx';
import AdminClubsManagement from './pages/AdminClubsManagement.tsx';
import ClubStudentPage from './pages/ClubStudentPage.tsx';
import StudentInvitationsPage from './pages/StudentInvitationsPage.tsx';

// Components
import Layout from './components/Layout.tsx';
import LoadingSpinner from './components/ui/LoadingSpinner.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useIsLoading();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <UnifiedLoginPage />
                    </PublicRoute>
                  }
                />
                {/* Legacy routes for backward compatibility */}
                <Route path="/student-login" element={<Navigate to="/login" replace />} />
                <Route path="/faculty-login" element={<Navigate to="/login" replace />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="students/:id" element={<StudentDetailPage />} />
                  <Route path="admin/students" element={<AdminStudentManagement />} />
                  <Route path="admin/faculty" element={<AdminFacultyManagement />} />
                  <Route path="admin/clubs" element={<AdminClubsManagement />} />
                  <Route
                    path="placements"
                    element={
                      <ErrorBoundary>
                        <PlacementsPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="clubs" element={<ClubsPage />} />
                  <Route path="club-student" element={<ClubStudentPage />} />
                  <Route path="invitations" element={<StudentInvitationsPage />} />
                  <Route path="profile" element={<ProfilePageWrapper />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;