import { Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import CheckinPage from './pages/CheckinPage';

function RequireAuth({ children }) {
  const token = localStorage.getItem('bcc_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/*" element={<RequireAuth><AdminPage /></RequireAuth>} />
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
