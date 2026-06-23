import { calcFees, fmt } from './FormWizard';

export default function Step6Summary({ data, next, prev }) {
  const fees = calcFees(data);

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-5">Gesamtsumme aller Gebühren</h2>

      <div className="space-y-2">
        <div className="fee-row border-b pb-2">
          <span className="text-gray-600">Mannschaftsgebühren:</span>
          <span className="font-semibold">{fmt(fees.mannschaft)}</span>
        </div>
        <div className="fee-row border-b pb-2">
          <span className="text-gray-600">Teilnehmergebühren:</span>
          <span className="font-semibold">{fmt(fees.teilnehmer)}</span>
        </div>
        <div className="fee-row border-b pb-2">
          <span className="text-gray-600">PKW-Gebühren:</span>
          <span className="font-semibold">{fmt(fees.pkw)}</span>
        </div>
        <div className="fee-row border-b pb-2">
          <span className="text-gray-600">Frühstücksgebühren:</span>
          <span className="font-semibold">{fmt(fees.fruehstueck)}</span>
        </div>
        <div className="fee-row pt-1">
          <span className="text-lg font-bold">Gesamtsumme:</span>
          <span className="text-xl font-bold text-bcc-blue">{fmt(fees.gesamt)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Die Zahlungsinformationen werden Ihnen nach Überprüfung Ihrer Daten separat per E-Mail zugeschickt.
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt »</button>
      </div>
    </div>
  );
}
