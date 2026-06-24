import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CATS = [
  { key: 'kotc_maennlich', nameKey: 'names_kotc_maennlich', label: 'King of the Court männlich' },
  { key: 'kotc_weiblich',  nameKey: 'names_kotc_weiblich',  label: 'King of the Court weiblich' },
  { key: 'kotc_mixed',     nameKey: 'names_kotc_mixed',     label: 'King of the Court mixed'    },
  { key: 'beach_fun_a',    nameKey: 'names_beach_fun_a',    label: 'Beach-Fun A'                },
  { key: 'beach_fun_b',    nameKey: 'names_beach_fun_b',    label: 'Beach-Fun B'                },
];

const STATUS_MAP = {
  pending:          { label: 'Ausstehend',         cls: 'bg-amber-50 text-amber-700 border-amber-200',     icon: '⏳' },
  confirmed:        { label: 'Bestätigt',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' },
  waitlist:         { label: 'Warteliste',          cls: 'bg-sand-50 text-sand-700 border-sand-200',        icon: '📋' },
  payment_received: { label: 'Zahlung eingegangen', cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: '💳' },
  checked_in:       { label: 'Eingecheckt',         cls: 'bg-violet-50 text-violet-700 border-violet-200',  icon: '🎟️' },
  cancelled:        { label: 'Storniert',           cls: 'bg-red-50 text-red-600 border-red-200',           icon: '❌' },
};

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-shore-50 last:border-0">
      <dt className="w-44 shrink-0 text-sm text-shore-400">{label}</dt>
      <dd className="text-sm text-shore-800 font-medium">{value}</dd>
    </div>
  );
}

