import { useState, useEffect } from 'react';
import FormWizard from '../components/form/FormWizard';

function WelcomePage({ onStart }) {
  const [waitlist, setWaitlist] = useState({});

  useEffect(() => {
    fetch('/api/waitlist-status').then((r) => r.json()).then(setWaitlist).catch(() => {});
  }, []);

  const cats = [
    { key: 'kotc_maennlich', label: 'King of the Court männlich', icon: '🏐', desc: 'Teams à 4 Spieler' },
    { key: 'kotc_weiblich',  label: 'King of the Court weiblich', icon: '🏐', desc: 'Teams à 4 Spielerinnen' },
    { key: 'kotc_mixed',     label: 'King of the Court mixed',    icon: '🏐', desc: 'Teams à 4 Spieler:innen' },
    { key: 'beach_fun_a',    label: 'Beach-Fun A',                icon: '🌊', desc: 'Für ambitionierte Freizeitspieler' },
    { key: 'beach_fun_b',    label: 'Beach-Fun B',                icon: '🌊', desc: 'Für alle Spielstärken' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f5edd8 0%, #eef6fb 60%, #f5edd8 100%)' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 40%, #aed5e8 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-10 text-center">
          <img
            src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
            alt="Beachsportclub Cuxhaven e.V."
            className="h-16 mx-auto mb-6 hidden sm:block"
          />
          <img src="/favicon.png" alt="BCC" className="h-16 w-16 rounded-full mx-auto mb-5 shadow-md sm:hidden" />

          <div className="inline-flex items-center gap-2 bg-white/50 rounded-full px-4 py-1.5 text-shore-600 text-sm font-medium mb-4">
            🗓️ Sommer 2026 · Cuxhaven
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-shore-800 leading-tight mb-3">
            34. Mahrenholz<br className="sm:hidden" /> Beach-Cup 2026
          </h1>
          <p className="text-shore-600 text-lg mb-2">Beachsportclub Cuxhaven e.V.</p>
          <p className="text-shore-500 text-sm max-w-md mx-auto leading-relaxed">
            Willkommen beim traditionsreichsten Beach-Volleyball-Turnier an der Nordseeküste.
            Jetzt Platz sichern und ein unvergessliches Wochenende erleben!
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-10 flex-1 space-y-8">

        {/* Kategorien */}
        <div>
          <h2 className="text-center text-xs font-bold text-shore-400 uppercase tracking-widest mb-4">
            Kategorien
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cats.map((c) => {
              const full = waitlist[c.key];
              return (
                <div key={c.key} className={`rounded-2xl border p-4 flex items-center gap-4 bg-white transition
                  ${full ? 'border-shore-200 opacity-70' : 'border-ocean-100 shadow-sm'}`}>
                  <span className="text-3xl shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-shore-800 text-sm leading-tight">{c.label}</p>
                    <p className="text-shore-400 text-xs mt-0.5">{c.desc}</p>
                  </div>
                  {full
                    ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 shrink-0">Warteliste</span>
                    : <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">Frei ✓</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { icon: '🏖️', label: 'Strand-Atmosphäre', sub: 'Direkt am Meer' },
            { icon: '🍳', label: 'Frühstück', sub: 'Sa & So buchbar' },
            { icon: '🚗', label: 'Parkplätze', sub: 'Vor Ort verfügbar' },
            { icon: '🏆', label: 'Seit 1993', sub: '34. Austragung' },
          ].map((h) => (
            <div key={h.label} className="bg-white rounded-2xl border border-shore-100 shadow-sm p-4 space-y-1">
              <p className="text-2xl">{h.icon}</p>
              <p className="text-xs font-bold text-shore-700">{h.label}</p>
              <p className="text-xs text-shore-400">{h.sub}</p>
            </div>
          ))}
        </div>

        {/* Gebühren-Übersicht */}
        <div className="bg-white rounded-2xl border border-shore-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-shore-700 text-sm">💰 Startgebühren</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ['King of the Court (alle)', '15,00 € / Team'],
              ['Beach-Fun A oder B', '95,00 € / Team'],
              ['Begleitperson', '20,00 € / Person'],
              ['Kind / Jugendlicher', '13,00 € / Person'],
              ['PKW-Stellplatz', '15,00 € / Fahrzeug'],
              ['Frühstück', '9,50 € / Person / Tag'],
            ].map(([label, price]) => (
              <div key={label} className="flex justify-between items-baseline border-b border-shore-50 pb-1.5">
                <span className="text-shore-600">{label}</span>
                <span className="font-semibold text-shore-800 shrink-0 ml-3">{price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 pb-4">
          {waitlist.registration_open === false ? (
            <div className="inline-block bg-red-50 border border-red-200 rounded-2xl px-8 py-5 space-y-1">
              <p className="text-2xl">🔒</p>
              <p className="font-bold text-red-700 text-base">Anmeldung geschlossen</p>
              <p className="text-red-500 text-sm">Die Anmeldephase ist beendet.</p>
            </div>
          ) : (
            <>
              <button
                onClick={onStart}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #24638a 0%, #1d4f70 100%)' }}
              >
                Jetzt anmelden
                <span className="text-xl">→</span>
              </button>
              <p className="text-shore-400 text-xs">Die Anmeldung dauert ca. 3–5 Minuten</p>
            </>
          )}
        </div>
      </div>

      <footer className="text-center text-shore-400 text-xs py-6">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600 underline-offset-2 hover:underline">cux-beach.de</a>
      </footer>
    </div>
  );
}

export default function RegistrationPage() {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <WelcomePage onStart={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  }

  return (
    <div className="min-h-screen bg-shore-50">
      <header style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 50%, #aed5e8 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(false)}
              className="text-shore-500 hover:text-shore-700 text-sm font-medium transition mr-1"
              title="Zurück zur Startseite"
            >
              ←
            </button>
            <img
              src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
              alt="Beachsportclub Cuxhaven e.V."
              className="h-12 hidden sm:block"
            />
            <img src="/favicon.png" alt="BCC" className="h-10 w-10 rounded-full sm:hidden" />
            <div>
              <div className="font-bold text-shore-800 text-base leading-tight">34. Mahrenholz Beach-Cup 2026</div>
              <div className="text-shore-500 text-xs">Beachsportclub Cuxhaven e.V.</div>
            </div>
          </div>
          <div className="text-xl hidden sm:block">🏐☀️🌊</div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <FormWizard />
      </div>

      <footer className="text-center text-shore-400 text-xs py-8">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}
