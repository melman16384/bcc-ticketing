import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      localStorage.setItem('bcc_token', j.token);
      localStorage.setItem('bcc_user', JSON.stringify(j.user));
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: beach decoration */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #e5c17a 0%, #d4a04a 40%, #74b5d4 100%)' }}
      >
        <div>
          <img
            src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
            alt="BCC"
            className="h-12"
          />
        </div>
        <div className="text-shore-800">
          <div className="text-6xl mb-4">🏐</div>
          <h2 className="text-3xl font-bold mb-2">34. Mahrenholz<br />Beach-Cup 2026</h2>
          <p className="text-shore-700 text-lg">Beachsportclub Cuxhaven e.V.</p>
        </div>
        <div className="flex gap-3 text-3xl">
          <span>🌊</span><span>☀️</span><span>🏖️</span><span>🌴</span>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-shore-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <img
              src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
              alt="BCC"
              className="h-10 mx-auto mb-3"
            />
          </div>

          <p className="text-shore-500 text-sm mb-1 font-medium">Admin-Bereich</p>
          <h1 className="text-2xl font-bold text-shore-800 mb-8">Anmelden</h1>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="form-label">E-Mail-Adresse</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@bcc-ticketing.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="form-label">Passwort</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-1" disabled={loading}>
              {loading ? 'Anmelden…' : 'Anmelden →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-shore-200 text-center">
            <a href="/" className="text-ocean-600 hover:text-ocean-700 text-sm font-medium transition">
              🏐 Zur Anmeldung
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