export default function BuchungPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [reg, setReg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [cancelStep, setCancelStep] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled]   = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    fetch(`/api/buchung/${encodeURIComponent(code.toUpperCase())}`)
      .then((r) => r.ok ? r.json() : r.json().then((j) => Promise.reject(j.error)))
      .then(setReg)
      .catch((e) => setError(typeof e === 'string' ? e : 'Buchung nicht gefunden'))
      .finally(() => setLoading(false));
  }, [code]);

  const doCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const r = await fetch(`/api/buchung/${encodeURIComponent(code.toUpperCase())}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      const j = await r.json();
      if (!r.ok) { setCancelError(j.error || 'Fehler'); setCancelling(false); return; }
      setCancelled(true);
      setReg((prev) => ({ ...prev, status: 'cancelled' }));
    } catch { setCancelError('Verbindungsfehler'); setCancelling(false); }
  };

  const isHesse = reg?.cup === 'hesse';
  const accentBg  = isHesse ? 'linear-gradient(135deg,#e8a0a0,#c0392b)' : 'linear-gradient(135deg,#aed5e8,#1d4f70)';
  const accentText = isHesse ? 'text-red-700' : 'text-ocean-700';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#f5edd8 0%,#eef6fb 60%,#f5edd8 100%)' }}>
      <header style={{ background: accentBg }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <img src="/favicon.png" alt="BCC" className="h-10 w-10 rounded-full shadow-sm" />
          <div>
            <p className="text-white font-bold text-base leading-tight">Buchungsübersicht</p>
            <p className="text-white/70 text-sm">Beachsportclub Cuxhaven e.V.</p>
          </div>
          <button onClick={() => navigate('/')} className="ml-auto text-white/70 hover:text-white text-sm transition">
            ← Startseite
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-shore-400">
            <span className="w-5 h-5 border-2 border-shore-300 border-t-shore-600 rounded-full animate-spin" />
            Buchung wird geladen…
          </div>
        )}

        {error && (
          <div className="card text-center py-12 space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="font-bold text-shore-700 text-lg">Buchung nicht gefunden</p>
            <p className="text-shore-400 text-sm">Der Buchungscode <span className="font-mono font-bold">{code.toUpperCase()}</span> ist ungültig.</p>
            <button onClick={() => navigate('/')} className="btn-secondary mt-2">Zur Startseite</button>
          </div>
        )}

        {reg && !loading && (() => {
          const st = STATUS_MAP[reg.status] || STATUS_MAP.pending;
          const canCancel = reg.status === 'pending' || reg.status === 'waitlist';
          const teams = !isHesse ? CATS.filter((c) => reg[c.key] > 0) : null;

          return (
            <div className="space-y-4">
              {/* Status + Code */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${st.cls}`}>
                    {st.icon} {st.label}
                  </span>
                  <span className={`font-mono text-sm font-bold px-3 py-1 rounded-xl border ${isHesse ? 'text-red-700 bg-red-50 border-red-200' : 'text-ocean-700 bg-ocean-50 border-ocean-200'}`}>
                    {reg.booking_code}
                  </span>
                </div>
                <p className="font-bold text-xl text-shore-800">{reg.vorname} {reg.nachname}</p>
                {isHesse && reg.firma && <p className="text-shore-500 text-sm mt-0.5">{reg.firma}</p>}
                {!isHesse && reg.vereinsname && <p className="text-shore-500 text-sm mt-0.5">{reg.vereinsname}</p>}
                <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${isHesse ? 'bg-red-100 text-red-700' : 'bg-ocean-50 text-ocean-700'}`}>
                  {isHesse ? '🏢 Heße Immobilien Firmencup' : '🌊 34. Mahrenholz Beach-Cup 2026'}
                </span>
              </div>

              {/* Anmeldedaten */}
              <div className="card">
                <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">Anmeldung</p>
                <dl>
                  <Field label="Angemeldet am" value={reg.created_at ? reg.created_at.slice(0,16) + ' Uhr' : null} />
                  <Field label="Bestätigt am"  value={reg.confirmed_at ? reg.confirmed_at.slice(0,16) + ' Uhr' : null} />
                  <Field label="Zahlung"        value={reg.payment_received_at ? '✅ Zahlungseingang bestätigt' : null} />
                  <Field label="Check-in"       value={reg.checked_in_at ? '✅ ' + reg.checked_in_at.slice(0,16) + ' Uhr' : null} />
                  {isHesse ? (
                    <>
                      <Field label="Mannschaften" value={reg.mannschaften ? `${reg.mannschaften}× 4er-Mixed` : null} />
                      <Field label="Teilnehmer"   value={reg.teilnehmer_anzahl || null} />
                      <Field label="Startgebühr"  value={reg.gebuehr_gesamt != null ? Number(reg.gebuehr_gesamt).toFixed(2).replace('.',',') + ' €' : null} />
                    </>
                  ) : (
                    <>
                      {teams && teams.map((c) => (
                        <Field key={c.key} label={c.label} value={`${reg[c.key]}× Team${reg[c.key] > 1 ? 's' : ''}`} />
                      ))}
                      <Field label="Startgebühr" value={reg.gebuehr_gesamt != null ? Number(reg.gebuehr_gesamt).toFixed(2).replace('.',',') + ' €' : null} />
                      {reg.auf_warteliste ? <Field label="Warteliste" value="⏳ Auf der Warteliste" /> : null}
                    </>
                  )}
                </dl>
              </div>

              {/* Teams — Heße */}
              {isHesse && reg.mannschaftsnamen && (
                <div className="card">
                  <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">🏐 Teamnamen</p>
                  <ol className="space-y-1">
                    {reg.mannschaftsnamen.split('\n').filter(Boolean).map((n, i) => (
                      <li key={i} className="text-sm text-shore-700">{i + 1}. {n}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Teams — Mahrenholz */}
              {!isHesse && teams && teams.length > 0 && teams.some((c) => reg[c.nameKey]) && (
                <div className="card">
                  <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">🏐 Teamnamen</p>
                  {teams.map((c) => {
                    const names = (reg[c.nameKey] || '').split('\n').filter(Boolean);
                    if (!names.length) return null;
                    return (
                      <div key={c.key} className="mb-3 last:mb-0">
                        <p className="text-xs font-bold text-shore-500 mb-1">{c.label}</p>
                        <ol className="space-y-0.5">
                          {names.map((n, i) => <li key={i} className="text-sm text-shore-700">{i + 1}. {n}</li>)}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stornierung */}
              {cancelled && (
                <div className="card border-red-200 bg-red-50 text-center py-6 space-y-2">
                  <p className="text-3xl">❌</p>
                  <p className="font-bold text-red-700">Anmeldung wurde storniert</p>
                  <p className="text-red-500 text-sm">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>
                </div>
              )}

              {!cancelled && canCancel && (
                <div className={`card transition ${cancelStep === 1 ? 'border-red-300 bg-red-50' : ''}`}>
                  <p className="text-xs font-bold text-shore-400 uppercase tracking-widest mb-3">Anmeldung stornieren</p>
                  {cancelStep === 0 ? (
                    <>
                      <p className="text-sm text-shore-500 mb-4">Sie können Ihre Anmeldung stornieren, solange sie noch nicht bestätigt wurde.</p>
                      <button className="btn-danger text-sm" onClick={() => setCancelStep(1)}>
                        Anmeldung stornieren
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-red-700 text-sm mb-1">⚠️ Wirklich stornieren?</p>
                      <p className="text-sm text-red-600 mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                      {cancelError && <p className="text-sm text-red-600 mb-3">{cancelError}</p>}
                      <div className="flex gap-3">
                        <button className="btn-secondary flex-1 text-sm" onClick={() => setCancelStep(0)} disabled={cancelling}>
                          Abbrechen
                        </button>
                        <button className="btn-danger flex-1 text-sm" onClick={doCancel} disabled={cancelling}>
                          {cancelling ? 'Wird storniert…' : 'Ja, stornieren'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!cancelled && ['confirmed', 'payment_received', 'checked_in'].includes(reg.status) && (
                <div className="card border-amber-200 bg-amber-50">
                  <p className="text-sm text-amber-700">
                    <strong>Stornierung:</strong> Bestätigte Anmeldungen können nur durch den Veranstalter storniert werden. Bitte melden Sie sich per E-Mail.
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      <footer className="text-center text-shore-400 text-xs py-6">
        © 2026 Beachsportclub Cuxhaven e.V. —{' '}
        <a href="https://cux-beach.de" className="hover:text-shore-600">cux-beach.de</a>
      </footer>
    </div>
  );
}
