import { calcFees, fmt } from './FormWizard';

export default function Step9Finish({ data, update, prev, onSubmit, submitting }) {
  const fees = calcFees(data);
  const canSubmit = data.ort_datum_name.trim() && data.datenschutz_consent;

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-5">Abschluss</h2>

      {/* Unterschrift */}
      <div className="mb-5">
        <label className="form-label">
          Ort, Datum, Vollständiger Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Musterstadt, 01.01.2026, Maximilian Mustermann"
          value={data.ort_datum_name}
          onChange={(e) => update({ ort_datum_name: e.target.value })}
        />
      </div>

      {/* Datenschutz */}
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 text-bcc-blue rounded"
            checked={data.datenschutz_consent}
            onChange={(e) => update({ datenschutz_consent: e.target.checked })}
          />
          <span className="text-sm text-gray-700">
            Ich stimme der{' '}
            <a
              href="https://cux-beach.de/datenschutzerklaerung/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bcc-blue underline"
            >
              Datenschutzerklärung
            </a>{' '}
            und der Verarbeitung meiner personenbezogenen Daten zu. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {/* Gesamtübersicht */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-5">
        <p className="font-semibold text-sm mb-2 text-gray-600">Zusammenfassung</p>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Anmelder:</span>
            <span className="font-medium">{data.vorname} {data.nachname}</span>
          </div>
          {data.vereinsname && (
            <div className="flex justify-between">
              <span>Verein:</span>
              <span className="font-medium">{data.vereinsname}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>E-Mail:</span>
            <span className="font-medium">{data.email}</span>
          </div>
          <div className="border-t my-2" />
          <div className="flex justify-between font-bold text-base">
            <span>Gesamtsumme:</span>
            <span className="text-bcc-blue">{fmt(fees.gesamt)}</span>
          </div>
        </div>
      </div>

      {!canSubmit && (
        <p className="text-amber-700 text-sm mb-4 p-2 bg-amber-50 rounded border border-amber-200">
          Bitte füllen Sie alle Pflichtfelder aus und stimmen Sie der Datenschutzerklärung zu.
        </p>
      )}

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={prev} disabled={submitting}>« Vorheriger Schritt</button>
        <button
          className="btn-primary min-w-36"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Wird gesendet...' : 'Anmeldung absenden'}
        </button>
      </div>
    </div>
  );
}
