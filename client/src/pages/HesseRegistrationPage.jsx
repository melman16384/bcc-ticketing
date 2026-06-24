import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HesseFormWizard from '../components/hesse/HesseFormWizard';

function WelcomePage({ onStart }) {
  const [regOpen, setRegOpen] = useState(null);

  useEffect(() => {
    fetch('/api/waitlist-status').then((r) => r.json()).then((d) => setRegOpen(d.hesse_registration_open !== false)).catch(() => setRegOpen(true));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #fdf0f0 0%, #fff 60%, #fdf0f0 100%)' }}>
      <header style={{ background: 'linear-gradient(135deg, #e8a0a0 0%, #c0392b 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-10 text-center">
          <img
            src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
            alt="Beachsportclub Cuxhaven e.V."
            className="h-14 mx-auto mb-5 hidden sm:block"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img src="/favicon.png" alt="BCC" className="h-14 w-14 rounded-full mx-auto mb-5 shadow-md sm:hidden" />

          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-4">
            🏢 Firmencup · Sommer 2026 · Cuxhaven
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">
            Heße Immobilien<br />Firmencup 2026
          </h1>
          <p className="text-white/80 text-base mb-2">Beachsportclub Cuxhaven e.V.</p>
          <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
            Treten Sie mit Ihrem Unternehmen im 4er-Mixed Beach-Volleyball an und erleben Sie ein unvergessliches Turniererlebnis direkt am Strand!
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-10 flex-1 space-y-8">

        {/* Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { icon: '🏐', label: '4er-Mixed', sub: 'mind. 1 Dame' },
            { icon: '💶', label: '35 € / Team', sub: 'Startgebühr' },
            { icon: '🏖️', label: 'Strandatmosphäre', sub: 'Cuxhaven' },
            { icon: '🏢', label: 'Firmenwettbewerb', sub: 'Teams & Kollegen' },
          ].map((h) => (
            <div key={h.label} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 space-y-1">
              <p className="text-2xl">{h.icon}</p>
              <p className="text-xs font-bold text-shore-700">{h.label}</p>
              <p className="text-xs text-shore-400">{h.sub}</p>
            </div>
          ))}
        </div>

        {/* Regeln */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-shore-700 text-sm">📋 Spielmodus</h3>
          <ul className="space-y-2 text-sm text-shore-600">
            <li className="flex gap-2"><span className="text-red-500 shrink-0">→</span> 4er-Mixed Mannschaften — immer mind. eine Dame auf dem Feld</li>
            <li className="flex gap-2"><span className="text-red-500 shrink-0">→</span> Maximal 8 Spieler pro Team</li>
            <li className="flex gap-2"><span className="text-red-500 shrink-0">→</span> Teilnahmegebühr: 35,00 € pro Mannschaft</li>
            <li className="flex gap-2"><span className="text-red-500 shrink-0">→</span> Teilnehmerliste bei Anmeldung erforderlich</li>
            <li className="flex gap-2"><span className="text-red-500 shrink-0">→</span> Spielberechtigung nur mit Teilnehmerbändchen</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 pb-4">
          {regOpen === false ? (
            <div className="inline-block bg-red-50 border border-red-200 rounded-2xl px-8 py-5 space-y-1">
              <p className="text-2xl">🔒</p>
              <p className="font-bold text-red-700 text-base">Anmeldung geschlossen</p>
              <p className="text-red-500 text-sm">Die Anmeldephase ist beendet.</p>
            </div>
          ) : (
            <>
              <button
                onClick={onStart}
                disabled={regOpen === null}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #e8a0a0 0%, #c0392b 100%)' }}
              >
                Jetzt anmelden
                <span className="text-xl">→</span>
              </button>
              <p className="text-shore-400 text-xs">Die Anmeldung dauert ca. 2–3 Minuten</p>
            </>
          )}
        </div>
      </div>

      <footer className="text-center text-shore-400 text-xs py-6">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}

export default function HesseRegistrationPage() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  if (!showForm) {
    return <WelcomePage onStart={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  }

  return (
    <div className="min-h-screen bg-shore-50">
      <header style={{ background: 'linear-gradient(135deg, #e8a0a0 0%, #c0392b 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white text-sm font-medium transition mr-1">←</button>
            <img
              src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
              alt="BCC"
              className="h-10 hidden sm:block"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <img src="/favicon.png" alt="BCC" className="h-9 w-9 rounded-full sm:hidden" />
            <div>
              <div className="font-bold text-white text-base leading-tight">Heße Immobilien Firmencup 2026</div>
              <div className="text-white/70 text-xs">Beachsportclub Cuxhaven e.V.</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-xs transition">
            ← Turnierwahl
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <HesseFormWizard />
      </div>

      <footer className="text-center text-shore-400 text-xs py-8">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}
