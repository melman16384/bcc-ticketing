import { Routes, Route, Navigate } from 'react-router-dom';
import TournamentSelectorPage from './pages/TournamentSelectorPage';
import RegistrationPage from './pages/RegistrationPage';
import HesseRegistrationPage from './pages/HesseRegistrationPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import CheckinPage from './pages/CheckinPage';
import BuchungPage from './pages/BuchungPage';

function RequireAuth({ children }) {
  const token = localStorage.getItem('bcc_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TournamentSelectorPage />} />
      <Route path="/mahrenholz" element={<RegistrationPage />} />
      <Route path="/hesse" element={<HesseRegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/*" element={<RequireAuth><AdminPage /></RequireAuth>} />
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="/buchung/:code" element={<BuchungPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
