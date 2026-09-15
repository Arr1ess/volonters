import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VolunteersList from './pages/VolunteersList';
import CreateVolunteer from './pages/CreateVolunteer';

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/volunteers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <VolunteersList key={location.key} />
        </ProtectedRoute>
      } />
      <Route path="/volunteers/new" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <CreateVolunteer />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
