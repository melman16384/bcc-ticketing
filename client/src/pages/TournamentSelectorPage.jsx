import { useNavigate } from 'react-router-dom';

export default function TournamentSelectorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f5edd8 0%, #eef6fb 60%, #f5edd8 100%)' }}>

      <header style={{ background: 'linear-gradient(135deg, #f0d9ad 0%, #e5c17a 40%, #aed5e8 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <img
            src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
            alt="Beachsportclub Cuxhaven e.V."
            className="h-14 mx-auto mb-4 hidden sm:block"
          />
          <img src="/favicon.png" alt="BCC" className="h-14 w-14 rounded-full mx-auto mb-4 shadow-md sm:hidden" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-shore-800 leading-tight">
            Sommer 2026 · Cuxhaven
          </h1>
          <p className="text-shore-600 mt-1">Beachsportclub Cuxhaven e.V.</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex-1">
        <p className="text-center text-shore-500 text-sm mb-8 uppercase tracking-widest font-semibold">
          Für welches Turnier möchten Sie sich anmelden?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Mahrenholz Cup */}
          <button
            onClick={() => navigate('/mahrenholz')}
            className="group text-left rounded-3xl border-2 border-ocean-100 bg-white shadow-sm hover:shadow-lg hover:border-ocean-300 transition-all duration-200 overflow-hidden"
          >
            <div style={{ background: 'linear-gradient(135deg, #aed5e8 0%, #24638a 100%)' }} className="px-6 py-5">
              <p className="text-white text-2xl font-extrabold leading-tight">34. Mahrenholz<br />Beach-Cup</p>
              <p className="text-white/80 text-sm mt-1">2026</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-shore-600 text-sm leading-relaxed">
                Beach-Volleyball für Vereine & Spielgemeinschaften. King of the Court und Beach-Fun Kategorien.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['🏐 King of the Court ♂','🏐 King of the Court ♀','🏐 King of the Court Mixed','🌊 Beach-Fun A','🌊 Beach-Fun B'].map((t) => (
                  <span key={t} className="text-xs bg-ocean-50 text-ocean-700 border border-ocean-100 rounded-full px-2.5 py-0.5">{t}</span>
                ))}
              </div>
              <p className="text-ocean-600 font-bold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Zur Anmeldung →
              </p>
            </div>
          </button>

          {/* Heße Cup */}
          <button
            onClick={() => navigate('/hesse')}
            className="group text-left rounded-3xl border-2 border-red-100 bg-white shadow-sm hover:shadow-lg hover:border-red-300 transition-all duration-200 overflow-hidden"
          >
            <div style={{ background: 'linear-gradient(135deg, #e8a0a0 0%, #c0392b 100%)' }} className="px-6 py-5">
              <p className="text-white text-2xl font-extrabold leading-tight">Heße Immobilien<br />Firmencup</p>
              <p className="text-white/80 text-sm mt-1">2026</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-shore-600 text-sm leading-relaxed">
                Firmen-Beachvolleyball für Teams aus Unternehmen. 4er-Mixed Mannschaften, mind. eine Dame auf dem Feld.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5">🏢 4er-Mixed</span>
                <span className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5">35 € / Team</span>
                <span className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5">Firmenwettbewerb</span>
              </div>
              <p className="text-red-600 font-bold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Zur Anmeldung →
              </p>
            </div>
          </button>
        </div>
      </div>

      <footer className="text-center text-shore-400 text-xs py-6">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}
