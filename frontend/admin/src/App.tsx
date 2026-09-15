import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VolunteersList from './pages/VolunteersList';
import CreateVolunteer from './pages/CreateVolunteer';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/volunteers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VolunteersList />
            </ProtectedRoute>
          } />
          <Route path="/volunteers/new" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateVolunteer />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
