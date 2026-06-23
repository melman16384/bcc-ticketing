function NumField({ label, name, value, onChange, min = 0, max = 150, cols }) {
  return (
    <div className={cols}>
      <label className="form-label text-xs">{label}</label>
      <input
        type="number"
        className="form-input"
        min={min}
        max={max}
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(name, Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
      />
    </div>
  );
}

export default function Step7Orga({ data, update, next, prev }) {
  const set = (name, val) => update({ [name]: val });

  return (
    <div>
      <h2 className="text-lg font-bold text-bcc-blue mb-2">Zusätzliche Daten für die Organisation</h2>

      {/* Ankunftstag */}
      <div className="mb-5">
        <label className="form-label">Wir kommen voraussichtlich am...</label>
        <div className="flex gap-4 mt-1">
          {['Freitag', 'Samstag'].map((day) => (
            <label key={day} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ankunftstag"
                value={day}
                checked={data.ankunftstag === day}
                onChange={() => update({ ankunftstag: day })}
                className="text-bcc-blue"
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div className="mb-5">
        <p className="text-sm text-gray-600 mb-3">Bitte wählen Sie aus, womit und mit wie vielen Fahrzeugen Sie kommen:</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label text-xs">Bahn/Bus</label>
            <select
              className="form-input"
              value={data.transport_bahn_bus}
              onChange={(e) => update({ transport_bahn_bus: e.target.value })}
            >
              <option value="Nein">Nein</option>
              <option value="Ja">Ja</option>
            </select>
          </div>
          <NumField label="PKW (Anzahl)" name="transport_pkw" value={data.transport_pkw} onChange={set} />
          <NumField label="Motorrad (Anzahl)" name="transport_motorrad" value={data.transport_motorrad} onChange={set} />
          <NumField label="Wohnmobil (Anzahl)" name="transport_wohnmobil" value={data.transport_wohnmobil} onChange={set} />
        </div>
      </div>

      {/* Unterkunft */}
      <div className="mb-5">
        <p className="form-label">Unterkunft</p>
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Zelte auf Turniergelände (Anzahl)" name="zelte_turnier" value={data.zelte_turnier} onChange={set} />
          <NumField label="Fremder Campingplatz (Personen)" name="fremder_camping" value={data.fremder_camping} onChange={set} />
          <NumField label="Ferienwohnung (Personen)" name="ferienwohnung" value={data.ferienwohnung} onChange={set} />
          <NumField label="Hotel/Jugendherberge (Personen)" name="hotel" value={data.hotel} onChange={set} />
          <NumField label="Teilnehmer" name="teilnehmer_anzahl" value={data.teilnehmer_anzahl} onChange={set} />
          <NumField label="Zuschauer" name="zuschauer_anzahl" value={data.zuschauer_anzahl} onChange={set} />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={prev}>« Vorheriger Schritt</button>
        <button className="btn-primary" onClick={next}>Nächster Schritt »</button>
      </div>
    </div>
  );
}
