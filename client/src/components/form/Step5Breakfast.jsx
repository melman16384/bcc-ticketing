import { calcFees, fmt } from './FormWizard';

export default function Step5Breakfast({ data, update, next, prev }) {
  const fees = calcFees(data);
  const set = (name, val) => update({ [name]: Math.max(0, Math.min(150, parseInt(val) || 0)) });

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-5">Frühstück</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="form-label">Wie viele Personen brauchen am Samstag Frühstück? (9,50 € p.P.)</label>
          <input
            type="number"
            className="form-input"
            min={0}
            max={150}
            value={data.fruehstueck_samstag || ''}
            placeholder="0"
            onChange={(e) => set('fruehstueck_samstag', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Summe Samstag: <strong>{fmt(data.fruehstueck_samstag * 9.5)}</strong>
          </p>
        </div>
        <div>
          <label className="form-label">Wie viele Personen brauchen am Sonntag Frühstück? (9,50 € p.P.)</label>
          <input
            type="number"
            className="form-input"
            min={0}
            max={150}
            value={data.fruehstueck_sonntag || ''}
            placeholder="0"
            onChange={(e) => set('fruehstueck_sonntag', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Summe Sonntag: <strong>{fmt(data.fruehstueck_sonntag * 9.5)}</strong>
          </p>
        </div>
      </div>

      <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg fee-row">
        <span>Frühstücksgebühren gesamt:</span>
        <span className="font-bold text-bcc-blue">{fmt(fees.fruehstueck)}</span>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt »</button>
      </div>
    </div>
  );
}
