import { calcFees, fmt } from './FormWizard';

function NumField({ label, name, value, onChange, min = 0, max = 150, hint }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type="number"
        className="form-input"
        min={min}
        max={max}
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(name, Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function Step4Participants({ data, update, next, prev }) {
  const fees = calcFees(data);
  const set = (name, val) => update({ [name]: val });

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-2">Informationen zu den Teilnehmern</h2>
      <p className="text-sm text-gray-600 mb-5">Für die Organisationsplanung benötigen wir folgende Angaben.</p>

      <div className="grid grid-cols-1 gap-4">
        <NumField
          label="Wie viele Teilnehmer/Begleitpersonen kommen mit? (20 € p.P.)"
          name="begleitpersonen"
          value={data.begleitpersonen}
          onChange={set}
        />
        <NumField
          label="Wie viele Kinder/Jugendliche (6–18 Jahre) kommen mit? (13 € p.P.)"
          name="kinder_jugendliche"
          value={data.kinder_jugendliche}
          onChange={set}
        />
        <NumField
          label="Wie viele PKW-Stellplätze werden benötigt? (15 € Stellplatz)"
          name="pkw_stellplaetze"
          value={data.pkw_stellplaetze}
          min={0}
          max={10}
          hint="KEINE ANHÄNGER / WOHNMOBILE / KLEINTRANSPORTER"
          onChange={set}
        />
      </div>

      <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-1">
        <div className="fee-row">
          <span>Teilnehmergebühren:</span>
          <span className="font-semibold">{fmt(fees.teilnehmer)}</span>
        </div>
        <div className="fee-row">
          <span>PKW-Gebühren:</span>
          <span className="font-semibold">{fmt(fees.pkw)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt »</button>
      </div>
    </div>
  );
}
