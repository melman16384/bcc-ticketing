import { useState } from 'react';
import HesseStep1Contact from './HesseStep1Contact';
import HesseStep2Teams from './HesseStep2Teams';
import HesseStep3Legal from './HesseStep3Legal';

const STEPS = [
  { label: 'Ansprechpartner', icon: '👤' },
  { label: 'Mannschaften',    icon: '🏐' },
  { label: 'Abschluss',       icon: '✅' },
];

const INITIAL = {
  firma: '', kunden_nr: '',
  vorname: '', nachname: '',
  strasse: '', ort: '', plz: '',
  telefon: '', email: '',
  mannschaften: 0,
  mannschaftsnamen: '',
  teilnehmer_anzahl: '',
  ort_datum_name: '',
  datenschutz_consent: false,
};

export default function HesseFormWizard() {
  const [step, setStep]           = useState(0);
  const [data, setData]           = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
  const next   = () => { setStep((s) => Math.min(s + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prev   = () => { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/hesse/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Fehler');
      setResult(json);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="card text-center py-12 px-8">
        <div className="text-6xl mb-5">🏆</div>
        <h2 className="text-2xl font-bold text-shore-800 mb-3">Anmeldung erfolgreich!</h2>
        <p className="text-shore-500 max-w-md mx-auto leading-relaxed mb-6">
          Vielen Dank für Ihre Anmeldung zum Heße Immobilien Firmencup 2026!
          Sie erhalten in Kürze eine Bestätigungsmail. Nach Prüfung Ihrer Daten erhalten Sie die Zahlungsinformationen per E-Mail.
        </p>
        <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-3 mb-6">
          <span className="font-mono text-xl font-bold tracking-widest text-red-700">{result.booking_code}</span>
        </div>
        <p className="text-shore-400 text-sm">Ihr Buchungscode — bitte als Verwendungszweck bei der Zahlung angeben.</p>
        <div className="mt-8 pt-6 border-t border-shore-100">
          <img src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png" alt="BCC" className="h-8 mx-auto opacity-40" />
        </div>
      </div>
    );
  }

  const stepProps = { data, update, next, prev };

  return (
    <div className="space-y-4">
      {/* Step navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-shore-500 uppercase tracking-wide">
            Schritt {step + 1} / {STEPS.length}
          </span>
          <span className="text-sm font-semibold text-shore-700">
            {STEPS[step].icon} {STEPS[step].label}
          </span>
        </div>
        <div className="h-1.5 bg-shore-100 rounded-full mb-3">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #e8a0a0, #c0392b)' }}
          />
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
              ${i === step ? 'bg-red-600 text-white shadow-sm' : i < step ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-shore-100 text-shore-400'}`}>
              {i < step ? '✓' : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">⚠️ {error}</div>
      )}

      <div className="card">
        <div className="mb-6 pb-4 border-b border-shore-100 flex items-center gap-3">
          <span className="text-2xl">{STEPS[step].icon}</span>
          <h2 className="text-lg font-bold text-shore-800">{STEPS[step].label}</h2>
        </div>
        {step === 0 && <HesseStep1Contact {...stepProps} />}
        {step === 1 && <HesseStep2Teams {...stepProps} />}
        {step === 2 && <HesseStep3Legal {...stepProps} onSubmit={submit} submitting={submitting} />}
      </div>
    </div>
  );
}
