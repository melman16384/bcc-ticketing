import { useState, useEffect } from 'react';
import Step1Personal from './Step1Personal';
import Step2Teams from './Step2Teams';
import Step3TeamNames from './Step3TeamNames';
import Step4Participants from './Step4Participants';
import Step5Breakfast from './Step5Breakfast';
import Step6Summary from './Step6Summary';
import Step7Orga from './Step7Orga';
import Step8Legal from './Step8Legal';
import Step9Finish from './Step9Finish';

const STEPS = [
  { label: 'Vereinsdaten',  icon: '📝' },
  { label: 'Teamanzahl',    icon: '🏐' },
  { label: 'Teamnamen',     icon: '📋' },
  { label: 'Teilnehmer',    icon: '👥' },
  { label: 'Frühstück',     icon: '☕' },
  { label: 'Summe',         icon: '💰' },
  { label: 'Organisation',  icon: '🗓️' },
  { label: 'Hinweise',      icon: '📄' },
  { label: 'Abschluss',     icon: '✅' },
];

const INITIAL = {
  vereinsname: '', vorname: '', nachname: '',
  strasse: '', ort: '', plz: '',
  email: '', telefon: '', kunden_nr: '',
  kotc_maennlich: 0, kotc_weiblich: 0, kotc_mixed: 0,
  beach_fun_a: 0, beach_fun_b: 0,
  names_kotc_maennlich: '', names_kotc_weiblich: '', names_kotc_mixed: '',
  names_beach_fun_a: '', names_beach_fun_b: '',
  begleitpersonen: 0, kinder_jugendliche: 0, pkw_stellplaetze: 0,
  fruehstueck_samstag: 0, fruehstueck_sonntag: 0,
  ankunftstag: '', transport_bahn_bus: 'Nein',
  transport_pkw: 0, transport_motorrad: 0, transport_wohnmobil: 0,
  zelte_turnier: 0, fremder_camping: 0, ferienwohnung: 0,
  hotel: 0, teilnehmer_anzahl: 0, zuschauer_anzahl: 0,
  ort_datum_name: '', datenschutz_consent: false,
};

export function calcFees(d) {
  const mannschaft = d.kotc_maennlich * 15 + d.kotc_weiblich * 15 + d.kotc_mixed * 15 + d.beach_fun_a * 95 + d.beach_fun_b * 95;
  const teilnehmer = d.begleitpersonen * 20 + d.kinder_jugendliche * 13;
  const pkw = d.pkw_stellplaetze * 15;
  const fruehstueck = (d.fruehstueck_samstag + d.fruehstueck_sonntag) * 9.5;
  return { mannschaft, teilnehmer, pkw, fruehstueck, gesamt: mannschaft + teilnehmer + pkw + fruehstueck };
}

export function fmt(n) {
  return Number(n || 0).toFixed(2).replace('.', ',') + ' €';
}

export default function FormWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL);
  const [waitlistStatus, setWaitlistStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/waitlist-status').then((r) => r.json()).then(setWaitlistStatus).catch(() => {});
  }, []);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
  const next = () => { setStep((s) => Math.min(s + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prev = () => { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      let json;
      try { json = await r.json(); } catch { json = {}; }
      if (!r.ok) throw new Error(json.error || 'Serverfehler – bitte erneut versuchen');
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
        <div className="text-6xl mb-5">{result.waitlist ? '⏳' : '🏐'}</div>
        <h2 className="text-2xl font-bold text-shore-800 mb-3">
          {result.waitlist ? 'Auf der Warteliste eingetragen' : 'Anmeldung erfolgreich!'}
        </h2>
        <p className="text-shore-500 max-w-md mx-auto leading-relaxed">
          {result.waitlist
            ? 'Einige Ihrer gewählten Kategorien sind ausgebucht. Wir haben Sie auf die Warteliste gesetzt und melden uns, sobald ein Platz frei wird.'
            : 'Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungsmail. Nach Überprüfung Ihrer Daten erhalten Sie die Zahlungsinformationen per E-Mail.'}
        </p>
        <div className="mt-8 inline-flex items-center gap-3 text-shore-400 text-sm">
          <span>🌊</span>
          <span>Wir freuen uns auf Sie beim 34. Mahrenholz Beach-Cup!</span>
          <span>☀️</span>
        </div>
        <div className="mt-8 pt-6 border-t border-shore-100">
          <img
            src="https://cux-beach.de/wp-content/uploads/2023/10/BC-Banner-no-bg-600-200-1.png"
            alt="BCC"
            className="h-8 mx-auto opacity-40"
          />
        </div>
      </div>
    );
  }

  const stepProps = { data, update, next, prev, waitlistStatus };

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

        {/* Progress bar */}
        <div className="h-1.5 bg-shore-100 rounded-full mb-3">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #74b5d4, #24638a)',
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 flex-wrap">
          {STEPS.map((s, i) => (
            <div
              key={i}
              title={s.label}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${i === step
                  ? 'bg-ocean-600 text-white shadow-sm'
                  : i < step
                  ? 'bg-sand-100 text-sand-600 border border-sand-200'
                  : 'bg-shore-100 text-shore-400'
                }`}
            >
              {i < step ? '✓' : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Step card */}
      <div className="card">
        <div className="mb-6 pb-4 border-b border-shore-100 flex items-center gap-3">
          <span className="text-2xl">{STEPS[step].icon}</span>
          <div>
            <h2 className="text-lg font-bold text-shore-800">{STEPS[step].label}</h2>
          </div>
        </div>

        {step === 0 && <Step1Personal {...stepProps} />}
        {step === 1 && <Step2Teams {...stepProps} />}
        {step === 2 && <Step3TeamNames {...stepProps} />}
        {step === 3 && <Step4Participants {...stepProps} />}
        {step === 4 && <Step5Breakfast {...stepProps} />}
        {step === 5 && <Step6Summary {...stepProps} />}
        {step === 6 && <Step7Orga {...stepProps} />}
        {step === 7 && <Step8Legal {...stepProps} />}
        {step === 8 && <Step9Finish {...stepProps} onSubmit={submit} submitting={submitting} />}
      </div>
    </div>
  );
}
